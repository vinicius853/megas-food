import { PriceEngineService } from '../modules/price-engine/price-engine.service';
import { PrismaService } from '../prisma/prisma.service';

import { PublicMenuV2Service } from './public-menu-v2.service';

const ALLOWED_DATABASES = new Set([
  'pizzaria_saas_phase24_copy2_20260603',
  'pizzaria_saas_phase_legacy_drop_test_20260606',
]);
const TENANT_SLUG = 'megas-tech-food';

async function main() {
  assertAllowedDatabase();

  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const service = new PublicMenuV2Service(
      prisma,
      new PriceEngineService(prisma),
      {
        evaluateTenantAccess: async () => ({
          status: 'ACTIVE',
          canAcceptOrders: true,
          canAccessDashboard: true,
          accessUntil: null,
          nextBillingDate: null,
          message: null,
        }),
      } as never,
    );
    const menu = await service.findBySlug(TENANT_SLUG);
    const products = menu.categories.flatMap((category) => category.products);
    const pizza = products.find((product) =>
      product.modifierGroups.some((group) => group.code === 'pizza_size'),
    );

    if (!pizza) {
      throw new Error('Produto com grupo pizza_size nao encontrado.');
    }

    const sizeGroup = pizza.modifierGroups.find(
      (group) => group.code === 'pizza_size',
    );
    const flavorGroup = pizza.modifierGroups.find(
      (group) => group.code === 'pizza_flavor',
    );
    const borderGroup = pizza.modifierGroups.find(
      (group) => group.code === 'pizza_border',
    );
    const expectedSizes = new Map([
      ['20cm', { maxFlavors: 1, allowBorder: false }],
      ['30cm', { maxFlavors: 2, allowBorder: true }],
      ['35cm', { maxFlavors: 2, allowBorder: true }],
      ['40cm', { maxFlavors: 3, allowBorder: true }],
    ]);
    const divergences: string[] = [];

    for (const [sizeName, expected] of expectedSizes) {
      const size = sizeGroup?.options.find(
        (option) => option.name === sizeName,
      );

      if (
        !size ||
        size.rules.find((rule) => rule.targetGroupId === flavorGroup?.id)
          ?.maxSelections !== expected.maxFlavors ||
        Boolean(
          size.rules.find((rule) => rule.targetGroupId === borderGroup?.id)
            ?.isEnabled,
        ) !== expected.allowBorder
      ) {
        divergences.push(`Regra divergente para ${sizeName}.`);
      }
    }

    const sweetFlavors =
      flavorGroup?.options.filter(
        (option) => option.category?.name.toLowerCase() === 'doces',
      ) ?? [];
    const additionalCategory = menu.categories.find(
      (category) => category.name.toLowerCase() === 'adicionais',
    );

    if (sweetFlavors.length === 0) {
      divergences.push('Nenhum sabor doce retornado.');
    }

    if (!additionalCategory || additionalCategory.products.length === 0) {
      divergences.push('Categoria Adicionais sem produtos ativos.');
    }

    const result = {
      database: currentDatabaseName(),
      tenant: menu.tenant.slug,
      sizes: sizeGroup?.options.map((option) => ({
        name: option.name,
        rules: option.rules,
      })),
      sweetFlavors: sweetFlavors.map((option) => ({
        name: option.name,
        displayCategoryId: option.category?.id,
        category: option.category?.name,
      })),
      additionalProducts:
        additionalCategory?.products.map((product) => product.name) ?? [],
      divergences,
    };

    console.log(JSON.stringify(result, null, 2));

    if (divergences.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

function assertAllowedDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL nao informada.');
  }

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');

  if (!ALLOWED_DATABASES.has(databaseName)) {
    throw new Error(`Validacao bloqueada para o banco ${databaseName}.`);
  }
}

function currentDatabaseName() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL nao informada.');
  return new URL(databaseUrl).pathname.replace(/^\//, '');
}

void main();
