import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PriceEngineService } from '../modules/price-engine/price-engine.service';
import { SubscriptionAccessService } from '../modules/billing/subscription-access.service';
import { resolvePublicStoreName } from '../modules/tenants/public-store-name';

import {
  PublicMenuV2Category,
  PublicMenuV2ModifierGroup,
  PublicMenuV2Option,
  PublicMenuV2PriceRequest,
  PublicMenuV2Response,
} from './public-menu-v2.types';

@Injectable()
export class PublicMenuV2Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceEngineService: PriceEngineService,
    private readonly subscriptionAccessService: SubscriptionAccessService,
  ) {}

  async findBySlug(slug: string): Promise<PublicMenuV2Response> {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsapp: true,
        logoUrl: true,
        settings: true,
        isActive: true,
      },
    });

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Cardapio nao encontrado.');
    }

    const subscriptionAccess =
      await this.subscriptionAccessService.evaluateTenantAccess(tenant.id);

    const categories = await this.prisma.category.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    const products = await this.prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    const productIds = products.map((product) => product.id);

    const [productGroups, productOptions, optionPrices, optionRules] =
      productIds.length > 0
        ? await Promise.all([
            this.prisma.productModifierGroup.findMany({
              where: {
                tenantId: tenant.id,
                productId: {
                  in: productIds,
                },
              },
              include: {
                modifierGroup: true,
              },
              orderBy: [
                {
                  sortOrder: 'asc',
                },
                {
                  modifierGroup: {
                    sortOrder: 'asc',
                  },
                },
              ],
            }),
            this.prisma.productModifierOption.findMany({
              where: {
                tenantId: tenant.id,
                productId: {
                  in: productIds,
                },
                isActive: true,
                modifierOption: {
                  isActive: true,
                },
              },
              include: {
                modifierOption: true,
              },
              orderBy: [
                {
                  sortOrder: 'asc',
                },
                {
                  modifierOption: {
                    sortOrder: 'asc',
                  },
                },
              ],
            }),
            this.prisma.modifierOptionPrice.findMany({
              where: {
                tenantId: tenant.id,
                productId: {
                  in: productIds,
                },
                isActive: true,
              },
            }),
            this.prisma.productModifierOptionRule.findMany({
              where: {
                tenantId: tenant.id,
                productId: {
                  in: productIds,
                },
              },
              include: {
                targetGroup: {
                  select: {
                    code: true,
                  },
                },
              },
            }),
          ])
        : [[], [], [], []];

    const productGroupsByProduct = groupBy(productGroups, 'productId');
    const productOptionsByProductGroup = groupByComposite(
      productOptions,
      (option) => option.productId,
      (option) => option.modifierGroupId,
    );
    const pricesByProductOption = groupByComposite(
      optionPrices,
      (price) => price.productId,
      (price) => price.modifierOptionId,
    );
    const rulesByProductSourceOption = groupByComposite(
      optionRules,
      (rule) => rule.productId,
      (rule) => rule.sourceOptionId,
    );
    const sortedCategories = [...categories].sort(bySortOrder);
    const categoriesById = new Map(
      sortedCategories.map((category) => [category.id, category]),
    );
    const sortedProducts = [...products].sort(bySortOrder);
    const productsByCategory = groupBy(sortedProducts, 'categoryId');

    const responseCategories = sortedCategories
      .map((category): PublicMenuV2Category => {
        const categoryProducts = productsByCategory.get(category.id) ?? [];

        return {
          id: category.id,
          name: cleanName(category.name),
          slug: category.slug,
          type: category.type,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          products: categoryProducts.map((product) => ({
            id: product.id,
            name: cleanName(product.name),
            description: product.description,
            imageUrl: product.imageUrl,
            type: product.type,
            pricingMode: product.pricingMode,
            basePrice:
              product.basePrice === null ? null : Number(product.basePrice),
            price: product.price === null ? null : Number(product.price),
            sortOrder: product.sortOrder,
            modifierGroups: buildModifierGroups(
              product.id,
              productGroupsByProduct.get(product.id) ?? [],
              productOptionsByProductGroup,
              pricesByProductOption,
              rulesByProductSourceOption,
              categoriesById,
            ),
          })),
        };
      })
      .filter((category) => category.products.length > 0);

    return {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: cleanName(tenant.name),
        whatsapp: tenant.whatsapp,
        logoUrl: tenant.logoUrl,
      },
      customization: buildCustomization(tenant),
      delivery: buildDelivery(tenant),
      subscription: {
        status: subscriptionAccess.status,
        canAcceptOrders: subscriptionAccess.canAcceptOrders,
        canAccessDashboard: subscriptionAccess.canAccessDashboard,
        accessUntil: subscriptionAccess.accessUntil,
        nextBillingDate: subscriptionAccess.nextBillingDate,
        message: subscriptionAccess.message,
      },
      categories: responseCategories,
    };
  }

  async calculatePriceBySlug(slug: string, request: PublicMenuV2PriceRequest) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Cardapio nao encontrado.');
    }

    return this.priceEngineService.calculate({
      tenantId: tenant.id,
      productId: request.productId,
      quantity: request.quantity ?? 1,
      selectedModifiers: request.selectedModifiers ?? [],
    });
  }
}

function buildModifierGroups(
  productId: string,
  productGroups: Array<any>,
  productOptionsByProductGroup: Map<string, Array<any>>,
  pricesByProductOption: Map<string, Array<any>>,
  rulesByProductSourceOption: Map<string, Array<any>>,
  categoriesById: Map<string, any>,
): PublicMenuV2ModifierGroup[] {
  return [...productGroups].sort(bySortOrder).map((productGroup) => {
    const group = productGroup.modifierGroup;
    const options = [
      ...(productOptionsByProductGroup.get(compositeKey(productId, group.id)) ??
        []),
    ].sort(bySortOrder);

    return {
      id: group.id,
      code: group.code,
      name: cleanName(group.name),
      description: group.description,
      selectionType: group.selectionType,
      pricingMode: group.pricingMode,
      isRequired: productGroup.isRequiredOverride ?? group.isRequired,
      minSelections: productGroup.minSelectionsOverride ?? group.minSelections,
      maxSelections: productGroup.maxSelectionsOverride ?? group.maxSelections,
      sortOrder: productGroup.sortOrder,
      options: options.map((productOption): PublicMenuV2Option => {
        const option = productOption.modifierOption;
        const prices = [
          ...(pricesByProductOption.get(compositeKey(productId, option.id)) ??
            []),
        ].sort((left, right) =>
          String(left.dependsOnOptionId ?? '').localeCompare(
            String(right.dependsOnOptionId ?? ''),
          ),
        );
        const rules = [
          ...(rulesByProductSourceOption.get(
            compositeKey(productId, option.id),
          ) ?? []),
        ].sort((left, right) =>
          left.targetGroup.code.localeCompare(right.targetGroup.code),
        );
        const displayCategory = productOption.displayCategoryId
          ? categoriesById.get(productOption.displayCategoryId)
          : null;

        return {
          id: option.id,
          code: option.code,
          name: cleanName(option.name),
          description: option.description,
          imageUrl: option.imageUrl,
          category: displayCategory
            ? {
                id: displayCategory.id,
                name: cleanName(displayCategory.name),
                sortOrder: displayCategory.sortOrder,
              }
            : null,
          rules: rules.map((rule) => ({
            id: rule.id,
            targetGroupId: rule.targetGroupId,
            targetGroupCode: rule.targetGroup.code,
            isEnabled: rule.isEnabled,
            minSelections: rule.minSelections,
            maxSelections: rule.maxSelections,
            metadata: rule.metadata,
          })),
          priceDelta: Number(
            productOption.priceDeltaOverride ?? option.priceDelta ?? 0,
          ),
          sortOrder: productOption.sortOrder,
          isActive: productOption.isActive && option.isActive,
          prices: prices.map((price) => ({
            id: price.id,
            dependsOnOptionId: price.dependsOnOptionId,
            price: Number(price.price),
            isActive: price.isActive !== false,
          })),
        };
      }),
    };
  });
}

function groupBy<T extends Record<string, any>>(items: T[], key: keyof T) {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const mapKey = String(item[key]);
    const list = map.get(mapKey) ?? [];
    list.push(item);
    map.set(mapKey, list);
  }

  return map;
}

function groupByComposite<T>(
  items: T[],
  firstKey: (item: T) => string,
  secondKey: (item: T) => string,
) {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const key = compositeKey(firstKey(item), secondKey(item));
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }

  return map;
}

function compositeKey(first: string, second: string) {
  return `${first}:${second}`;
}

function cleanName(value: string) {
  return value.trim();
}

function bySortOrder<T extends { sortOrder: number }>(left: T, right: T) {
  return left.sortOrder - right.sortOrder;
}

function normalizeCoverPosition(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, value));
}

function buildCustomization(tenant: {
  name: string;
  logoUrl: string | null;
  settings?: unknown;
}) {
  const settings = getSettings(tenant.settings);
  const customization = getObjectSetting(settings.customization);

  return {
    logoUrl: String(customization.logoUrl ?? tenant.logoUrl ?? ''),
    coverUrl: String(customization.coverUrl ?? ''),
    coverPositionX: normalizeCoverPosition(customization.coverPositionX),
    coverPositionY: normalizeCoverPosition(customization.coverPositionY),
    paletteId: String(customization.paletteId ?? 'classic-pizza'),
    brandName: resolvePublicStoreName(tenant),
    tagline: String(customization.tagline ?? 'Cardapio digital'),
  };
}

function buildDelivery(tenant: {
  whatsapp: string | null;
  settings?: unknown;
}) {
  const settings = getSettings(tenant.settings);
  const delivery = getObjectSetting(settings.delivery);

  return {
    isDeliveryOpen:
      typeof delivery.isDeliveryOpen === 'boolean'
        ? delivery.isDeliveryOpen
        : true,
    city: String(delivery.city ?? ''),
    state: String(delivery.state ?? ''),
    storeCep: String(delivery.storeCep ?? ''),
    storeAddress: String(delivery.storeAddress ?? ''),
    whatsapp: String(delivery.whatsapp ?? tenant.whatsapp ?? ''),
    zones: Array.isArray(delivery.zones) ? delivery.zones : [],
    openingHours: getObjectSetting(delivery.openingHours, {
      weekday: { open: '18:00', close: '23:30' },
      saturday: { open: '18:00', close: '23:30' },
      sunday: { open: '18:00', close: '23:30' },
    }),
  };
}

function getSettings(value: unknown) {
  return getObjectSetting(value);
}

function getObjectSetting(
  value: unknown,
  fallback: Record<string, unknown> = {},
) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }

  return fallback;
}
