import { WhatsAppNotificationStatus } from '@prisma/client';

import { WhatsAppOutboxService } from './whatsapp-outbox.service';

describe('WhatsAppOutboxService', () => {
  it('interrompe envio defensivamente para pedido de teste de carga', async () => {
    const prisma = {
      whatsAppNotification: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'notification-1',
          tenantId: 'tenant-1',
          status: WhatsAppNotificationStatus.PENDING,
          recipient: '24999999999',
          eventType: 'ORDER_CREATED',
          order: {
            customerName: ' [LOAD_TEST] Pedido 1',
            items: [],
          },
          tenant: {
            whatsappConnection: {
              status: 'CONNECTED',
              instanceName: 'megas-tenant-1',
            },
          },
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };
    const templates = {
      buildOrderMessage: jest.fn(),
      buildTestMessage: jest.fn(),
    };
    const provider = {
      isConfigured: jest.fn().mockReturnValue(true),
      sendText: jest.fn(),
    };
    const service = new WhatsAppOutboxService(
      prisma as never,
      templates as never,
      provider as never,
    );

    await service.process('notification-1');

    expect(prisma.whatsAppNotification.update).toHaveBeenCalledWith({
      where: { id: 'notification-1' },
      data: {
        status: WhatsAppNotificationStatus.SKIPPED,
        error: 'Efeito externo suprimido para pedido de teste de carga.',
      },
    });
    expect(provider.sendText).not.toHaveBeenCalled();
    expect(templates.buildOrderMessage).not.toHaveBeenCalled();
  });
});
