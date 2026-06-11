import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ModifierPricingMode, PaymentType } from '@prisma/client';

import { PublicOrdersV2Service } from './public-orders-v2.service';

describe('PublicOrdersV2Service', () => {
  let service: PublicOrdersV2Service;
  let prisma: any;
  let priceEngineService: {
    calculate: jest.Mock;
  };
  let couponsService: {
    validateCoupon: jest.Mock;
  };
  let ordersGateway: {
    emitOrderCreated: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
      },
      product: {
        findFirst: jest.fn(),
      },
      order: {
        create: jest.fn(),
      },
    };
    priceEngineService = {
      calculate: jest.fn(),
    };
    couponsService = {
      validateCoupon: jest.fn(),
    };
    ordersGateway = {
      emitOrderCreated: jest.fn(),
    };
    service = new PublicOrdersV2Service(
      prisma,
      priceEngineService as any,
      couponsService as any,
      ordersGateway as any,
    );
  });

  it('cria pedido V2 com pizza inteira e OrderItemModifier', async () => {
    mockTenant();
    mockProduct();
    mockPriceResult(40, [
      applied('Tamanho', 'pizza_size', '30cm', 'INCLUDED', 0),
      applied('Sabores', 'pizza_flavor', 'calabresa', 'HIGHEST_SELECTED', 40),
    ]);
    mockOrderCreate();

    const order = await service.createByTenantSlug(
      'tenant-slug',
      orderDto(['size-30', 'flavor-calabresa']),
    );

    expect(order.items[0].modifiers).toHaveLength(2);
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: expect.objectContaining({
            create: [
              expect.objectContaining({
                unitPrice: 40,
                total: 40,
                modifiers: expect.objectContaining({
                  create: expect.arrayContaining([
                    expect.objectContaining({
                      groupCode: 'pizza_flavor',
                      optionName: 'calabresa',
                    }),
                  ]),
                }),
              }),
            ],
          }),
        }),
      }),
    );
    const createdItem =
      prisma.order.create.mock.calls[0][0].data.items.create[0];
    expect(createdItem.modifiers.create).toHaveLength(2);
    expect(createdItem).not.toHaveProperty('flavors');
    expect(ordersGateway.emitOrderCreated).toHaveBeenCalledWith(
      'tenant-1',
      order,
    );
  });

  it('cria pedido V2 meio a meio com fraction no snapshot', async () => {
    mockTenant();
    mockProduct();
    mockPriceResult(40, [
      applied(
        'Sabores',
        'pizza_flavor',
        'calabresa',
        'HIGHEST_SELECTED',
        40,
        0.5,
      ),
      applied(
        'Sabores',
        'pizza_flavor',
        'mussarela',
        'HIGHEST_SELECTED',
        0,
        0.5,
      ),
    ]);
    mockOrderCreate();

    await service.createByTenantSlug(
      'tenant-slug',
      orderDto(['flavor-calabresa', 'flavor-mussarela']),
    );

    const modifiers =
      prisma.order.create.mock.calls[0][0].data.items.create[0].modifiers
        .create;

    expect(modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          optionName: 'calabresa',
          fraction: 0.5,
        }),
        expect.objectContaining({
          optionName: 'mussarela',
          fraction: 0.5,
        }),
      ]),
    );
  });

  it('cria pedido V2 com 3 sabores', async () => {
    mockTenant();
    mockProduct();
    mockPriceResult(67, [
      applied(
        'Sabores',
        'pizza_flavor',
        'queijo e presunto',
        'HIGHEST_SELECTED',
        0,
      ),
      applied('Sabores', 'pizza_flavor', 'Peperone', 'HIGHEST_SELECTED', 67),
      applied('Sabores', 'pizza_flavor', 'brigadeiro', 'HIGHEST_SELECTED', 0),
    ]);
    mockOrderCreate();

    const order = await service.createByTenantSlug(
      'tenant-slug',
      orderDto(['flavor-1', 'flavor-2', 'flavor-3']),
    );

    expect(order.total).toBe(67);
  });

  it('cria pedido V2 com borda e dependsOnOptionId', async () => {
    mockTenant();
    mockProduct();
    mockPriceResult(48, [
      applied(
        'Bordas',
        'pizza_border',
        'catupiry',
        'ADDITIVE',
        8,
        undefined,
        'size-30',
      ),
    ]);
    mockOrderCreate();

    await service.createByTenantSlug(
      'tenant-slug',
      orderDto(['size-30', 'flavor-calabresa', 'border-catupiry']),
    );

    const modifiers =
      prisma.order.create.mock.calls[0][0].data.items.create[0].modifiers
        .create;

    expect(modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          groupCode: 'pizza_border',
          dependsOnOptionId: 'size-30',
        }),
      ]),
    );
  });

  it('multiplica total pela quantidade do item', async () => {
    mockTenant();
    mockProduct();
    mockPriceResult(
      40,
      [applied('Sabores', 'pizza_flavor', 'calabresa', 'HIGHEST_SELECTED', 40)],
      80,
    );
    mockOrderCreate();

    const order = await service.createByTenantSlug('tenant-slug', {
      ...orderDto(['size-30', 'flavor-calabresa']),
      items: [
        {
          ...orderDto(['size-30', 'flavor-calabresa']).items[0],
          quantity: 2,
        },
      ],
    });

    expect(order.subtotal).toBe(80);
    expect(priceEngineService.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 2,
      }),
    );
  });

  it('preserva cupom e desconto no pedido V2', async () => {
    mockTenant();
    mockProduct();
    mockPriceResult(40, [
      applied('Sabores', 'pizza_flavor', 'calabresa', 'HIGHEST_SELECTED', 40),
    ]);
    couponsService.validateCoupon.mockResolvedValue({
      code: 'PROMO10',
      discountAmount: 10,
    });
    mockOrderCreate();

    const order = await service.createByTenantSlug('tenant-slug', {
      ...orderDto(['size-30', 'flavor-calabresa']),
      couponCode: 'PROMO10',
      deliveryFee: 5,
    });

    expect(couponsService.validateCoupon).toHaveBeenCalledWith(
      'tenant-1',
      'PROMO10',
      40,
    );
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 40,
          deliveryFee: 5,
          totalBeforeDiscount: 45,
          discountAmount: 10,
          couponCode: 'PROMO10',
          total: 35,
        }),
      }),
    );
    expect(order.total).toBe(35);
  });

  it('falha quando PriceEngine retorna opcao invalida', async () => {
    mockTenant();
    mockProduct();
    mockPriceResult(0, [], 0, ['OPTION_NOT_ALLOWED']);

    await expect(
      service.createByTenantSlug('tenant-slug', orderDto(['invalid-option'])),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('falha quando PriceEngine retorna grupo obrigatorio ausente', async () => {
    mockTenant();
    mockProduct();
    mockPriceResult(0, [], 0, ['REQUIRED_GROUP_MISSING']);

    await expect(
      service.createByTenantSlug('tenant-slug', orderDto(['flavor-calabresa'])),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('falha para tenant inexistente', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);

    await expect(
      service.createByTenantSlug('missing', orderDto(['size-30'])),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  function mockTenant() {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      isActive: true,
    });
  }

  function mockProduct() {
    prisma.product.findFirst.mockResolvedValue({
      id: 'product-1',
      name: 'Pizza Redonda',
    });
  }

  function mockPriceResult(
    unitPrice: number,
    appliedModifiers: any[],
    totalPrice = unitPrice,
    errors: string[] = [],
  ) {
    priceEngineService.calculate.mockResolvedValue({
      unitPrice,
      totalPrice,
      appliedModifiers,
      validationErrors: errors.map((code) => ({
        code,
        message: code,
      })),
    });
  }

  function mockOrderCreate() {
    prisma.order.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: data.id,
        tenantId: data.tenantId,
        subtotal: data.subtotal,
        total: data.total,
        items: data.items.create.map((item: any) => ({
          id: item.id,
          modifiers: item.modifiers.create,
        })),
      }),
    );
  }
});

function orderDto(optionIds: string[]) {
  return {
    customer: {
      name: 'Cliente V2',
      phone: '11999999999',
    },
    type: 'DELIVERY' as const,
    paymentType: PaymentType.PIX,
    deliveryFee: 0,
    items: [
      {
        productId: 'product-1',
        quantity: 1,
        selectedModifiers: optionIds.map((optionId) => ({
          optionId,
        })),
      },
    ],
  };
}

function applied(
  groupName: string,
  groupCode: string,
  optionName: string,
  pricingMode: keyof typeof ModifierPricingMode,
  totalDelta: number,
  fraction?: number,
  dependsOnOptionId?: string,
) {
  return {
    groupId: `group-${groupCode}`,
    groupCode,
    groupName,
    optionId: `option-${optionName}`,
    optionCode: optionName,
    optionName,
    pricingMode: ModifierPricingMode[pricingMode],
    quantity: 1,
    fraction,
    dependsOnOptionId,
    unitPriceDelta: totalDelta,
    totalDelta,
  };
}
