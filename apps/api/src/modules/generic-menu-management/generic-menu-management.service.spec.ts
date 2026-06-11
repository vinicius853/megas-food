import { BadRequestException } from '@nestjs/common';
import {
  CategoryType,
  ModifierPricingMode,
  ModifierSelectionType,
  ProductPricingMode,
  ProductType,
} from '@prisma/client';

import { GenericMenuManagementService } from './generic-menu-management.service';
import { GenericMenuManagementValidator } from './generic-menu-management.validator';
import { GenericMenuManagementWriter } from './generic-menu-management.writer';

const tenantId = 'tenant-1';

describe('GenericMenuManagementService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: GenericMenuManagementService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new GenericMenuManagementService(
      prisma as never,
      new GenericMenuManagementValidator(prisma as never),
      new GenericMenuManagementWriter(),
    );
  });

  it('le produto com tamanhos, sabores, bordas, precos, regras e categoria visual', async () => {
    mockGenericPizza(prisma);

    const result = await service.findOne(tenantId);
    const pizza = result.products[0];
    const sizeGroup = groupByCode(pizza.modifierGroups, 'pizza_size');
    const flavorGroup = groupByCode(pizza.modifierGroups, 'pizza_flavor');
    const borderGroup = groupByCode(pizza.modifierGroups, 'pizza_border');
    const size = sizeGroup.options[0];
    const flavor = flavorGroup.options[0];
    const border = borderGroup.options[0];

    expect(result.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'category-doces', name: 'Doces' }),
      ]),
    );
    expect(size).toEqual(
      expect.objectContaining({
        name: '30cm',
        isActive: true,
        rules: expect.arrayContaining([
          expect.objectContaining({
            targetGroupCode: 'pizza_flavor',
            maxSelections: 2,
          }),
          expect.objectContaining({
            targetGroupCode: 'pizza_border',
            isEnabled: true,
          }),
        ]),
      }),
    );
    expect(flavor).toEqual(
      expect.objectContaining({
        name: 'Brigadeiro',
        displayCategoryId: 'category-doces',
        prices: [
          expect.objectContaining({
            dependsOnOptionId: 'option-size-30',
            price: 45,
          }),
        ],
      }),
    );
    expect(border).toEqual(
      expect.objectContaining({
        name: 'Catupiry',
        prices: [
          expect.objectContaining({
            dependsOnOptionId: 'option-size-30',
            price: 8,
          }),
        ],
      }),
    );
  });

  it('inclui opcoes inativas para permitir reativacao no admin', async () => {
    mockGenericPizza(prisma);
    prisma.productModifierOption.findMany.mockResolvedValueOnce([
      productOption('group-flavor', 'option-flavor', 'Sabor pausado', false),
    ]);

    const result = await service.findOne(tenantId);
    const option = result.products[0].modifierGroups
      .flatMap((group) => group.options)
      .find((item) => item.id === 'option-flavor');

    expect(option?.isActive).toBe(false);
  });

  it('filtra todas as consultas de leitura pelo tenant autenticado', async () => {
    mockGenericPizza(prisma);

    await service.findOne(tenantId);

    for (const delegate of readDelegates(prisma)) {
      expect(delegate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        }),
      );
    }
  });

  it('aceita referencias que pertencem ao tenant', async () => {
    mockOwnedReferences(prisma);

    await expect(
      service.validateUpdatePayload(tenantId, updatePayload()),
    ).resolves.toBeUndefined();
  });

  it('rejeita categoria pertencente a outro tenant', async () => {
    mockOwnedReferences(prisma);
    prisma.category.findMany.mockResolvedValueOnce([{ id: 'category-pizzas' }]);

    await expect(
      service.validateUpdatePayload(tenantId, updatePayload()),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejeita opcao contextual pertencente a outro tenant', async () => {
    mockOwnedReferences(prisma);
    prisma.modifierOption.findMany.mockResolvedValueOnce([
      { id: 'option-flavor' },
    ]);

    await expect(
      service.validateUpdatePayload(tenantId, updatePayload()),
    ).rejects.toThrow(/outro tenant/);
  });

  it('rejeita limites estruturais invalidos antes de consultar referencias', async () => {
    const payload = updatePayload();
    payload.products[0].modifierGroups[0].maxSelections = 0;
    payload.products[0].modifierGroups[0].minSelections = 1;

    await expect(
      service.validateUpdatePayload(tenantId, payload),
    ).rejects.toThrow(/maxSelections/);
    expect(prisma.category.findMany).not.toHaveBeenCalled();
  });
});

function createPrismaMock() {
  return {
    category: delegate(),
    product: delegate(),
    productModifierGroup: delegate(),
    productModifierOption: delegate(),
    modifierOptionPrice: delegate(),
    productModifierOptionRule: delegate(),
    modifierGroup: delegate(),
    modifierOption: delegate(),
  };
}

function delegate() {
  return {
    findMany: jest.fn().mockResolvedValue([]),
  };
}

function readDelegates(prisma: ReturnType<typeof createPrismaMock>) {
  return [
    prisma.category,
    prisma.product,
    prisma.productModifierGroup,
    prisma.productModifierOption,
    prisma.modifierOptionPrice,
    prisma.productModifierOptionRule,
  ];
}

function mockGenericPizza(prisma: ReturnType<typeof createPrismaMock>) {
  prisma.category.findMany.mockResolvedValue([
    category('category-pizzas', 'Pizzas'),
    category('category-doces', 'Doces'),
  ]);
  prisma.product.findMany.mockResolvedValue([
    {
      id: 'product-pizza',
      tenantId,
      categoryId: 'category-pizzas',
      name: 'Pizza Redonda',
      description: null,
      imageUrl: null,
      type: ProductType.PIZZA_ROUND,
      pricingMode: ProductPricingMode.FROM_MODIFIERS,
      basePrice: null,
      price: null,
      isActive: true,
      sortOrder: 1,
    },
  ]);
  prisma.productModifierGroup.findMany.mockResolvedValue([
    productGroup('group-size', 'pizza_size', 10),
    productGroup(
      'group-flavor',
      'pizza_flavor',
      20,
      ModifierPricingMode.HIGHEST_SELECTED,
      ModifierSelectionType.MULTIPLE,
      1,
      3,
      true,
    ),
    productGroup('group-border', 'pizza_border', 30),
  ]);
  prisma.productModifierOption.findMany.mockResolvedValue([
    productOption('group-size', 'option-size-30', '30cm'),
    productOption(
      'group-flavor',
      'option-flavor-brigadeiro',
      'Brigadeiro',
      true,
      'category-doces',
    ),
    productOption('group-border', 'option-border-catupiry', 'Catupiry'),
  ]);
  prisma.modifierOptionPrice.findMany.mockResolvedValue([
    contextualPrice('option-flavor-brigadeiro', 45),
    contextualPrice('option-border-catupiry', 8),
  ]);
  prisma.productModifierOptionRule.findMany.mockResolvedValue([
    rule('group-flavor', 'pizza_flavor', 1, 2, true),
    rule('group-border', 'pizza_border', 0, 1, true),
  ]);
}

function category(id: string, name: string) {
  return {
    id,
    tenantId,
    name,
    slug: id,
    type: CategoryType.PRODUCT_SECTION,
    sortOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function productGroup(
  groupId: string,
  code: string,
  sortOrder: number,
  pricingMode = ModifierPricingMode.INCLUDED,
  selectionType = ModifierSelectionType.SINGLE,
  minSelections = 0,
  maxSelections = 1,
  isRequired = false,
) {
  return {
    id: `link-${groupId}`,
    tenantId,
    productId: 'product-pizza',
    modifierGroupId: groupId,
    sortOrder,
    isRequiredOverride: null,
    minSelectionsOverride: null,
    maxSelectionsOverride: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    modifierGroup: {
      id: groupId,
      tenantId,
      code,
      name: code,
      description: null,
      selectionType,
      pricingMode,
      minSelections,
      maxSelections,
      isRequired,
      sortOrder,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function productOption(
  groupId: string,
  optionId: string,
  name: string,
  isActive = true,
  displayCategoryId: string | null = null,
) {
  return {
    id: `link-${optionId}`,
    tenantId,
    productId: 'product-pizza',
    modifierGroupId: groupId,
    modifierOptionId: optionId,
    displayCategoryId,
    isActive,
    sortOrder: 1,
    priceDeltaOverride: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    modifierOption: {
      id: optionId,
      tenantId,
      groupId,
      name,
      code: optionId,
      description: null,
      imageUrl: null,
      priceDelta: 0,
      sortOrder: 1,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function contextualPrice(optionId: string, price: number) {
  return {
    id: `price-${optionId}`,
    tenantId,
    productId: 'product-pizza',
    modifierOptionId: optionId,
    dependsOnOptionId: 'option-size-30',
    price,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function rule(
  targetGroupId: string,
  targetGroupCode: string,
  minSelections: number,
  maxSelections: number,
  isEnabled: boolean,
) {
  return {
    id: `rule-${targetGroupId}`,
    tenantId,
    productId: 'product-pizza',
    sourceOptionId: 'option-size-30',
    targetGroupId,
    isEnabled,
    minSelections,
    maxSelections,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    targetGroup: {
      code: targetGroupCode,
    },
  };
}

function mockOwnedReferences(prisma: ReturnType<typeof createPrismaMock>) {
  prisma.category.findMany.mockResolvedValue([
    { id: 'category-pizzas' },
    { id: 'category-doces' },
  ]);
  prisma.product.findMany.mockResolvedValue([{ id: 'product-pizza' }]);
  prisma.modifierGroup.findMany.mockResolvedValue([
    { id: 'group-flavor' },
    { id: 'group-size' },
  ]);
  prisma.modifierOption.findMany.mockResolvedValue([
    { id: 'option-flavor', groupId: 'group-flavor' },
    { id: 'option-size-30', groupId: 'group-size' },
  ]);
  prisma.productModifierGroup.findMany
    .mockResolvedValueOnce([
      {
        id: 'link-group-flavor',
        productId: 'product-pizza',
        modifierGroupId: 'group-flavor',
      },
    ])
    .mockResolvedValueOnce([
      {
        productId: 'product-pizza',
        modifierGroupId: 'group-flavor',
      },
      {
        productId: 'product-pizza',
        modifierGroupId: 'group-size',
      },
    ]);
  prisma.productModifierOption.findMany
    .mockResolvedValueOnce([
      {
        id: 'link-option-flavor',
        productId: 'product-pizza',
        modifierGroupId: 'group-flavor',
        modifierOptionId: 'option-flavor',
      },
    ])
    .mockResolvedValueOnce([
      {
        productId: 'product-pizza',
        modifierGroupId: 'group-flavor',
        modifierOptionId: 'option-flavor',
      },
      {
        productId: 'product-pizza',
        modifierGroupId: 'group-size',
        modifierOptionId: 'option-size-30',
      },
    ]);
  prisma.modifierOptionPrice.findMany.mockResolvedValue([]);
  prisma.productModifierOptionRule.findMany.mockResolvedValue([]);
}

function updatePayload() {
  return {
    categories: [
      {
        id: 'category-pizzas',
        name: 'Pizzas',
        slug: 'pizzas',
        type: CategoryType.PRODUCT_SECTION,
        sortOrder: 0,
        isActive: true,
      },
      {
        id: 'category-doces',
        name: 'Doces',
        slug: 'doces',
        type: CategoryType.PIZZA_FLAVOR_GROUP,
        sortOrder: 1,
        isActive: true,
      },
    ],
    products: [
      {
        id: 'product-pizza',
        categoryId: 'category-pizzas',
        name: 'Pizza Redonda',
        type: ProductType.PIZZA_ROUND,
        pricingMode: ProductPricingMode.FROM_MODIFIERS,
        isActive: true,
        sortOrder: 1,
        modifierGroups: [
          {
            productModifierGroupId: 'link-group-flavor',
            modifierGroupId: 'group-flavor',
            code: 'pizza_flavor',
            name: 'Sabores',
            selectionType: ModifierSelectionType.MULTIPLE,
            pricingMode: ModifierPricingMode.HIGHEST_SELECTED,
            isRequired: true,
            minSelections: 1,
            maxSelections: 3,
            sortOrder: 20,
            isActive: true,
            options: [
              {
                productModifierOptionId: 'link-option-flavor',
                modifierOptionId: 'option-flavor',
                code: 'flavor',
                name: 'Brigadeiro',
                displayCategoryId: 'category-doces',
                priceDelta: 0,
                sortOrder: 1,
                isActive: true,
                prices: [
                  {
                    dependsOnOptionId: 'option-size-30',
                    price: 45,
                  },
                ],
                rules: [
                  {
                    targetGroupId: 'group-size',
                    isEnabled: true,
                    minSelections: 1,
                    maxSelections: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function groupByCode<T extends { code: string }>(groups: T[], code: string) {
  const group = groups.find((item) => item.code === code);

  if (!group) {
    throw new Error(`Group not found: ${code}`);
  }

  return group;
}
