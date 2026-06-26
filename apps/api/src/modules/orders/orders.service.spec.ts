import { OrdersService } from './orders.service';
import {
  formatOrderDisplayNumber,
  getBusinessDateForTimeZone,
} from './order-numbering.service';

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
          tenant: {
            name: 'Tenant',
            settings: null,
          },
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
              settings: true,
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
            dailyNumber: 7,
            businessDate: new Date('2026-06-26T00:00:00.000Z'),
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
          dailyNumber: true,
          businessDate: true,
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
        dailyNumber: 7,
        dailyOrderNumber: 7,
        displayNumber: '#007',
        itemsCount: 1,
        itemsSummary: '1x Nova pizza redonda - 25cm, Mussarela',
      }),
    ]);
    expect(result[0]).not.toHaveProperty('items');
    expect(result[0]).not.toHaveProperty('tenant');
  });

  it('formata numero operacional diario com fallback para numero interno', () => {
    expect(formatOrderDisplayNumber({ dailyNumber: 1, number: 999 })).toBe(
      '#001',
    );
    expect(formatOrderDisplayNumber({ dailyNumber: 123, number: 999 })).toBe(
      '#123',
    );
    expect(formatOrderDisplayNumber({ number: 999 })).toBe('#999');
  });

  it('calcula data operacional em America/Sao_Paulo sem depender de UTC', () => {
    expect(
      getBusinessDateForTimeZone(
        new Date('2026-06-27T02:59:59.000Z'),
        'America/Sao_Paulo',
      ).toISOString(),
    ).toBe('2026-06-26T00:00:00.000Z');
    expect(
      getBusinessDateForTimeZone(
        new Date('2026-06-27T03:00:00.000Z'),
        'America/Sao_Paulo',
      ).toISOString(),
    ).toBe('2026-06-27T00:00:00.000Z');
  });

  it('informa ao painel quando a notificacao automatica foi agendada', async () => {
    const order = {
      id: 'order-1',
      tenantId: 'tenant-1',
      status: 'CONFIRMED',
      tenant: {
        name: 'Tenant',
        settings: null,
      },
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
