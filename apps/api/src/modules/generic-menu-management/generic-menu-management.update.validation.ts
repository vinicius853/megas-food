import { PriceEngineService } from '../price-engine/price-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicMenuV2Service } from '../../public-menu-v2/public-menu-v2.service';

import { UpdateGenericMenuDto } from './dto/update-generic-menu.dto';
import { GenericMenuManagementService } from './generic-menu-management.service';
import { GenericMenuManagementResponse } from './generic-menu-management.types';
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

  let baselinePayload: UpdateGenericMenuDto | null = null;
  let tenantId = '';

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_SLUG },
      select: { id: true },
    });

    if (!tenant) throw new Error(`Tenant nao encontrado: ${TENANT_SLUG}.`);
    tenantId = tenant.id;

    const validator = new GenericMenuManagementValidator(prisma);
    const writer = new GenericMenuManagementWriter();
    const service = new GenericMenuManagementService(prisma, validator, writer);
    const priceEngine = new PriceEngineService(prisma);
    const accessService = {
      evaluateTenantAccess: async () => ({
        status: 'ACTIVE',
        canAcceptOrders: true,
        canAccessDashboard: true,
        accessUntil: null,
        nextBillingDate: null,
        message: null,
      }),
    };
    const publicMenu = new PublicMenuV2Service(
      prisma,
      priceEngine,
      accessService as unknown as ConstructorParameters<
        typeof PublicMenuV2Service
      >[2],
    );
    const baselineMenu = await service.findOne(tenantId);
    baselinePayload = toUpdatePayload(baselineMenu);
    const countsBefore = await genericCounts(prisma, tenantId);

    await expectRejected(
      service,
      tenantId,
      withInvalidProductId(baselinePayload),
      'outro tenant',
    );
    await expectRejected(
      service,
      tenantId,
      withInvalidDependsOn(baselinePayload),
      'dependsOnOptionId invalido',
    );
    await expectRejected(
      service,
      tenantId,
      withInvalidTargetGroup(baselinePayload),
      'targetGroupId invalido',
    );

    await service.update(tenantId, clone(baselinePayload));
    const countsAfterFirstNoop = await genericCounts(prisma, tenantId);
    await service.update(tenantId, clone(baselinePayload));
    const countsAfterSecondNoop = await genericCounts(prisma, tenantId);

    const modified = clone(baselinePayload);
    const scenario = modifyScenario(modified, baselineMenu);
    await service.update(tenantId, modified);

    const updatedMenu = await service.findOne(tenantId);
    const updatedChecks = validateUpdatedMenu(updatedMenu, scenario);
    const priceResult = await priceEngine.calculate({
      tenantId,
      productId: scenario.productId,
      quantity: 1,
      selectedModifiers: [
        {
          groupCode: 'pizza_size',
          optionId: scenario.size30Id,
        },
        {
          groupCode: 'pizza_flavor',
          optionId: scenario.flavorId,
          dependsOnOptionId: scenario.size30Id,
        },
      ],
    });
    const publicMenuResult = await publicMenu.findBySlug(TENANT_SLUG);
    const publicChecks = validatePublicMenu(publicMenuResult, scenario);

    const reactivated = clone(modified);
    findOptionById(reactivated, scenario.inactiveOptionId).isActive = true;
    await service.update(tenantId, reactivated);
    const reactivatedMenu = await service.findOne(tenantId);
    const reactivatedOption = findAdminOptionById(
      reactivatedMenu,
      scenario.inactiveOptionId,
    );

    await service.update(tenantId, clone(baselinePayload));
    const restoredMenu = await service.findOne(tenantId);
    const countsAfterRestore = await genericCounts(prisma, tenantId);
    const result = {
      database: currentDatabaseName(),
      invalidReferencesRejected: true,
      idempotent:
        equal(countsBefore, countsAfterFirstNoop) &&
        equal(countsAfterFirstNoop, countsAfterSecondNoop),
      countsBefore,
      countsAfterFirstNoop,
      countsAfterSecondNoop,
      updatedChecks,
      reactivated: reactivatedOption.isActive,
      priceEngine: {
        expectedUnitPrice: scenario.updatedPrice,
        unitPrice: priceResult.unitPrice,
        errors: priceResult.validationErrors,
        passed:
          priceResult.unitPrice === scenario.updatedPrice &&
          priceResult.validationErrors.length === 0,
      },
      publicMenu: publicChecks,
      restored:
        equal(toUpdatePayload(restoredMenu), baselinePayload) &&
        equal(countsAfterRestore, countsBefore),
    };

    console.log(JSON.stringify(result, null, 2));

    if (
      !result.idempotent ||
      !Object.values(updatedChecks).every(Boolean) ||
      !result.reactivated ||
      !result.priceEngine.passed ||
      !Object.values(publicChecks).every(Boolean) ||
      !result.restored
    ) {
      process.exitCode = 1;
    }
  } finally {
    if (baselinePayload && tenantId) {
      const service = new GenericMenuManagementService(
        prisma,
        new GenericMenuManagementValidator(prisma),
        new GenericMenuManagementWriter(),
      );
      await service.update(tenantId, clone(baselinePayload));
    }

    await prisma.$disconnect();
  }
}

function toUpdatePayload(
  menu: GenericMenuManagementResponse,
): UpdateGenericMenuDto {
  return {
    categories: menu.categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      type: category.type,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    })),
    products: menu.products.map((product) => ({
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description ?? undefined,
      imageUrl: product.imageUrl ?? undefined,
      type: product.type,
      pricingMode: product.pricingMode,
      basePrice: product.basePrice ?? undefined,
      price: product.price ?? undefined,
      isActive: product.isActive,
      sortOrder: product.sortOrder,
      modifierGroups: product.modifierGroups.map((group) => ({
        productModifierGroupId: group.productModifierGroupId,
        modifierGroupId: group.id,
        code: group.code,
        name: group.name,
        selectionType: group.selectionType,
        pricingMode: group.pricingMode,
        isRequired: group.isRequired,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        sortOrder: group.sortOrder,
        isActive: group.isActive,
        options: group.options.map((option) => ({
          productModifierOptionId: option.productModifierOptionId,
          modifierOptionId: option.id,
          code: option.code ?? undefined,
          name: option.name,
          description: option.description ?? undefined,
          imageUrl: option.imageUrl ?? undefined,
          displayCategoryId: option.displayCategoryId ?? undefined,
          priceDelta: option.priceDelta,
          sortOrder: option.sortOrder,
          isActive: option.isActive,
          prices: option.prices.map((price) => ({
            id: price.id,
            dependsOnOptionId: price.dependsOnOptionId ?? undefined,
            price: price.price,
          })),
          rules: option.rules.map((rule) => ({
            id: rule.id,
            targetGroupId: rule.targetGroupId,
            isEnabled: rule.isEnabled,
            minSelections: rule.minSelections ?? undefined,
            maxSelections: rule.maxSelections ?? undefined,
            metadata: isObject(rule.metadata) ? rule.metadata : undefined,
          })),
        })),
      })),
    })),
  };
}

function modifyScenario(
  payload: UpdateGenericMenuDto,
  baseline: GenericMenuManagementResponse,
) {
  const pizza = baseline.products.find((product) =>
    product.modifierGroups.some((group) => group.code === 'pizza_size'),
  );
  if (!pizza) throw new Error('Pizza generica nao encontrada.');

  const product = payload.products.find((item) => item.id === pizza.id)!;
  const sizeGroup = groupByCode(product, 'pizza_size');
  const flavorGroup = groupByCode(product, 'pizza_flavor');
  const size30 = optionByName(sizeGroup, '30cm');
  const size20 = optionByName(sizeGroup, '20cm');
  const flavor = optionByName(flavorGroup, 'calabresa');
  const sweetFlavor = optionByName(flavorGroup, 'brigadeiro');
  const inactiveOption =
    flavorGroup.options.find(
      (option) => option.modifierOptionId !== flavor.modifierOptionId,
    ) ?? sweetFlavor;
  const flavorPrice = flavor.prices.find(
    (price) => price.dependsOnOptionId === size30.modifierOptionId,
  );
  const flavorRule = size30.rules.find(
    (rule) => rule.targetGroupId === flavorGroup.modifierGroupId,
  );
  const borderGroup = groupByCode(product, 'pizza_border');
  const borderRule = size20.rules.find(
    (rule) => rule.targetGroupId === borderGroup.modifierGroupId,
  );
  const alternateCategory = baseline.categories.find(
    (category) => category.id !== sweetFlavor.displayCategoryId,
  );

  if (!flavorPrice || !flavorRule || !borderRule || !alternateCategory) {
    throw new Error('Dados insuficientes para o cenario de update.');
  }

  flavor.name = `${flavor.name.trim()} Fase 5.7`;
  flavorPrice.price += 1;
  flavorRule.maxSelections = Math.max(1, (flavorRule.maxSelections ?? 2) - 1);
  borderRule.isEnabled = true;
  borderRule.maxSelections = 1;
  sweetFlavor.displayCategoryId = alternateCategory.id;
  inactiveOption.isActive = false;

  return {
    productId: product.id!,
    size30Id: size30.modifierOptionId!,
    flavorId: flavor.modifierOptionId!,
    renamedFlavor: flavor.name,
    updatedPrice: flavorPrice.price,
    flavorRuleMax: flavorRule.maxSelections,
    size20Id: size20.modifierOptionId!,
    alternateCategoryId: alternateCategory.id,
    sweetFlavorId: sweetFlavor.modifierOptionId!,
    inactiveOptionId: inactiveOption.modifierOptionId!,
  };
}

function validateUpdatedMenu(
  menu: GenericMenuManagementResponse,
  scenario: ReturnType<typeof modifyScenario>,
) {
  const flavor = findAdminOptionById(menu, scenario.flavorId);
  const size30 = findAdminOptionById(menu, scenario.size30Id);
  const size20 = findAdminOptionById(menu, scenario.size20Id);
  const sweetFlavor = findAdminOptionById(menu, scenario.sweetFlavorId);
  const inactive = findAdminOptionById(menu, scenario.inactiveOptionId);

  return {
    optionName: flavor.name === scenario.renamedFlavor,
    contextualPrice: flavor.prices.some(
      (price) =>
        price.dependsOnOptionId === scenario.size30Id &&
        price.price === scenario.updatedPrice,
    ),
    maxSelections: size30.rules.some(
      (rule) =>
        rule.targetGroupCode === 'pizza_flavor' &&
        rule.maxSelections === scenario.flavorRuleMax,
    ),
    allowBorder: size20.rules.some(
      (rule) =>
        rule.targetGroupCode === 'pizza_border' &&
        rule.isEnabled &&
        rule.maxSelections === 1,
    ),
    displayCategory:
      sweetFlavor.displayCategoryId === scenario.alternateCategoryId,
    inactive: inactive.isActive === false,
  };
}

function validatePublicMenu(
  menu: Awaited<ReturnType<PublicMenuV2Service['findBySlug']>>,
  scenario: ReturnType<typeof modifyScenario>,
) {
  const options = menu.categories
    .flatMap((category) => category.products)
    .flatMap((product) => product.modifierGroups)
    .flatMap((group) => group.options);
  const flavor = options.find((option) => option.id === scenario.flavorId);
  const size30 = options.find((option) => option.id === scenario.size30Id);
  const size20 = options.find((option) => option.id === scenario.size20Id);
  const sweetFlavor = options.find(
    (option) => option.id === scenario.sweetFlavorId,
  );
  const inactive = options.find(
    (option) => option.id === scenario.inactiveOptionId,
  );

  return {
    renamedOption: flavor?.name === scenario.renamedFlavor,
    contextualPrice:
      flavor?.prices.some(
        (price) =>
          price.dependsOnOptionId === scenario.size30Id &&
          price.price === scenario.updatedPrice,
      ) ?? false,
    maxFlavors:
      size30?.rules.find((rule) => rule.targetGroupCode === 'pizza_flavor')
        ?.maxSelections === scenario.flavorRuleMax,
    allowBorder:
      size20?.rules.find((rule) => rule.targetGroupCode === 'pizza_border')
        ?.isEnabled === true,
    displayCategory: sweetFlavor?.category?.id === scenario.alternateCategoryId,
    inactiveHidden: inactive === undefined,
  };
}

async function expectRejected(
  service: GenericMenuManagementService,
  tenantId: string,
  payload: UpdateGenericMenuDto,
  label: string,
) {
  try {
    await service.update(tenantId, payload);
  } catch {
    return;
  }

  throw new Error(`Validacao nao rejeitou ${label}.`);
}

function withInvalidProductId(payload: UpdateGenericMenuDto) {
  const invalid = clone(payload);
  invalid.products[0].id = 'product-from-another-tenant';
  return invalid;
}

function withInvalidDependsOn(payload: UpdateGenericMenuDto) {
  const invalid = clone(payload);
  const option = invalid.products
    .flatMap((product) => product.modifierGroups)
    .flatMap((group) => group.options)
    .find((item) => item.prices.length > 0);
  if (!option) throw new Error('Opcao com preco nao encontrada.');
  option.prices[0].dependsOnOptionId = 'invalid-dependency';
  return invalid;
}

function withInvalidTargetGroup(payload: UpdateGenericMenuDto) {
  const invalid = clone(payload);
  const option = invalid.products
    .flatMap((product) => product.modifierGroups)
    .flatMap((group) => group.options)
    .find((item) => item.rules.length > 0);
  if (!option) throw new Error('Opcao com regra nao encontrada.');
  option.rules[0].targetGroupId = 'invalid-target-group';
  return invalid;
}

function groupByCode(
  product: UpdateGenericMenuDto['products'][number],
  code: string,
) {
  const group = product.modifierGroups.find((item) => item.code === code);
  if (!group) throw new Error(`Grupo nao encontrado: ${code}.`);
  return group;
}

function optionByName(
  group: UpdateGenericMenuDto['products'][number]['modifierGroups'][number],
  name: string,
) {
  const option = group.options.find(
    (item) => item.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (!option) throw new Error(`Opcao nao encontrada: ${name}.`);
  return option;
}

function findOptionById(payload: UpdateGenericMenuDto, optionId: string) {
  const option = payload.products
    .flatMap((product) => product.modifierGroups)
    .flatMap((group) => group.options)
    .find((item) => item.modifierOptionId === optionId);
  if (!option) throw new Error(`Opcao nao encontrada: ${optionId}.`);
  return option;
}

function findAdminOptionById(
  menu: GenericMenuManagementResponse,
  optionId: string,
) {
  const option = menu.products
    .flatMap((product) => product.modifierGroups)
    .flatMap((group) => group.options)
    .find((item) => item.id === optionId);
  if (!option) throw new Error(`Opcao admin nao encontrada: ${optionId}.`);
  return option;
}

async function genericCounts(prisma: PrismaService, tenantId: string) {
  const where = { tenantId };
  const [
    products,
    groups,
    options,
    productGroups,
    productOptions,
    prices,
    rules,
  ] = await Promise.all([
    prisma.product.count({ where }),
    prisma.modifierGroup.count({ where }),
    prisma.modifierOption.count({ where }),
    prisma.productModifierGroup.count({ where }),
    prisma.productModifierOption.count({ where }),
    prisma.modifierOptionPrice.count({ where }),
    prisma.productModifierOptionRule.count({ where }),
  ]);

  return {
    products,
    groups,
    options,
    productGroups,
    productOptions,
    prices,
    rules,
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function equal(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertAllowedDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL nao informada.');

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');
  if (!ALLOWED_DATABASES.has(databaseName)) {
    throw new Error(`Validacao bloqueada para ${databaseName}.`);
  }
}

function currentDatabaseName() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL nao informada.');
  return new URL(databaseUrl).pathname.replace(/^\//, '');
}

void main();
