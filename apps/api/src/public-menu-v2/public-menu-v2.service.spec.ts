import { NotFoundException } from '@nestjs/common';
import {
  CategoryType,
  ModifierPricingMode,
  ModifierSelectionType,
  ProductPricingMode,
  ProductType,
} from '@prisma/client';

import { PublicMenuV2Service } from './public-menu-v2.service';

describe('PublicMenuV2Service', () => {
  let service: PublicMenuV2Service;
  let prisma: any;
  let priceEngineService: {
    calculate: jest.Mock;
  };
  let subscriptionAccessService: {
    evaluateTenantAccess: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
      },
      productModifierGroup: {
        findMany: jest.fn(),
      },
      productModifierOption: {
        findMany: jest.fn(),
      },
      modifierOptionPrice: {
        findMany: jest.fn(),
      },
      productModifierOptionRule: {
        findMany: jest.fn(),
      },
    };

    priceEngineService = {
      calculate: jest.fn(),
    };

    subscriptionAccessService = {
      evaluateTenantAccess: jest.fn().mockResolvedValue({
        status: 'ACTIVE',
        canAcceptOrders: true,
        canAccessDashboard: true,
        accessUntil: null,
        nextBillingDate: null,
        message: null,
      }),
    };

    service = new PublicMenuV2Service(
      prisma,
      priceEngineService as any,
      subscriptionAccessService as any,
    );
  });

  it('retorna NotFound para tenant inexistente', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);

    await expect(service.findBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('retorna tenant valido com produto sem grupos', async () => {
    mockBaseData({
      products: [product('simple-product', 'Bebida', 'category-1')],
    });

    const result = await service.findBySlug('tenant-slug');

    expect(result.tenant.slug).toBe('tenant-slug');
    expect(result.customization.brandName).toBe('Tenant');
    expect(result.delivery.isDeliveryOpen).toBe(true);
    expect(result.subscription.canAcceptOrders).toBe(true);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].products[0]).toEqual(
      expect.objectContaining({
        id: 'simple-product',
        name: 'Bebida',
        modifierGroups: [],
      }),
    );
  });

  it('expoe o nome publico customizado para o cardapio e checkout', async () => {
    mockBaseData({
      products: [product('simple-product', 'Bebida', 'category-1')],
    });
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'pizzaria teste',
      slug: 'tenant-slug',
      whatsapp: null,
      logoUrl: null,
      settings: {
        customization: {
          brandName: ' Demonstração Megas Food ',
        },
      },
      isActive: true,
    });

    const result = await service.findBySlug('tenant-slug');

    expect(result.customization.brandName).toBe('Demonstração Megas Food');
  });

  it('retorna produto com grupos, opcoes permitidas e precos contextuais', async () => {
    mockBaseData({
      products: [product('pizza-product', 'Pizza Redonda', 'category-1')],
      productGroups: [
        productGroup('pizza-product', 'group-size', 'pizza_size', 10),
        productGroup(
          'pizza-product',
          'group-flavor',
          'pizza_flavor',
          20,
          ModifierPricingMode.HIGHEST_SELECTED,
          1,
          4,
          true,
        ),
      ],
      productOptions: [
        productOption(
          'pizza-product',
          'group-size',
          'option-size-30',
          '30cm',
          0,
        ),
        productOption(
          'pizza-product',
          'group-flavor',
          'option-flavor-calabresa',
          'calabresa',
          0,
        ),
      ],
      optionPrices: [
        optionPrice(
          'pizza-product',
          'option-flavor-calabresa',
          'option-size-30',
          40,
        ),
      ],
    });

    const result = await service.findBySlug('tenant-slug');
    const pizza = result.categories[0].products[0];

    expect(pizza.modifierGroups).toHaveLength(2);
    expect(pizza.modifierGroups.flatMap((group) => group.options)).toHaveLength(
      2,
    );
    expect(pizza.modifierGroups[1].options[0].prices).toEqual([
      {
        id: 'price-option-flavor-calabresa-option-size-30',
        dependsOnOptionId: 'option-size-30',
        price: 40,
        isActive: true,
      },
    ]);
  });

  it('preserva a categoria visual dos sabores migrados', async () => {
    mockBaseData({
      categories: [
        category('category-1', 'Pizzas'),
        category('category-doces', ' Doces ', 3),
      ],
      products: [product('pizza-product', 'Pizza Redonda', 'category-1')],
      productGroups: [
        productGroup('pizza-product', 'group-flavor', 'pizza_flavor', 20),
      ],
      productOptions: [
        productOption(
          'pizza-product',
          'group-flavor',
          'option-flavor-brigadeiro',
          'Brigadeiro',
          0,
          0,
          'flavor-brigadeiro',
          'category-doces',
        ),
      ],
    });

    const result = await service.findBySlug('tenant-slug');
    const option =
      result.categories[0].products[0].modifierGroups[0].options[0];

    expect(option.category).toEqual({
      id: 'category-doces',
      name: 'Doces',
      sortOrder: 3,
    });
  });

  it('expoe limite individual do tamanho como regra generica', async () => {
    mockBaseData({
      products: [product('pizza-product', 'Pizza Redonda', 'category-1')],
      productGroups: [
        productGroup('pizza-product', 'group-size', 'pizza_size', 10),
      ],
      productOptions: [
        productOption(
          'pizza-product',
          'group-size',
          'option-size-30',
          '30cm',
          0,
          0,
          'size-30',
        ),
        productOption(
          'pizza-product',
          'group-size',
          'option-size-40',
          '40cm',
          0,
          1,
          'size-40',
        ),
      ],
      optionRules: [
        optionRule(
          'pizza-product',
          'option-size-30',
          'group-flavor',
          'pizza_flavor',
          true,
          1,
          2,
        ),
        optionRule(
          'pizza-product',
          'option-size-40',
          'group-flavor',
          'pizza_flavor',
          true,
          1,
          3,
        ),
      ],
    });

    const result = await service.findBySlug('tenant-slug');
    const options = result.categories[0].products[0].modifierGroups[0].options;

    expect(
      options.map(
        (option) =>
          option.rules.find((rule) => rule.targetGroupId === 'group-flavor')
            ?.maxSelections,
      ),
    ).toEqual([2, 3]);
  });

  it('expoe regra de borda desabilitada para o tamanho', async () => {
    mockBaseData({
      products: [product('pizza-product', 'Pizza Redonda', 'category-1')],
      productGroups: [
        productGroup('pizza-product', 'group-size', 'pizza_size', 10),
      ],
      productOptions: [
        productOption(
          'pizza-product',
          'group-size',
          'option-size-20',
          '20cm',
          0,
        ),
      ],
      optionRules: [
        optionRule(
          'pizza-product',
          'option-size-20',
          'group-flavor',
          'pizza_flavor',
          true,
          1,
          1,
        ),
        optionRule(
          'pizza-product',
          'option-size-20',
          'group-border',
          'pizza_border',
          false,
          0,
          0,
        ),
      ],
    });

    const result = await service.findBySlug('tenant-slug');
    const option =
      result.categories[0].products[0].modifierGroups[0].options[0];

    expect(option.rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetGroupCode: 'pizza_flavor',
          isEnabled: true,
          maxSelections: 1,
        }),
        expect.objectContaining({
          targetGroupCode: 'pizza_border',
          isEnabled: false,
          maxSelections: 0,
        }),
      ]),
    );
  });

  it('aplica trim nos nomes somente na resposta', async () => {
    mockBaseData({
      categories: [category('category-1', ' Pizzas ')],
      products: [product('pizza-product', ' Pizza Redonda ', 'category-1')],
      productGroups: [
        productGroup('pizza-product', 'group-flavor', 'pizza_flavor', 1),
      ],
      productOptions: [
        productOption(
          'pizza-product',
          'group-flavor',
          'option-flavor',
          ' mussarela ',
          0,
        ),
      ],
    });

    const result = await service.findBySlug('tenant-slug');

    expect(result.categories[0].name).toBe('Pizzas');
    expect(result.categories[0].products[0].name).toBe('Pizza Redonda');
    expect(
      result.categories[0].products[0].modifierGroups[0].options[0].name,
    ).toBe('mussarela');
  });

  it('preserva ordenacao de categorias, produtos, grupos e opcoes', async () => {
    mockBaseData({
      categories: [
        category('category-2', 'Bebidas', 20),
        category('category-1', 'Pizzas', 10),
      ],
      products: [
        product('product-3', 'Bebida', 'category-2', 10),
        product('product-2', 'Produto 2', 'category-1', 20),
        product('product-1', 'Produto 1', 'category-1', 10),
      ],
      productGroups: [
        productGroup('product-1', 'group-2', 'extras', 20),
        productGroup('product-1', 'group-1', 'sizes', 10),
      ],
      productOptions: [
        productOption('product-1', 'group-1', 'option-2', 'B', 0, 20),
        productOption('product-1', 'group-1', 'option-1', 'A', 0, 10),
      ],
    });

    const result = await service.findBySlug('tenant-slug');
    const menuProduct = result.categories[0].products[0];

    expect(result.categories.map((item) => item.name)).toEqual([
      'Pizzas',
      'Bebidas',
    ]);
    expect(result.categories[0].products.map((item) => item.name)).toEqual([
      'Produto 1',
      'Produto 2',
    ]);
    expect(menuProduct.modifierGroups.map((item) => item.code)).toEqual([
      'sizes',
      'extras',
    ]);
    expect(
      menuProduct.modifierGroups[0].options.map((item) => item.name),
    ).toEqual(['A', 'B']);
  });

  it('nao retorna opcao orfa nao vinculada ao produto', async () => {
    mockBaseData({
      products: [product('pizza-product', 'Pizza Redonda', 'category-1')],
      productGroups: [
        productGroup('pizza-product', 'group-flavor', 'pizza_flavor', 1),
      ],
      productOptions: [
        productOption(
          'other-product',
          'group-flavor',
          'orphan-option',
          'Orfa',
          0,
        ),
      ],
    });

    const result = await service.findBySlug('tenant-slug');

    expect(result.categories[0].products[0].modifierGroups[0].options).toEqual(
      [],
    );
  });

  it('usa quantidade constante de queries em lote', async () => {
    mockBaseData({
      products: [
        product('product-1', 'Produto 1', 'category-1'),
        product('product-2', 'Produto 2', 'category-1'),
      ],
    });

    await service.findBySlug('tenant-slug');

    expect(prisma.tenant.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.category.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.productModifierGroup.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.productModifierOption.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.modifierOptionPrice.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.productModifierOptionRule.findMany).toHaveBeenCalledTimes(1);
    expect(
      subscriptionAccessService.evaluateTenantAccess,
    ).toHaveBeenCalledTimes(1);
  });

  it('calcula pizza inteira via PriceEngine', async () => {
    mockTenant();
    mockPriceResult(40);

    const result = await service.calculatePriceBySlug(
      'tenant-slug',
      priceRequest(['size-30', 'flavor-calabresa']),
    );

    expect(result.unitPrice).toBe(40);
    expect(priceEngineService.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        productId: 'pizza-product',
      }),
    );
  });

  it('calcula meio a meio cobrando maior preco', async () => {
    mockTenant();
    mockPriceResult(40);

    const result = await service.calculatePriceBySlug(
      'tenant-slug',
      priceRequest(['size-30', 'flavor-calabresa', 'flavor-mussarela']),
    );

    expect(result.unitPrice).toBe(40);
  });

  it('calcula 3 sabores cobrando maior preco', async () => {
    mockTenant();
    mockPriceResult(67);

    const result = await service.calculatePriceBySlug(
      'tenant-slug',
      priceRequest([
        'size-40',
        'flavor-queijo-presunto',
        'flavor-peperone',
        'flavor-brigadeiro',
      ]),
    );

    expect(result.unitPrice).toBe(67);
  });

  it('calcula borda via PriceEngine', async () => {
    mockTenant();
    mockPriceResult(48);

    const result = await service.calculatePriceBySlug(
      'tenant-slug',
      priceRequest(['size-30', 'flavor-calabresa', 'border-catupiry']),
    );

    expect(result.unitPrice).toBe(48);
  });

  it('retorna erro de opcao invalida do PriceEngine', async () => {
    mockTenant();
    mockPriceResult(0, ['OPTION_NOT_ALLOWED']);

    const result = await service.calculatePriceBySlug(
      'tenant-slug',
      priceRequest(['invalid-option']),
    );

    expect(result.validationErrors).toEqual([
      expect.objectContaining({ code: 'OPTION_NOT_ALLOWED' }),
    ]);
  });

  it('retorna erro de contexto nao selecionado do PriceEngine', async () => {
    mockTenant();
    mockPriceResult(0, ['CONTEXT_OPTION_NOT_SELECTED']);

    const request = priceRequest(['size-large', 'flavor-calabresa']);
    request.selectedModifiers[1].dependsOnOptionId = 'size-small';

    const result = await service.calculatePriceBySlug('tenant-slug', request);

    expect(priceEngineService.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        selectedModifiers: request.selectedModifiers,
      }),
    );
    expect(result.validationErrors).toEqual([
      expect.objectContaining({ code: 'CONTEXT_OPTION_NOT_SELECTED' }),
    ]);
  });

  it('retorna erro de grupo obrigatorio ausente do PriceEngine', async () => {
    mockTenant();
    mockPriceResult(40, ['REQUIRED_GROUP_MISSING']);

    const result = await service.calculatePriceBySlug(
      'tenant-slug',
      priceRequest(['flavor-calabresa']),
    );

    expect(result.validationErrors).toEqual([
      expect.objectContaining({ code: 'REQUIRED_GROUP_MISSING' }),
    ]);
  });

  function mockBaseData(data: {
    categories?: any[];
    products?: any[];
    productGroups?: any[];
    productOptions?: any[];
    optionPrices?: any[];
    optionRules?: any[];
  }) {
    mockTenant();
    prisma.category.findMany.mockResolvedValue(
      data.categories ?? [category('category-1', 'Pizzas')],
    );
    prisma.product.findMany.mockResolvedValue(data.products ?? []);
    prisma.productModifierGroup.findMany.mockResolvedValue(
      data.productGroups ?? [],
    );
    prisma.productModifierOption.findMany.mockResolvedValue(
      data.productOptions ?? [],
    );
    prisma.modifierOptionPrice.findMany.mockResolvedValue(
      data.optionPrices ?? [],
    );
    prisma.productModifierOptionRule.findMany.mockResolvedValue(
      data.optionRules ?? [],
    );
  }

  function mockTenant() {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'Tenant',
      slug: 'tenant-slug',
      whatsapp: null,
      logoUrl: null,
      settings: null,
      isActive: true,
    });
  }

  function mockPriceResult(unitPrice: number, errorCodes: string[] = []) {
    priceEngineService.calculate.mockResolvedValue({
      unitPrice,
      totalPrice: unitPrice,
      appliedModifiers: [],
      validationErrors: errorCodes.map((code) => ({
        code,
        message: code,
      })),
    });
  }
});

function priceRequest(optionIds: string[]) {
  return {
    productId: 'pizza-product',
    quantity: 1,
    selectedModifiers: optionIds.map((optionId) => ({
      optionId,
    })),
  };
}

function category(id: string, name: string, sortOrder = 0) {
  return {
    id,
    name,
    slug: id,
    type: CategoryType.PRODUCT_SECTION,
    sortOrder,
  };
}

function product(id: string, name: string, categoryId: string, sortOrder = 0) {
  return {
    id,
    name,
    description: null,
    imageUrl: null,
    type: ProductType.OTHER,
    pricingMode: ProductPricingMode.FIXED,
    basePrice: null,
    price: 10,
    sortOrder,
    categoryId,
  };
}

function productGroup(
  productId: string,
  groupId: string,
  code: string,
  sortOrder: number,
  pricingMode = ModifierPricingMode.ADDITIVE,
  minSelections = 0,
  maxSelections = 1,
  isRequired = false,
) {
  return {
    id: `pmg-${productId}-${groupId}`,
    productId,
    sortOrder,
    isRequiredOverride: null,
    minSelectionsOverride: null,
    maxSelectionsOverride: null,
    modifierGroup: {
      id: groupId,
      code,
      name: code,
      description: null,
      selectionType:
        maxSelections > 1
          ? ModifierSelectionType.MULTIPLE
          : ModifierSelectionType.SINGLE,
      pricingMode,
      minSelections,
      maxSelections,
      isRequired,
    },
  };
}

function productOption(
  productId: string,
  groupId: string,
  optionId: string,
  name: string,
  priceDelta: number,
  sortOrder = 0,
  code?: string,
  displayCategoryId?: string,
) {
  return {
    id: `pmo-${productId}-${optionId}`,
    productId,
    modifierGroupId: groupId,
    modifierOptionId: optionId,
    displayCategoryId: displayCategoryId ?? null,
    isActive: true,
    sortOrder,
    priceDeltaOverride: null,
    modifierOption: {
      id: optionId,
      groupId,
      code: code ?? optionId,
      name,
      description: null,
      imageUrl: null,
      priceDelta,
      isActive: true,
      sortOrder,
    },
  };
}

function optionRule(
  productId: string,
  sourceOptionId: string,
  targetGroupId: string,
  targetGroupCode: string,
  isEnabled: boolean,
  minSelections: number,
  maxSelections: number,
) {
  return {
    id: `rule-${sourceOptionId}-${targetGroupId}`,
    productId,
    sourceOptionId,
    targetGroupId,
    isEnabled,
    minSelections,
    maxSelections,
    metadata: null,
    targetGroup: {
      code: targetGroupCode,
    },
  };
}

function optionPrice(
  productId: string,
  optionId: string,
  dependsOnOptionId: string,
  price: number,
  isActive = true,
) {
  return {
    id: `price-${optionId}-${dependsOnOptionId}`,
    productId,
    modifierOptionId: optionId,
    dependsOnOptionId,
    price,
    isActive,
  };
}
