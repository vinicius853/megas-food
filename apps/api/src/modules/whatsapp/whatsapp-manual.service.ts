import { Injectable, NotFoundException } from '@nestjs/common';
import { WhatsAppEventType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
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

    if (!order?.customerPhone) {
      throw new NotFoundException(
        'Pedido ou telefone do cliente nao encontrado.',
      );
    }

    const message = this.templates.buildOrderMessage(order as any, eventType);
    const phone = this.normalizePhone(order.customerPhone);

    return {
      message,
      url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    };
  }

  private normalizePhone(value: string) {
    const digits = value.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  }
}
