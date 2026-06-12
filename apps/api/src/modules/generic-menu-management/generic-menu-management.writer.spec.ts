import {
  CategoryType,
  ModifierPricingMode,
  ModifierSelectionType,
  ProductPricingMode,
  ProductType,
} from '@prisma/client';

import { GenericMenuManagementWriter } from './generic-menu-management.writer';

describe('GenericMenuManagementWriter', () => {
  it('resolve referencia temporaria de opcao em preco contextual', async () => {
    const tx = createTransactionMock();
    const writer = new GenericMenuManagementWriter();

    await writer.write(tx as never, 'tenant-1', payload() as never);

    expect(tx.modifierOptionPrice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        productId: 'product-pizza',
        modifierOptionId: 'option-flavor',
        dependsOnOptionId: 'option-size-created',
        price: 70,
      }),
    });
  });

  it('resolve grupo criado na mesma transacao pelo codigo', async () => {
    const tx = createTransactionMock();
    const writer = new GenericMenuManagementWriter();
    const input = payload();
    input.products[0].modifierGroups[0].options[0].rules = [
      {
        targetGroupCode: 'pizza_flavor',
        isEnabled: true,
        minSelections: 1,
        maxSelections: 2,
      },
    ];

    await writer.write(tx as never, 'tenant-1', input as never);

    expect(tx.productModifierOptionRule.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          targetGroupId: 'group-flavor',
        }),
      }),
    );
  });

  it('cria produto novo e vincula grupos no fluxo generico', async () => {
    const tx = createTransactionMock();
    const writer = new GenericMenuManagementWriter();
    const input = payload();
    (input.products[0] as { id?: string }).id = undefined;

    await writer.write(tx as never, 'tenant-1', input as never);

    expect(tx.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        name: 'Pizza',
        type: ProductType.PIZZA_ROUND,
        pricingMode: ProductPricingMode.FROM_MODIFIERS,
      }),
    });
    expect(tx.productModifierGroup.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productId: 'product-created',
        }),
      }),
    );
  });
});

function createTransactionMock() {
  return {
    category: {
      update: jest.fn().mockResolvedValue({ id: 'category-pizzas' }),
    },
    product: {
      update: jest.fn().mockResolvedValue({ id: 'product-pizza' }),
      create: jest.fn().mockResolvedValue({ id: 'product-created' }),
    },
    modifierGroup: {
      update: jest
        .fn()
        .mockImplementation(({ where }) => Promise.resolve({ id: where.id })),
    },
    productModifierGroup: {
      update: jest.fn().mockResolvedValue({}),
    },
    modifierOption: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValueOnce({ id: 'option-size-created' }),
      update: jest.fn().mockResolvedValue({ id: 'option-flavor' }),
    },
    productModifierOption: {
      upsert: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    modifierOptionPrice: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    },
    productModifierOptionRule: {
      upsert: jest.fn().mockResolvedValue({}),
    },
  };
}

function payload() {
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
    ],
    products: [
      {
        id: 'product-pizza',
        categoryId: 'category-pizzas',
        name: 'Pizza',
        type: ProductType.PIZZA_ROUND,
        pricingMode: ProductPricingMode.FROM_MODIFIERS,
        isActive: true,
        sortOrder: 0,
        modifierGroups: [
          {
            productModifierGroupId: 'link-size',
            modifierGroupId: 'group-size',
            code: 'pizza_size',
            name: 'Tamanhos',
            selectionType: ModifierSelectionType.SINGLE,
            pricingMode: ModifierPricingMode.INCLUDED,
            isRequired: true,
            minSelections: 1,
            maxSelections: 1,
            sortOrder: 0,
            isActive: true,
            options: [
              {
                clientId: 'size-draft',
                name: '45cm',
                priceDelta: 0,
                sortOrder: 0,
                isActive: true,
                prices: [],
                rules: [],
              },
            ],
          },
          {
            productModifierGroupId: 'link-flavor',
            modifierGroupId: 'group-flavor',
            code: 'pizza_flavor',
            name: 'Sabores',
            selectionType: ModifierSelectionType.MULTIPLE,
            pricingMode: ModifierPricingMode.HIGHEST_SELECTED,
            isRequired: true,
            minSelections: 1,
            maxSelections: 4,
            sortOrder: 1,
            isActive: true,
            options: [
              {
                productModifierOptionId: 'link-flavor-option',
                modifierOptionId: 'option-flavor',
                name: 'Calabresa',
                priceDelta: 0,
                sortOrder: 0,
                isActive: true,
                prices: [
                  {
                    dependsOnOptionClientId: 'size-draft',
                    price: 70,
                  },
                ],
                rules: [],
              },
            ],
          },
        ],
      },
    ],
  };
}
