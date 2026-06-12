import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  WhatsAppConnectionStatus,
  WhatsAppNotificationStatus,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { WHATSAPP_PROVIDER } from './providers/whatsapp-provider.interface';
import type { WhatsAppProviderAdapter } from './providers/whatsapp-provider.interface';
import { WhatsAppTemplateService } from './whatsapp-template.service';

@Injectable()
export class WhatsAppOutboxService {
  private readonly logger = new Logger(WhatsAppOutboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: WhatsAppTemplateService,
    @Inject(WHATSAPP_PROVIDER)
    private readonly provider: WhatsAppProviderAdapter,
  ) {}

  schedule(notificationId: string) {
    setImmediate(() => {
      void this.process(notificationId);
    });
  }

  async process(notificationId: string) {
    const notification = await this.prisma.whatsAppNotification.findUnique({
      where: { id: notificationId },
      include: {
        order: {
          include: {
            items: {
              include: {
                modifiers: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        tenant: {
          select: {
            whatsappConnection: true,
          },
        },
      },
    });

    if (
      !notification ||
      notification.status !== WhatsAppNotificationStatus.PENDING
    ) {
      return;
    }

    if (!this.provider.isConfigured()) {
      await this.prisma.whatsAppNotification.update({
        where: { id: notificationId },
        data: {
          status: WhatsAppNotificationStatus.DRY_RUN,
          error: 'Evolution API nao configurada; envio simulado.',
        },
      });
      return;
    }

    const connection = notification.tenant.whatsappConnection;
    if (connection?.status !== WhatsAppConnectionStatus.CONNECTED) {
      await this.prisma.whatsAppNotification.update({
        where: { id: notificationId },
        data: {
          status: WhatsAppNotificationStatus.SKIPPED,
          error: 'Instancia do WhatsApp ainda nao esta conectada.',
        },
      });
      return;
    }

    if (!connection?.instanceName || !notification.recipient) {
      await this.fail(notificationId, 'Conexao ou destinatario indisponivel.');
      return;
    }

    const text =
      notification.eventType === 'TEST'
        ? this.templates.buildTestMessage()
        : notification.order
          ? this.templates.buildOrderMessage(
              notification.order as any,
              notification.eventType,
            )
          : null;

    if (!text) {
      await this.fail(notificationId, 'Pedido da notificacao nao encontrado.');
      return;
    }

    await this.prisma.whatsAppNotification.update({
      where: { id: notificationId },
      data: {
        status: WhatsAppNotificationStatus.PROCESSING,
        attempts: { increment: 1 },
      },
    });

    try {
      const result = await this.provider.sendText({
        instanceName: connection.instanceName,
        recipient: this.normalizePhone(notification.recipient),
        text,
      });

      await this.prisma.$transaction([
        this.prisma.whatsAppNotification.update({
          where: { id: notificationId },
          data: {
            status: WhatsAppNotificationStatus.SENT,
            providerMessageId: result.messageId,
            sentAt: new Date(),
            error: null,
          },
        }),
        this.prisma.whatsAppConnection.update({
          where: { tenantId: notification.tenantId },
          data: {
            status: WhatsAppConnectionStatus.CONNECTED,
            lastConnectedAt: new Date(),
            lastError: null,
          },
        }),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha desconhecida no envio.';
      await this.fail(notificationId, message);
      await this.prisma.whatsAppConnection.update({
        where: { tenantId: notification.tenantId },
        data: {
          status: WhatsAppConnectionStatus.ERROR,
          lastError: message.slice(0, 500),
        },
      });
      this.logger.warn(`WhatsApp ${notificationId} falhou: ${message}`);
    }
  }

  private async fail(notificationId: string, error: string) {
    await this.prisma.whatsAppNotification.update({
      where: { id: notificationId },
      data: {
        status: WhatsAppNotificationStatus.FAILED,
        error: error.slice(0, 500),
      },
    });
  }

  private normalizePhone(value: string) {
    const digits = value.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  }
}
