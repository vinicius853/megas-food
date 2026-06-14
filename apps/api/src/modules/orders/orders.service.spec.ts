import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  it('nao oferece mais criacao de pedidos V1', () => {
    const service = new OrdersService(
      {
        order: {},
      } as never,
      {} as never,
      {} as never,
    );

    expect(service).not.toHaveProperty('create');
  });

  it('preserva leitura de pedidos V1 e V2 para o dashboard', async () => {
    const prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'order-1',
          items: [
            {
              modifiers: [{ id: 'modifier-1' }],
            },
          ],
        }),
      },
    };
    const service = new OrdersService(
      prisma as never,
      {} as never,
      {} as never,
    );

    await service.findOne('tenant-1', 'order-1');

    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'order-1',
          tenantId: 'tenant-1',
        },
        include: {
          items: {
            include: {
              modifiers: true,
            },
          },
        },
      }),
    );
  });

  it('informa ao painel quando a notificacao automatica foi agendada', async () => {
    const order = {
      id: 'order-1',
      tenantId: 'tenant-1',
      status: 'CONFIRMED',
      items: [],
    };
    const prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue({
          ...order,
          status: 'PENDING',
        }),
        update: jest.fn().mockResolvedValue(order),
      },
    };
    const notifications = {
      enqueueOrderEvent: jest.fn().mockResolvedValue({
        automaticScheduled: true,
      }),
    };
    const service = new OrdersService(
      prisma as never,
      { emitOrderUpdated: jest.fn() } as never,
      notifications as never,
    );

    await expect(
      service.update('tenant-1', 'order-1', { status: 'CONFIRMED' }),
    ).resolves.toEqual(
      expect.objectContaining({
        whatsappNotification: {
          eventType: 'ORDER_CONFIRMED',
          automaticScheduled: true,
        },
      }),
    );
  });
});
