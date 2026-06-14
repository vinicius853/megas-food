import { WhatsAppEventType } from '@prisma/client';

import { WhatsAppTemplateService } from './whatsapp-template.service';

describe('WhatsAppTemplateService', () => {
  const service = new WhatsAppTemplateService();
  const order = {
    id: 'order-1',
    number: 42,
    customerName: 'Ana',
    customerPhone: '24999999999',
    type: 'TAKEAWAY',
    total: 58,
    items: [
      {
        name: 'Pizza',
        quantity: 1,
        modifiers: [
          {
            groupName: 'Sabores',
            optionName: 'Calabresa',
            fraction: 0.5,
            totalDelta: 0,
          },
        ],
      },
    ],
  };

  it.each([
    [
      WhatsAppEventType.ORDER_CONFIRMED,
      'Olá, Ana! Seu pedido #42 foi confirmado e já entrou em preparo.',
    ],
    [WhatsAppEventType.ORDER_READY, 'Olá, Ana! Seu pedido #42 está pronto.'],
    [
      WhatsAppEventType.ORDER_OUT_FOR_DELIVERY,
      'Olá, Ana! Seu pedido #42 saiu para entrega 🚚',
    ],
    [
      WhatsAppEventType.ORDER_DELIVERED,
      'Pedido #42 entregue com sucesso. Obrigado pela preferência!',
    ],
    [
      WhatsAppEventType.ORDER_CANCELLED,
      'Seu pedido #42 foi cancelado. Em caso de dúvidas, entre em contato com a loja.',
    ],
  ])('gera a mensagem oficial para %s', (eventType, expected) => {
    expect(service.buildOrderMessage(order, eventType)).toBe(expected);
  });

  it('nao afirma confirmacao no evento de pedido criado', () => {
    const message = service.buildOrderMessage(
      order,
      WhatsAppEventType.ORDER_CREATED,
    );

    expect(message).toContain('Recebemos seu pedido');
    expect(message).not.toContain('foi confirmado');
  });

  it('mantem texto seguro para atendimento fora do horario', () => {
    expect(service.buildOutsideBusinessHoursMessage()).toContain(
      'fora do horario de atendimento',
    );
  });
});
