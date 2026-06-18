import { WhatsAppEventType, WhatsAppNotificationStatus } from '@prisma/client';

import { WhatsAppNotificationService } from './whatsapp-notification.service';

describe('WhatsAppNotificationService', () => {
  function setup(
    automationEnabled: boolean,
    input?: {
      status?: 'CONNECTED' | 'DISCONNECTED';
      instanceName?: string | null;
      providerConfigured?: boolean;
      customerName?: string;
    },
  ) {
    const createdNotifications: Array<{
      dedupeKey: string;
      status: WhatsAppNotificationStatus;
    }> = [];
    const prisma = {
      whatsAppConnection: {
        findUnique: jest.fn().mockResolvedValue({
          automationEnabled,
          status: input?.status ?? 'CONNECTED',
          instanceName:
            input?.instanceName === undefined
              ? 'megas-tenant-1'
              : input.instanceName,
          enabledEvents: [WhatsAppEventType.ORDER_CONFIRMED],
        }),
      },
      order: {
        findFirst: jest.fn().mockResolvedValue({
          customerName: input?.customerName ?? 'Cliente real',
          customerPhone: '24999999999',
          type: 'TAKEAWAY',
        }),
      },
      whatsAppNotification: {
        create: jest.fn(
          (entry: {
            data: {
              dedupeKey: string;
              status: WhatsAppNotificationStatus;
            };
          }) => {
            createdNotifications.push({
              dedupeKey: entry.data.dedupeKey,
              status: entry.data.status,
            });
            return Promise.resolve({ id: 'notification-1' });
          },
        ),
      },
    };
    const outbox = { schedule: jest.fn() };
    const provider = {
      isConfigured: jest
        .fn()
        .mockReturnValue(input?.providerConfigured ?? true),
    };
    const service = new WhatsAppNotificationService(
      prisma as never,
      outbox as never,
      provider as never,
    );

    return { createdNotifications, outbox, service };
  }

  it('registra como ignorado quando automacao esta desligada', async () => {
    const { createdNotifications, outbox, service } = setup(false);

    await service.enqueueOrderEvent({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      eventType: WhatsAppEventType.ORDER_CONFIRMED,
    });

    expect(createdNotifications).toContainEqual(
      expect.objectContaining({
        dedupeKey: 'order-1:ORDER_CONFIRMED',
        status: WhatsAppNotificationStatus.SKIPPED,
      }),
    );
    expect(outbox.schedule).not.toHaveBeenCalled();
  });

  it('agenda apenas evento habilitado quando automacao esta ligada', async () => {
    const { createdNotifications, outbox, service } = setup(true);

    await service.enqueueOrderEvent({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      eventType: WhatsAppEventType.ORDER_CONFIRMED,
    });

    expect(createdNotifications).toContainEqual(
      expect.objectContaining({
        dedupeKey: 'order-1:ORDER_CONFIRMED',
        status: WhatsAppNotificationStatus.PENDING,
      }),
    );
    expect(outbox.schedule).toHaveBeenCalledWith('notification-1');
  });

  it.each([
    { status: 'DISCONNECTED' as const },
    { instanceName: null },
    { providerConfigured: false },
  ])('nao agenda quando a conexao nao esta pronta', async (input) => {
    const { outbox, service } = setup(true, input);

    const result = await service.enqueueOrderEvent({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      eventType: WhatsAppEventType.ORDER_CONFIRMED,
    });

    expect(result).toEqual({ automaticScheduled: false });
    expect(outbox.schedule).not.toHaveBeenCalled();
  });

  it('nao agenda notificacao para pedido de teste de carga', async () => {
    const { createdNotifications, outbox, service } = setup(true, {
      customerName: '  [LOAD_TEST] Cliente 001',
    });

    const result = await service.enqueueOrderEvent({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      eventType: WhatsAppEventType.ORDER_CONFIRMED,
    });

    expect(result).toEqual({ automaticScheduled: false });
    expect(createdNotifications).toContainEqual(
      expect.objectContaining({
        dedupeKey: 'order-1:ORDER_CONFIRMED',
        status: WhatsAppNotificationStatus.SKIPPED,
      }),
    );
    expect(outbox.schedule).not.toHaveBeenCalled();
  });
});
