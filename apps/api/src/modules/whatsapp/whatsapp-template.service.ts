import { Injectable } from '@nestjs/common';
import { WhatsAppEventType } from '@prisma/client';

import { WhatsAppOrderSnapshot } from './types/whatsapp.types';

const eventTitles: Partial<Record<WhatsAppEventType, string>> = {
  ORDER_CREATED: 'recebemos seu pedido',
  ORDER_CONFIRMED: 'seu pedido foi confirmado',
  ORDER_CANCELLED: 'seu pedido foi cancelado',
  ORDER_READY: 'seu pedido esta pronto',
  ORDER_OUT_FOR_DELIVERY: 'seu pedido saiu para entrega',
  ORDER_DELIVERED: 'seu pedido foi entregue',
};

@Injectable()
export class WhatsAppTemplateService {
  buildOrderMessage(
    order: WhatsAppOrderSnapshot,
    eventType: WhatsAppEventType,
  ) {
    if (eventType === WhatsAppEventType.ORDER_CREATED) {
      const customerName = order.customerName?.trim() || 'cliente';
      return [
        `Olá, ${customerName}! Recebemos seu pedido #${order.number}.`,
        'A loja já foi notificada e em breve irá confirmar o preparo.',
      ].join('\n');
    }

    const title = eventTitles[eventType] ?? 'atualizacao do seu pedido';
    const greeting = order.customerName
      ? `Ola, ${order.customerName}!`
      : 'Ola!';
    const items = order.items
      .map((item) => {
        const modifiers = item.modifiers
          .map((modifier) => {
            const fraction = Number(modifier.fraction ?? 0);
            const prefix =
              fraction > 0 && fraction < 1
                ? `${this.formatFraction(fraction)} `
                : '';
            return `  - ${modifier.groupName}: ${prefix}${modifier.optionName}`;
          })
          .join('\n');

        return `- ${item.quantity}x ${item.name}${modifiers ? `\n${modifiers}` : ''}`;
      })
      .join('\n');

    return [
      greeting,
      `Pedido #${order.number}: ${title}.`,
      items,
      `Total: ${this.formatCurrency(Number(order.total))}`,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  buildTestMessage() {
    return 'Teste de conexao do WhatsApp do Megas Food. Nenhuma acao e necessaria.';
  }

  buildOutsideBusinessHoursMessage() {
    return 'No momento estamos fora do horario de atendimento. Voce pode consultar o cardapio e se planejar para pedir mais tarde.';
  }

  private formatFraction(value: number) {
    if (Math.abs(value - 0.5) < 0.01) return '1/2';
    if (Math.abs(value - 1 / 3) < 0.01) return '1/3';
    if (Math.abs(value - 0.25) < 0.01) return '1/4';
    return `${Math.round(value * 100)}%`;
  }

  private formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
