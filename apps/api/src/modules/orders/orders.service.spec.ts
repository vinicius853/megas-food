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
          tenant: {
            select: {
              name: true,
            },
          },
          items: {
            include: {
              modifiers: true,
            },
          },
        },
      }),
    );
  });

  it('retorna listagem operacional sem detalhes completos', async () => {
    const prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'order-1',
            number: 123,
            customerName: 'Cliente',
            customerPhone: '24999999999',
            type: 'DELIVERY',
            status: 'PENDING',
            total: 48,
            createdAt: new Date('2026-06-17T12:00:00.000Z'),
            items: [
              {
                name: 'Nova pizza redonda',
                quantity: 1,
                modifiers: [
                  { optionName: '25cm', sortOrder: 0 },
                  { optionName: 'Mussarela', sortOrder: 1 },
                ],
              },
            ],
          },
        ]),
      },
    };
    const service = new OrdersService(
      prisma as never,
      {} as never,
      {} as never,
    );

    const result = await service.findAll('tenant-1');

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          number: true,
          items: {
            select: {
              name: true,
              quantity: true,
              modifiers: {
                select: {
                  optionName: true,
                  sortOrder: true,
                },
                orderBy: {
                  sortOrder: 'asc',
                },
              },
            },
          },
        }),
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: 'order-1',
        itemsCount: 1,
        itemsSummary: '1x Nova pizza redonda - 25cm, Mussarela',
      }),
    ]);
    expect(result[0]).not.toHaveProperty('items');
    expect(result[0]).not.toHaveProperty('tenant');
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
