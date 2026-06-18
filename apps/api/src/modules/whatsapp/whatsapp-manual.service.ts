import { Injectable, NotFoundException } from '@nestjs/common';
import { WhatsAppEventType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { isLoadTestOrder } from '../orders/order-external-effects';
import { WhatsAppTemplateService } from './whatsapp-template.service';

@Injectable()
export class WhatsAppManualService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: WhatsAppTemplateService,
  ) {}

  async getOrderLink(
    tenantId: string,
    orderId: string,
    eventType: WhatsAppEventType,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        items: {
          include: {
            modifiers: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Pedido ou telefone do cliente nao encontrado.',
      );
    }

    if (isLoadTestOrder(order)) {
      return {
        message:
          'WhatsApp desativado para pedido identificado como teste de carga.',
        url: null,
        suppressed: true,
      };
    }

    if (!order.customerPhone) {
      throw new NotFoundException(
        'Pedido ou telefone do cliente nao encontrado.',
      );
    }

    const message = this.templates.buildOrderMessage(order as any, eventType);
    const phone = this.normalizePhone(order.customerPhone);

    return {
      message,
      url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      suppressed: false,
    };
  }

  private normalizePhone(value: string) {
    const digits = value.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  }
}
