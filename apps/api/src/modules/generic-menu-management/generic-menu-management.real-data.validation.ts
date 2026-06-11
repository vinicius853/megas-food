import { PrismaService } from '../../prisma/prisma.service';

import { GenericMenuManagementService } from './generic-menu-management.service';
import { GenericMenuManagementValidator } from './generic-menu-management.validator';
import { GenericMenuManagementWriter } from './generic-menu-management.writer';

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
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: TENANT_SLUG,
      },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      throw new Error(`Tenant nao encontrado: ${TENANT_SLUG}.`);
    }

    const service = new GenericMenuManagementService(
      prisma,
      new GenericMenuManagementValidator(prisma),
      new GenericMenuManagementWriter(),
    );
    const menu = await service.findOne(tenant.id);
    const pizza = menu.products.find((product) =>
      product.modifierGroups.some((group) => group.code === 'pizza_size'),
    );

    if (!pizza) {
      throw new Error('Produto com grupo pizza_size nao encontrado.');
    }

    const groups = new Map(
      pizza.modifierGroups.map((group) => [group.code, group]),
    );
    const sizeGroup = groups.get('pizza_size');
    const flavorGroup = groups.get('pizza_flavor');
    const borderGroup = groups.get('pizza_border');
    const options = pizza.modifierGroups.flatMap((group) => group.options);
    const divergences: string[] = [];

    if (pizza.modifierGroups.length !== 3) {
      divergences.push(
        `Esperados 3 grupos; encontrados ${pizza.modifierGroups.length}.`,
      );
    }
    if (options.length !== 13) {
      divergences.push(`Esperadas 13 opcoes; encontradas ${options.length}.`);
    }
    if (flavorGroup?.options.length !== 7) {
      divergences.push(
        `Esperados 7 sabores; encontrados ${flavorGroup?.options.length ?? 0}.`,
      );
    }
    if (sizeGroup?.options.length !== 4) {
      divergences.push(
        `Esperados 4 tamanhos; encontrados ${sizeGroup?.options.length ?? 0}.`,
      );
    }
    if (borderGroup?.options.length !== 2) {
      divergences.push(
        `Esperadas 2 bordas; encontradas ${borderGroup?.options.length ?? 0}.`,
      );
    }

    const prices = options.flatMap((option) => option.prices);
    const rules = options.flatMap((option) => option.rules);
    const categorizedFlavors =
      flavorGroup?.options.filter((option) => option.displayCategoryId) ?? [];

    if (prices.length !== 34) {
      divergences.push(`Esperados 34 precos; encontrados ${prices.length}.`);
    }
    if (rules.length !== 8) {
      divergences.push(`Esperadas 8 regras; encontradas ${rules.length}.`);
    }
    if (categorizedFlavors.length !== 7) {
      divergences.push(
        `Esperados 7 sabores categorizados; encontrados ${categorizedFlavors.length}.`,
      );
    }

    const result = {
      database: currentDatabaseName(),
      tenant: TENANT_SLUG,
      categories: menu.categories.length,
      products: menu.products.length,
      pizza: {
        id: pizza.id,
        name: pizza.name,
        groups: pizza.modifierGroups.map((group) => ({
          code: group.code,
          options: group.options.length,
        })),
        contextualPrices: prices.length,
        rules: rules.length,
        categorizedFlavors: categorizedFlavors.length,
      },
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
