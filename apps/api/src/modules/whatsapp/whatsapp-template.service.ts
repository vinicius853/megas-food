import { Injectable } from '@nestjs/common';
import { WhatsAppEventType } from '@prisma/client';

import { WhatsAppOrderSnapshot } from './types/whatsapp.types';

function getOrderDisplayNumber(order: WhatsAppOrderSnapshot) {
  if (order.displayNumber) return order.displayNumber;

  if (typeof order.dailyNumber === 'number') {
    return `#${String(order.dailyNumber).padStart(3, '0')}`;
  }

  return `#${order.number}`;
}

@Injectable()
export class WhatsAppTemplateService {
  buildOrderMessage(
    order: WhatsAppOrderSnapshot,
    eventType: WhatsAppEventType,
  ) {
    const customerName = order.customerName?.trim() || 'cliente';
    const displayNumber = getOrderDisplayNumber(order);

    if (eventType === WhatsAppEventType.ORDER_CREATED) {
      return [
        `Olá, ${customerName}! Recebemos seu pedido ${displayNumber}.`,
        'A loja já foi notificada e em breve irá confirmar o preparo.',
      ].join('\n');
    }

    const messages: Partial<Record<WhatsAppEventType, string>> = {
      ORDER_CONFIRMED: `Olá, ${customerName}! Seu pedido ${displayNumber} foi confirmado e já entrou em preparo.`,
      ORDER_READY: `Olá, ${customerName}! Seu pedido ${displayNumber} está pronto.`,
      ORDER_OUT_FOR_DELIVERY: `Olá, ${customerName}! Seu pedido ${displayNumber} saiu para entrega 🚚`,
      ORDER_DELIVERED: `Pedido ${displayNumber} entregue com sucesso. Obrigado pela preferência!`,
      ORDER_CANCELLED: `Seu pedido ${displayNumber} foi cancelado. Em caso de dúvidas, entre em contato com a loja.`,
    };

    return (
      messages[eventType] ??
      `Olá, ${customerName}! Houve uma atualização no pedido ${displayNumber}.`
    );
  }

  buildTestMessage() {
    return 'Teste de conexao do WhatsApp do Megas Food. Nenhuma acao e necessaria.';
  }

  buildOutsideBusinessHoursMessage() {
    return 'No momento estamos fora do horario de atendimento. Voce pode consultar o cardapio e se planejar para pedir mais tarde.';
  }
}
