import {
  ModifierPricingMode,
  ModifierSelectionType,
  ProductPricingMode,
} from '@prisma/client';

import { PriceEngineService } from './price-engine.service';

const tenantId = 'tenant-1';
const productId = 'product-1';

describe('PriceEngineService', () => {
  let service: PriceEngineService;
  let prisma: {
    product: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      product: {
        findFirst: jest.fn(),
      },
    };

    service = new PriceEngineService(prisma as any);
  });

  it('calcula produto fixo sem modificadores', async () => {
    mockProduct({
      price: 25,
      modifierGroups: [],
      modifierOptions: [],
      modifierOptionPrices: [],
    });

    const result = await service.calculate({
      tenantId,
      productId,
      quantity: 2,
      selectedModifiers: [],
    });

    expect(result.validationErrors).toEqual([]);
    expect(result.unitPrice).toBe(25);
    expect(result.totalPrice).toBe(50);
  });

  it('calcula pizza inteira pelo preco contextual do sabor no tamanho', async () => {
    mockProduct(pizzaProduct());

    const result = await service.calculate({
      tenantId,
      productId,
      quantity: 1,
      selectedModifiers: [
        selected('pizza_size', 'size-large'),
        selected('pizza_flavor', 'flavor-calabresa', 'size-large'),
      ],
    });

    expect(result.validationErrors).toEqual([]);
    expect(result.unitPrice).toBe(50);
    expect(result.totalPrice).toBe(50);
  });

  it('rejeita preco contextual inativo', async () => {
    const product = pizzaProduct();
    product.modifierOptionPrices = product.modifierOptionPrices.map((price) =>
      price.modifierOptionId === 'flavor-calabresa' &&
      price.dependsOnOptionId === 'size-large'
        ? { ...price, isActive: false }
        : price,
    );
    mockProduct(product);

    const result = await service.calculate({
      tenantId,
      productId,
      quantity: 1,
      selectedModifiers: [
        selected('pizza_size', 'size-large'),
        selected('pizza_flavor', 'flavor-calabresa', 'size-large'),
      ],
    });

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'CONTEXTUAL_PRICE_NOT_FOUND' }),
      ]),
    );
  });

  it('calcula meio a meio usando o maior preco entre sabores', async () => {
    mockProduct(pizzaProduct());

    const result = await service.calculate({
      tenantId,
      productId,
      quantity: 1,
      selectedModifiers: [
        selected('pizza_size', 'size-large'),
        {
          ...selected('pizza_flavor', 'flavor-calabresa', 'size-large'),
          fraction: 0.5,
        },
        {
          ...selected('pizza_flavor', 'flavor-frango', 'size-large'),
          fraction: 0.5,
        },
      ],
    });

    expect(result.validationErrors).toEqual([]);
    expect(result.unitPrice).toBe(60);
    expect(result.appliedModifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          optionId: 'flavor-frango',
          totalDelta: 60,
        }),
        expect.objectContaining({
          optionId: 'flavor-calabresa',
          totalDelta: 0,
        }),
      ]),
    );
  });

  it('calcula pizza com 3 sabores sem somar todos os sabores', async () => {
    mockProduct(pizzaProduct());

    const result = await service.calculate({
      tenantId,
      productId,
      quantity: 1,
      selectedModifiers: [
        selected('pizza_size', 'size-large'),
        selected('pizza_flavor', 'flavor-calabresa', 'size-large'),
        selected('pizza_flavor', 'flavor-frango', 'size-large'),
        selected('pizza_flavor', 'flavor-portuguesa', 'size-large'),
      ],
    });

    expect(result.validationErrors).toEqual([]);
    expect(result.unitPrice).toBe(65);
  });

  it('calcula pizza com borda aditiva dependente do tamanho', async () => {
    mockProduct(pizzaProduct());

    const result = await service.calculate({
      tenantId,
      productId,
      quantity: 1,
      selectedModifiers: [
        selected('pizza_size', 'size-large'),
        selected('pizza_flavor', 'flavor-calabresa', 'size-large'),
        selected('pizza_border', 'border-catupiry', 'size-large'),
      ],
    });

    expect(result.validationErrors).toEqual([]);
    expect(result.unitPrice).toBe(58);
  });

  it('calcula adicional simples por ADDITIVE', async () => {
    mockProduct({
      price: 20,
      modifierGroups: [group('extras', ModifierPricingMode.ADDITIVE, 0, 5)],
      modifierOptions: [productOption('extra-bacon', 'extras', 4, true)],
      modifierOptionPrices: [],
    });

    const result = await service.calculate({
      tenantId,
      productId,
      quantity: 1,
      selectedModifiers: [
        {
          groupCode: 'extras',
          optionId: 'extra-bacon',
          quantity: 2,
        },
      ],
    });

    expect(result.validationErrors).toEqual([]);
    expect(result.unitPrice).toBe(28);
  });

  it('calcula hamburguer generico sem regra especifica de segmento', async () => {
    mockProduct({
      price: 24,
      modifierGroups: [
        group('ponto_carne', ModifierPricingMode.INCLUDED, 1, 1, true),
        group('queijos', ModifierPricingMode.ADDITIVE, 0, 2),
        group('extras', ModifierPricingMode.ADDITIVE, 0, 5),
      ],
      modifierOptions: [
        productOption('ponto-ao-ponto', 'ponto_carne', 0, true),
        productOption('queijo-cheddar', 'queijos', 3, true),
        productOption('extra-bacon', 'extras', 4, true),
      ],
      modifierOptionPrices: [],
    });

    const result = await service.calculate({
      tenantId,
      productId,
      quantity: 1,
      selectedModifiers: [
        selected('ponto_carne', 'ponto-ao-ponto'),
        selected('queijos', 'queijo-cheddar'),
        selected('extras', 'extra-bacon'),
      ],
    });

    expect(result.validationErrors).toEqual([]);
    expect(result.unitPrice).toBe(31);
  });

  it('valida obrigatoriedade, limite, opcao inativa e preco contextual', async () => {
    mockProduct(pizzaProduct({ inactiveBorder: true }));

    const result = await service.calculate({
      tenantId,
      productId,
      quantity: 1,
      selectedModifiers: [
        selected('pizza_flavor', 'flavor-calabresa', 'missing-size'),
        selected('pizza_flavor', 'flavor-frango', 'size-large'),
        selected('pizza_flavor', 'flavor-portuguesa', 'size-large'),
        selected('pizza_flavor', 'flavor-marguerita', 'size-large'),
        selected('pizza_flavor', 'flavor-napolitana', 'size-large'),
        selected('pizza_border', 'border-catupiry', 'size-large'),
        selected('pizza_border', 'border-not-allowed', 'size-large'),
      ],
    });

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'REQUIRED_GROUP_MISSING' }),
        expect.objectContaining({ code: 'MAX_SELECTIONS_EXCEEDED' }),
        expect.objectContaining({ code: 'OPTION_INACTIVE' }),
        expect.objectContaining({ code: 'OPTION_NOT_ALLOWED' }),
        expect.objectContaining({
          code: 'CONTEXTUAL_PRICE_NOT_FOUND',
        }),
      ]),
    );
  });

  function mockProduct(product: Record<string, unknown>) {
    prisma.product.findFirst.mockResolvedValue({
      id: productId,
      tenantId,
      pricingMode: ProductPricingMode.FIXED,
      basePrice: null,
      price: product.price ?? 0,
      ...product,
    });
  }
});

function pizzaProduct(options: { inactiveBorder?: boolean } = {}) {
  return {
    price: 0,
    modifierGroups: [
      group('pizza_size', ModifierPricingMode.INCLUDED, 1, 1, true),
      group('pizza_flavor', ModifierPricingMode.HIGHEST_SELECTED, 1, 4, true),
      group('pizza_border', ModifierPricingMode.ADDITIVE, 0, 1),
    ],
    modifierOptions: [
      productOption('size-large', 'pizza_size', 0, true),
      productOption('flavor-calabresa', 'pizza_flavor', 0, true),
      productOption('flavor-frango', 'pizza_flavor', 0, true),
      productOption('flavor-portuguesa', 'pizza_flavor', 0, true),
      productOption('flavor-marguerita', 'pizza_flavor', 0, true),
      productOption('flavor-napolitana', 'pizza_flavor', 0, true),
      productOption(
        'border-catupiry',
        'pizza_border',
        0,
        !options.inactiveBorder,
      ),
    ],
    modifierOptionPrices: [
      optionPrice('flavor-calabresa', 'size-large', 50),
      optionPrice('flavor-frango', 'size-large', 60),
      optionPrice('flavor-portuguesa', 'size-large', 65),
      optionPrice('flavor-marguerita', 'size-large', 55),
      optionPrice('flavor-napolitana', 'size-large', 57),
      optionPrice('border-catupiry', 'size-large', 8),
    ],
  };
}

function group(
  code: string,
  pricingMode: ModifierPricingMode,
  minSelections: number,
  maxSelections: number,
  isRequired = false,
) {
  return {
    id: `pmg-${code}`,
    sortOrder: 0,
    isRequiredOverride: null,
    minSelectionsOverride: null,
    maxSelectionsOverride: null,
    modifierGroup: {
      id: `group-${code}`,
      code,
      name: code,
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
  optionId: string,
  groupCode: string,
  priceDelta: number,
  isActive: boolean,
) {
  return {
    id: `pmo-${optionId}`,
    productId,
    modifierGroupId: `group-${groupCode}`,
    modifierOptionId: optionId,
    isActive,
    priceDeltaOverride: null,
    modifierOption: {
      id: optionId,
      groupId: `group-${groupCode}`,
      code: optionId,
      name: optionId,
      priceDelta,
      isActive,
    },
  };
}

function optionPrice(
  modifierOptionId: string,
  dependsOnOptionId: string,
  price: number,
  isActive = true,
) {
  return {
    id: `price-${modifierOptionId}-${dependsOnOptionId}`,
    modifierOptionId,
    dependsOnOptionId,
    price,
    isActive,
  };
}

function selected(
  groupCode: string,
  optionId: string,
  dependsOnOptionId?: string,
) {
  return {
    groupCode,
    optionId,
    dependsOnOptionId,
  };
}
