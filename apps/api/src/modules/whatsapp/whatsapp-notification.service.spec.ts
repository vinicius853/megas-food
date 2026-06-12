import { WhatsAppEventType, WhatsAppNotificationStatus } from '@prisma/client';

import { WhatsAppNotificationService } from './whatsapp-notification.service';

describe('WhatsAppNotificationService', () => {
  function setup(automationEnabled: boolean) {
    const prisma = {
      whatsAppConnection: {
        findUnique: jest.fn().mockResolvedValue({
          automationEnabled,
          status: 'CONNECTED',
          enabledEvents: [WhatsAppEventType.ORDER_CONFIRMED],
        }),
      },
      order: {
        findFirst: jest.fn().mockResolvedValue({
          customerPhone: '24999999999',
          type: 'TAKEAWAY',
        }),
      },
      whatsAppNotification: {
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
    };
    const outbox = { schedule: jest.fn() };
    const service = new WhatsAppNotificationService(
      prisma as never,
      outbox as never,
    );

    return { prisma, outbox, service };
  }

  it('registra como ignorado quando automacao esta desligada', async () => {
    const { prisma, outbox, service } = setup(false);

    await service.enqueueOrderEvent({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      eventType: WhatsAppEventType.ORDER_CONFIRMED,
    });

    expect(prisma.whatsAppNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dedupeKey: 'order-1:ORDER_CONFIRMED',
        status: WhatsAppNotificationStatus.SKIPPED,
      }),
    });
    expect(outbox.schedule).not.toHaveBeenCalled();
  });

  it('agenda apenas evento habilitado quando automacao esta ligada', async () => {
    const { prisma, outbox, service } = setup(true);

    await service.enqueueOrderEvent({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      eventType: WhatsAppEventType.ORDER_CONFIRMED,
    });

    expect(prisma.whatsAppNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dedupeKey: 'order-1:ORDER_CONFIRMED',
        status: WhatsAppNotificationStatus.PENDING,
      }),
    });
    expect(outbox.schedule).toHaveBeenCalledWith('notification-1');
  });
});
