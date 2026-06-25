import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WhatsAppConnectionStatus, WhatsAppEventType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { UpdateWhatsAppSettingsDto } from './dto/update-whatsapp-settings.dto';
import { EvolutionApiAdapter } from './providers/evolution-api.adapter';
import type { WhatsAppQrResponse } from './providers/evolution-api.types';
import { buildWhatsAppInstanceName } from './whatsapp-instance-name';

export const defaultWhatsAppEvents: WhatsAppEventType[] = [
  WhatsAppEventType.ORDER_CREATED,
  WhatsAppEventType.ORDER_CONFIRMED,
  WhatsAppEventType.ORDER_CANCELLED,
  WhatsAppEventType.ORDER_READY,
  WhatsAppEventType.ORDER_OUT_FOR_DELIVERY,
  WhatsAppEventType.ORDER_DELIVERED,
];

@Injectable()
export class WhatsAppConnectionService {
  private readonly logger = new Logger(WhatsAppConnectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evolutionApi: EvolutionApiAdapter,
  ) {}

  async getSettings(tenantId: string) {
    const [tenant, connection] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { whatsapp: true },
      }),
      this.prisma.whatsAppConnection.findUnique({
        where: { tenantId },
      }),
    ]);

    if (!tenant) {
      throw new BadRequestException('Tenant nao encontrado.');
    }

    const providerConfigured = this.evolutionApi.isConfigured();
    const currentConnection =
      providerConfigured && connection?.instanceName
        ? await this.refreshConnectionStatus(tenantId, connection)
        : connection;

    return {
      automationEnabled: currentConnection?.automationEnabled ?? false,
      enabledEvents: currentConnection?.enabledEvents ?? defaultWhatsAppEvents,
      status: providerConfigured
        ? (currentConnection?.status ?? WhatsAppConnectionStatus.DISCONNECTED)
        : WhatsAppConnectionStatus.AWAITING_CONFIGURATION,
      connectedPhone: currentConnection?.connectedPhone ?? null,
      recipientPhone: tenant.whatsapp ?? null,
      lastError: currentConnection?.lastError ?? null,
      lastConnectedAt: currentConnection?.lastConnectedAt ?? null,
      provider: 'EVOLUTION_API' as const,
      providerConfigured,
      qrCodeAvailable:
        providerConfigured &&
        currentConnection?.status !== WhatsAppConnectionStatus.CONNECTED,
    };
  }

  async updateSettings(tenantId: string, dto: UpdateWhatsAppSettingsDto) {
    const providerConfigured = this.evolutionApi.isConfigured();
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant nao encontrado.');
    }

    await this.prisma.whatsAppConnection.upsert({
      where: { tenantId },
      create: {
        tenantId,
        automationEnabled: dto.automationEnabled ?? false,
        enabledEvents: dto.enabledEvents ?? defaultWhatsAppEvents,
        instanceName: buildWhatsAppInstanceName(tenantId, tenant.slug),
        status: providerConfigured
          ? WhatsAppConnectionStatus.DISCONNECTED
          : WhatsAppConnectionStatus.AWAITING_CONFIGURATION,
      },
      update: {
        automationEnabled: dto.automationEnabled,
        enabledEvents: dto.enabledEvents,
        status: providerConfigured
          ? undefined
          : WhatsAppConnectionStatus.AWAITING_CONFIGURATION,
      },
    });

    return this.getSettings(tenantId);
  }

  async getPublicStatus(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        isActive: true,
        whatsappConnection: {
          select: {
            automationEnabled: true,
            status: true,
          },
        },
      },
    });

    if (!tenant?.isActive) {
      return {
        automationEnabled: false,
        status: WhatsAppConnectionStatus.DISCONNECTED,
      };
    }

    return {
      automationEnabled:
        Boolean(tenant.whatsappConnection?.automationEnabled) &&
        this.evolutionApi.isConfigured() &&
        tenant.whatsappConnection?.status ===
          WhatsAppConnectionStatus.CONNECTED,
      status: this.evolutionApi.isConfigured()
        ? (tenant.whatsappConnection?.status ??
          WhatsAppConnectionStatus.DISCONNECTED)
        : WhatsAppConnectionStatus.AWAITING_CONFIGURATION,
    };
  }

  async getQrCode(tenantId: string): Promise<WhatsAppQrResponse> {
    let instanceName = '';

    try {
      if (!this.evolutionApi.isConfigured()) {
        return {
          status: 'ERROR',
          instanceName,
          message:
            'Evolution API nao configurada no servidor. O envio manual continua disponivel.',
        };
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, slug: true },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant nao encontrado.');
      }

      const existingConnection =
        await this.prisma.whatsAppConnection.findUnique({
          where: { tenantId },
        });
      instanceName = this.evolutionApi.sanitizeInstanceName(
        existingConnection?.instanceName ??
          buildWhatsAppInstanceName(tenant.id, tenant.slug),
      );

      const connection = await this.prisma.whatsAppConnection.upsert({
        where: { tenantId },
        create: {
          tenantId,
          instanceName,
          status: WhatsAppConnectionStatus.DISCONNECTED,
          enabledEvents: defaultWhatsAppEvents,
        },
        update: { instanceName },
      });

      const instances = await this.evolutionApi.fetchInstances(instanceName);
      let providerInstance = instances.find(
        (instance) => instance.instanceName === instanceName,
      );
      let provisionedQrCode:
        | { qrCodeBase64?: string; qrCode?: string }
        | undefined;
      let createdNow = false;

      if (!providerInstance) {
        try {
          const provisioned =
            await this.evolutionApi.createInstance(instanceName);
          providerInstance = provisioned.instance;
          provisionedQrCode = provisioned.qrCode;
          createdNow = true;
        } catch (error) {
          const refreshedInstances =
            await this.evolutionApi.fetchInstances(instanceName);
          providerInstance = refreshedInstances.find(
            (instance) => instance.instanceName === instanceName,
          );

          if (!providerInstance) throw error;
        }
      }

      await this.evolutionApi.configureWebhook(instanceName);
      this.logger.log(
        `Webhook Evolution configurado para o tenant ${tenantId} na instancia ${instanceName}.`,
      );

      const connectionState = createdNow
        ? { state: providerInstance.status ?? 'created' }
        : await this.evolutionApi.getConnectionStatus(instanceName);
      const connectedPhone =
        connectionState.connectedPhone ??
        this.normalizeConnectedPhone(providerInstance.owner);

      if (this.isConnected(connectionState.state)) {
        await this.prisma.whatsAppConnection.update({
          where: { id: connection.id },
          data: {
            status: WhatsAppConnectionStatus.CONNECTED,
            connectedPhone,
            lastConnectedAt: new Date(),
            lastError: null,
          },
        });

        return {
          status: 'CONNECTED',
          instanceName,
          connectedPhone,
          message: 'WhatsApp conectado.',
        };
      }

      const qrCode = this.hasQrCode(provisionedQrCode)
        ? provisionedQrCode
        : await this.evolutionApi.connectInstance(instanceName);

      await this.prisma.whatsAppConnection.update({
        where: { id: connection.id },
        data: {
          status: WhatsAppConnectionStatus.DISCONNECTED,
          connectedPhone: null,
          lastError: null,
        },
      });

      return {
        status: 'QR_PENDING',
        instanceName,
        qrCodeBase64: qrCode.qrCodeBase64,
        qrCode: qrCode.qrCode,
        message:
          qrCode.qrCodeBase64 || qrCode.qrCode
            ? 'Aguardando leitura do QR Code.'
            : 'Instancia criada, mas a Evolution API ainda nao retornou um QR Code.',
      };
    } catch (error) {
      const message = this.sanitizeProviderError(error);

      await this.prisma.whatsAppConnection
        .update({
          where: { tenantId },
          data: {
            status: WhatsAppConnectionStatus.ERROR,
            lastError: message.slice(0, 500),
          },
        })
        .catch(() => undefined);

      this.logger.warn(
        `Falha ao provisionar WhatsApp do tenant ${tenantId}: ${message}`,
      );

      return {
        status: 'ERROR',
        instanceName,
        message,
      };
    }
  }

  private async refreshConnectionStatus(
    tenantId: string,
    connection: {
      id: string;
      tenantId: string;
      automationEnabled: boolean;
      status: WhatsAppConnectionStatus;
      instanceName: string | null;
      connectedPhone: string | null;
      enabledEvents: WhatsAppEventType[];
      lastError: string | null;
      lastConnectedAt: Date | null;
      provider: unknown;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    if (!connection.instanceName) return connection;

    try {
      const connectionState = await this.evolutionApi.getConnectionStatus(
        connection.instanceName,
      );

      if (this.isConnected(connectionState.state)) {
        await this.evolutionApi.configureWebhook(connection.instanceName);
        this.logger.log(
          `Webhook Evolution configurado para o tenant ${tenantId} na instancia ${connection.instanceName}.`,
        );

        return this.prisma.whatsAppConnection.update({
          where: { id: connection.id },
          data: {
            status: WhatsAppConnectionStatus.CONNECTED,
            connectedPhone:
              connectionState.connectedPhone ?? connection.connectedPhone,
            lastConnectedAt: new Date(),
            lastError: null,
          },
        });
      }

      return this.prisma.whatsAppConnection.update({
        where: { id: connection.id },
        data: {
          status: WhatsAppConnectionStatus.DISCONNECTED,
          connectedPhone: null,
          lastError: null,
        },
      });
    } catch (error) {
      const message = this.sanitizeProviderError(error);
      this.logger.warn(
        `Falha ao consultar status real do WhatsApp do tenant ${tenantId}: ${message}`,
      );

      return this.prisma.whatsAppConnection
        .update({
          where: { id: connection.id },
          data: {
            status: WhatsAppConnectionStatus.ERROR,
            lastError: message.slice(0, 500),
          },
        })
        .catch(() => ({
          ...connection,
          status: WhatsAppConnectionStatus.ERROR,
          lastError: message.slice(0, 500),
        }));
    }
  }

  private isConnected(...states: Array<string | undefined>) {
    return states.some((state) =>
      ['open', 'connected'].includes(String(state ?? '').toLowerCase()),
    );
  }

  private hasQrCode(qrCode?: {
    qrCodeBase64?: string;
    qrCode?: string;
  }): qrCode is { qrCodeBase64?: string; qrCode?: string } {
    return Boolean(qrCode?.qrCodeBase64 || qrCode?.qrCode);
  }

  private normalizeConnectedPhone(value?: string) {
    if (!value) return undefined;
    return value.split('@')[0]?.replace(/\D/g, '') || undefined;
  }

  private sanitizeProviderError(error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha desconhecida ao conectar WhatsApp.';
    const apiKey = process.env.EVOLUTION_API_KEY?.trim();

    return apiKey ? message.replaceAll(apiKey, '[redacted]') : message;
  }
}
