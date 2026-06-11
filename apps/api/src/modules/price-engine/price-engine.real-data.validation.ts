import { PrismaService } from '../../prisma/prisma.service';

import { PriceEngineService } from './price-engine.service';

type RealScenario = {
  name: string;
  selected: Array<{
    groupCode: string;
    optionName?: string;
    optionId?: string;
    dependsOnName?: string;
    quantity?: number;
    fraction?: number;
  }>;
  quantity: number;
  expectedUnitPrice?: number;
  expectedTotalPrice?: number;
  expectedErrors?: string[];
};

type ScenarioResult = {
  name: string;
  expectedUnitPrice: number | null;
  calculatedUnitPrice: number;
  calculatedTotalPrice: number;
  expectedErrors: string[];
  actualErrors: string[];
  passed: boolean;
};

const productName = 'Pizza redonda';

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const engine = new PriceEngineService(prisma);
    const context = await loadContext(prisma);
    const scenarios = buildScenarios();
    const results: ScenarioResult[] = [];

    for (const scenario of scenarios) {
      const selectedModifiers = scenario.selected.map((selected) => {
        const optionId =
          selected.optionId ??
          resolveOptionId(
            context.optionIds,
            selected.groupCode,
            selected.optionName!,
          );

        const dependsOnOptionId = selected.dependsOnName
          ? resolveOptionId(
              context.optionIds,
              'pizza_size',
              selected.dependsOnName,
            )
          : undefined;

        return {
          groupCode: selected.groupCode,
          optionId,
          dependsOnOptionId,
          quantity: selected.quantity,
          fraction: selected.fraction,
        };
      });

      const result = await engine.calculate({
        tenantId: context.tenantId,
        productId: context.productId,
        quantity: scenario.quantity,
        selectedModifiers,
      });

      const actualErrors = result.validationErrors.map((error) => error.code);
      const expectedErrors = scenario.expectedErrors ?? [];
      const priceMatches =
        scenario.expectedUnitPrice === undefined ||
        result.unitPrice === scenario.expectedUnitPrice;
      const totalMatches =
        scenario.expectedTotalPrice === undefined ||
        result.totalPrice === scenario.expectedTotalPrice;
      const errorsMatch =
        actualErrors.length === expectedErrors.length &&
        expectedErrors.every((code) => actualErrors.includes(code));

      results.push({
        name: scenario.name,
        expectedUnitPrice: scenario.expectedUnitPrice ?? null,
        calculatedUnitPrice: result.unitPrice,
        calculatedTotalPrice: result.totalPrice,
        expectedErrors,
        actualErrors,
        passed: priceMatches && totalMatches && errorsMatch,
      });
    }

    const failed = results.filter((result) => !result.passed);

    console.table(results);

    if (failed.length > 0) {
      console.error('PriceEngine real-data validation failed.');
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function loadContext(prisma: PrismaService) {
  const product = await prisma.product.findFirst({
    where: {
      name: productName,
    },
  });

  if (!product) {
    throw new Error(`Product not found: ${productName}`);
  }

  const options = await prisma.modifierOption.findMany({
    where: {
      tenantId: product.tenantId,
      group: {
        code: {
          in: ['pizza_size', 'pizza_flavor', 'pizza_border'],
        },
      },
    },
    include: {
      group: true,
    },
  });

  return {
    tenantId: product.tenantId,
    productId: product.id,
    optionIds: new Map(
      options.map((option) => [
        optionKey(option.group.code, option.name),
        option.id,
      ]),
    ),
  };
}

function buildScenarios(): RealScenario[] {
  return [
    {
      name: 'Pizza Redonda 30cm + 1 sabor',
      quantity: 1,
      expectedUnitPrice: 45,
      expectedTotalPrice: 45,
      selected: [
        option('pizza_size', '30cm'),
        option('pizza_flavor', 'calabresa', '30cm'),
      ],
    },
    {
      name: 'Pizza Redonda 30cm + 2 sabores maior preco',
      quantity: 1,
      expectedUnitPrice: 45,
      expectedTotalPrice: 45,
      selected: [
        option('pizza_size', '30cm'),
        option('pizza_flavor', 'calabresa', '30cm', 0.5),
        option('pizza_flavor', 'mussarela', '30cm', 0.5),
      ],
    },
    {
      name: 'Pizza Redonda 40cm + 3 sabores maior preco',
      quantity: 1,
      expectedUnitPrice: 67,
      expectedTotalPrice: 67,
      selected: [
        option('pizza_size', '40cm'),
        option('pizza_flavor', 'queijo e presunto', '40cm'),
        option('pizza_flavor', 'Peperone', '40cm'),
        option('pizza_flavor', 'brigadeiro', '40cm'),
      ],
    },
    {
      name: 'Pizza Redonda 30cm + borda catupiry',
      quantity: 1,
      expectedUnitPrice: 55,
      expectedTotalPrice: 55,
      selected: [
        option('pizza_size', '30cm'),
        option('pizza_flavor', 'calabresa', '30cm'),
        option('pizza_border', 'catupiry', '30cm'),
      ],
    },
    {
      name: 'Pizza Redonda 20cm tentando borda',
      quantity: 1,
      expectedUnitPrice: 25,
      expectedTotalPrice: 25,
      expectedErrors: ['CONTEXTUAL_PRICE_NOT_FOUND'],
      selected: [
        option('pizza_size', '20cm'),
        option('pizza_flavor', 'calabresa', '20cm'),
        option('pizza_border', 'catupiry', '20cm'),
      ],
    },
    {
      name: 'Pizza Redonda 30cm quantidade 2',
      quantity: 2,
      expectedUnitPrice: 45,
      expectedTotalPrice: 90,
      selected: [
        option('pizza_size', '30cm'),
        option('pizza_flavor', 'calabresa', '30cm'),
      ],
    },
    {
      name: 'Opcao nao permitida',
      quantity: 1,
      expectedErrors: [
        'OPTION_NOT_ALLOWED',
        'REQUIRED_GROUP_MISSING',
        'MIN_SELECTIONS_NOT_REACHED',
      ],
      selected: [
        option('pizza_size', '30cm'),
        {
          groupCode: 'pizza_flavor',
          optionId: 'not-allowed-option',
          dependsOnName: '30cm',
        },
      ],
    },
    {
      name: 'Grupo obrigatorio ausente',
      quantity: 1,
      expectedErrors: ['REQUIRED_GROUP_MISSING', 'MIN_SELECTIONS_NOT_REACHED'],
      selected: [option('pizza_flavor', 'calabresa', '30cm')],
    },
  ];
}

function option(
  groupCode: string,
  optionName: string,
  dependsOnName?: string,
  fraction?: number,
) {
  return {
    groupCode,
    optionName,
    dependsOnName,
    fraction,
  };
}

function optionKey(groupCode: string, optionName: string) {
  return `${groupCode}:${optionName.trim()}`;
}

function resolveOptionId(
  optionIds: Map<string, string>,
  groupCode: string,
  optionName: string,
) {
  const optionId = optionIds.get(optionKey(groupCode, optionName));

  if (!optionId) {
    throw new Error(
      `Modifier option not found: ${groupCode}/${optionName}. Loaded: ${[
        ...optionIds.keys(),
      ].join(', ')}`,
    );
  }

  return optionId;
}

void main();
