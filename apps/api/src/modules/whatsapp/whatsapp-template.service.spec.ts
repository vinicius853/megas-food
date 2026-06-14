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

  it('gera mensagem de status com resumo generico do pedido', () => {
    const message = service.buildOrderMessage(
      order,
      WhatsAppEventType.ORDER_CONFIRMED,
    );

    expect(message).toContain('Pedido #42');
    expect(message).toContain('Sabores: 1/2 Calabresa');
    expect(message.replace(/\s/g, ' ')).toContain('R$ 58,00');
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
