import { Injectable } from '@nestjs/common';
import { WhatsAppEventType } from '@prisma/client';

import { WhatsAppOrderSnapshot } from './types/whatsapp.types';

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

    const customerName = order.customerName?.trim() || 'cliente';
    const messages: Partial<Record<WhatsAppEventType, string>> = {
      ORDER_CONFIRMED: `Olá, ${customerName}! Seu pedido #${order.number} foi confirmado e já entrou em preparo.`,
      ORDER_READY: `Olá, ${customerName}! Seu pedido #${order.number} está pronto.`,
      ORDER_OUT_FOR_DELIVERY: `Olá, ${customerName}! Seu pedido #${order.number} saiu para entrega 🚚`,
      ORDER_DELIVERED: `Pedido #${order.number} entregue com sucesso. Obrigado pela preferência!`,
      ORDER_CANCELLED: `Seu pedido #${order.number} foi cancelado. Em caso de dúvidas, entre em contato com a loja.`,
    };

    return (
      messages[eventType] ??
      `Olá, ${customerName}! Houve uma atualização no pedido #${order.number}.`
    );
  }

  buildTestMessage() {
    return 'Teste de conexao do WhatsApp do Megas Food. Nenhuma acao e necessaria.';
  }

  buildOutsideBusinessHoursMessage() {
    return 'No momento estamos fora do horario de atendimento. Voce pode consultar o cardapio e se planejar para pedir mais tarde.';
  }
}
