import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  WhatsAppEventType,
  WhatsAppNotificationStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { TestWhatsAppDto } from './dto/test-whatsapp.dto';
import { EnqueueOrderEventInput } from './types/whatsapp.types';
import { WhatsAppOutboxService } from './whatsapp-outbox.service';

@Injectable()
export class WhatsAppNotificationService {
  private readonly logger = new Logger(WhatsAppNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: WhatsAppOutboxService,
  ) {}

  async enqueueOrderEvent(input: EnqueueOrderEventInput) {
    try {
      const [connection, order] = await Promise.all([
        this.prisma.whatsAppConnection.findUnique({
          where: { tenantId: input.tenantId },
        }),
        this.prisma.order.findFirst({
          where: { id: input.orderId, tenantId: input.tenantId },
          select: {
            customerPhone: true,
            type: true,
          },
        }),
      ]);

      if (!order) return;
      if (
        input.eventType === WhatsAppEventType.ORDER_READY &&
        order.type === 'DELIVERY'
      ) {
        return;
      }
      if (
        input.eventType === WhatsAppEventType.ORDER_OUT_FOR_DELIVERY &&
        order.type !== 'DELIVERY'
      ) {
        return;
      }

      const enabled =
        Boolean(connection?.automationEnabled) &&
        connection?.enabledEvents.includes(input.eventType);
      const status = enabled
        ? WhatsAppNotificationStatus.PENDING
        : WhatsAppNotificationStatus.SKIPPED;

      const notification = await this.prisma.whatsAppNotification.create({
        data: {
          tenantId: input.tenantId,
          orderId: input.orderId,
          eventType: input.eventType,
          status,
          recipient: order.customerPhone,
          dedupeKey: `${input.orderId}:${input.eventType}`,
        },
      });

      if (status === WhatsAppNotificationStatus.PENDING) {
        this.outbox.schedule(notification.id);
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return;
      }
      this.logger.warn(
        `Falha ao registrar evento WhatsApp: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async enqueueTest(tenantId: string, dto: TestWhatsAppDto) {
    const [connection, tenant] = await Promise.all([
      this.prisma.whatsAppConnection.findUnique({ where: { tenantId } }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { whatsapp: true },
      }),
    ]);
    const recipient = dto.recipient?.trim() || tenant?.whatsapp?.trim();

    if (!recipient) {
      throw new BadRequestException(
        'Configure um numero de WhatsApp antes do teste.',
      );
    }

    const notification = await this.prisma.whatsAppNotification.create({
      data: {
        tenantId,
        eventType: WhatsAppEventType.TEST,
        recipient,
        status: WhatsAppNotificationStatus.PENDING,
        dedupeKey: `test:${tenantId}:${randomUUID()}`,
      },
    });

    if (!connection) {
      await this.prisma.whatsAppConnection.create({
        data: {
          tenantId,
          instanceName: `megas-${tenantId.replace(/\W/g, '').slice(0, 20)}`,
        },
      });
    }

    await this.outbox.process(notification.id);
    return this.prisma.whatsAppNotification.findUnique({
      where: { id: notification.id },
      select: { id: true, status: true, error: true },
    });
  }
}
