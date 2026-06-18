import { WhatsAppEventType } from '@prisma/client';

import { WhatsAppManualService } from './whatsapp-manual.service';

describe('WhatsAppManualService', () => {
  it('nao gera link manual para pedido de teste de carga', async () => {
    const prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue({
          customerName: ' [LOAD_TEST] Pedido 1',
          customerPhone: null,
          items: [],
        }),
      },
    };
    const templates = {
      buildOrderMessage: jest.fn(),
    };
    const service = new WhatsAppManualService(
      prisma as never,
      templates as never,
    );

    await expect(
      service.getOrderLink(
        'tenant-1',
        'order-1',
        WhatsAppEventType.ORDER_CONFIRMED,
      ),
    ).resolves.toEqual({
      message:
        'WhatsApp desativado para pedido identificado como teste de carga.',
      url: null,
      suppressed: true,
    });
    expect(templates.buildOrderMessage).not.toHaveBeenCalled();
  });

  it('mantem o link manual para pedido real', async () => {
    const prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue({
          customerName: 'Cliente real',
          customerPhone: '24999999999',
          items: [],
        }),
      },
    };
    const templates = {
      buildOrderMessage: jest.fn().mockReturnValue('Pedido confirmado'),
    };
    const service = new WhatsAppManualService(
      prisma as never,
      templates as never,
    );

    const result = await service.getOrderLink(
      'tenant-1',
      'order-1',
      WhatsAppEventType.ORDER_CONFIRMED,
    );

    expect(result).toEqual({
      message: 'Pedido confirmado',
      url: expect.stringContaining('https://wa.me/5524999999999'),
      suppressed: false,
    });
  });
});
