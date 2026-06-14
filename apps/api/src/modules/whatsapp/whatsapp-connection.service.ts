import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WhatsAppConnectionStatus, WhatsAppEventType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { UpdateWhatsAppSettingsDto } from './dto/update-whatsapp-settings.dto';
import { EvolutionApiAdapter } from './providers/evolution-api.adapter';
import type { WhatsAppQrResponse } from './providers/evolution-api.types';

export const defaultWhatsAppEvents: WhatsAppEventType[] = [
  WhatsAppEventType.ORDER_CREATED,
  WhatsAppEventType.ORDER_CONFIRMED,
  WhatsAppEventType.ORDER_CANCELLED,
  WhatsAppEventType.ORDER_READY,
  WhatsAppEventType.ORDER_OUT_FOR_DELIVERY,
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

    return {
      automationEnabled: connection?.automationEnabled ?? false,
      enabledEvents: connection?.enabledEvents ?? defaultWhatsAppEvents,
      status: providerConfigured
        ? (connection?.status ?? WhatsAppConnectionStatus.DISCONNECTED)
        : WhatsAppConnectionStatus.AWAITING_CONFIGURATION,
      connectedPhone: connection?.connectedPhone ?? null,
      recipientPhone: tenant.whatsapp ?? null,
      lastError: connection?.lastError ?? null,
      lastConnectedAt: connection?.lastConnectedAt ?? null,
      provider: 'EVOLUTION_API' as const,
      providerConfigured,
      qrCodeAvailable:
        providerConfigured &&
        connection?.status !== WhatsAppConnectionStatus.CONNECTED,
    };
  }

  async updateSettings(tenantId: string, dto: UpdateWhatsAppSettingsDto) {
    const providerConfigured = this.evolutionApi.isConfigured();

    await this.prisma.whatsAppConnection.upsert({
      where: { tenantId },
      create: {
        tenantId,
        automationEnabled: dto.automationEnabled ?? false,
        enabledEvents: dto.enabledEvents ?? defaultWhatsAppEvents,
        instanceName: this.buildInstanceName(tenantId),
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
          this.buildInstanceName(tenant.id, tenant.slug),
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

      const connectionState = createdNow
        ? { state: providerInstance.status ?? 'created' }
        : await this.evolutionApi.getConnectionStatus(instanceName);
      const connectedPhone =
        connectionState.connectedPhone ??
        this.normalizeConnectedPhone(providerInstance.owner);

      if (this.isConnected(connectionState.state, providerInstance.status)) {
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

  private buildInstanceName(tenantId: string, tenantSlug?: string | null) {
    const identity = tenantSlug?.trim() || tenantId;
    return `megas-${identity}-${tenantId.slice(0, 8)}`;
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
