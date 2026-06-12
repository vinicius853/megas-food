import { BadRequestException, Injectable } from '@nestjs/common';
import { WhatsAppConnectionStatus, WhatsAppEventType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { UpdateWhatsAppSettingsDto } from './dto/update-whatsapp-settings.dto';
import { EvolutionApiAdapter } from './providers/evolution-api.adapter';

export const defaultWhatsAppEvents: WhatsAppEventType[] = [
  WhatsAppEventType.ORDER_CONFIRMED,
  WhatsAppEventType.ORDER_CANCELLED,
  WhatsAppEventType.ORDER_READY,
  WhatsAppEventType.ORDER_OUT_FOR_DELIVERY,
];

@Injectable()
export class WhatsAppConnectionService {
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
      qrCodeAvailable: false,
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

  private buildInstanceName(tenantId: string) {
    return `megas-${tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;
  }
}
