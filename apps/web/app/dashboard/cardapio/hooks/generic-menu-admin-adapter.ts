import {
  type BorderPrice,
  type FlavorPrice,
  type GenericMenuManagementResponse,
  type GenericMenuProduct,
  type GenericModifierGroup,
  type GenericModifierOption,
  type MenuManagementResponse,
  type BorderOptionMatrixRow,
  type FlavorOptionMatrixRow,
  type SizeOptionMatrixRow,
  type Product,
  parseMoney,
  parsePositiveInteger,
} from "../types/menu-management";
import {
  dedupeBorderPrices,
  dedupeFlavorPrices,
  normalizeMenuPrices,
} from "./menu-management-prices";

type MatrixState = MenuManagementResponse;

const GROUP_CODES = {
  size: "pizza_size",
  flavor: "pizza_flavor",
  border: "pizza_border",
} as const;

const BASE_PIZZA_GROUPS = [
  {
    code: GROUP_CODES.size,
    name: "Tamanhos",
    selectionType: "SINGLE" as const,
    pricingMode: "INCLUDED" as const,
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    sortOrder: 0,
  },
  {
    code: GROUP_CODES.flavor,
    name: "Sabores",
    selectionType: "MULTIPLE" as const,
    pricingMode: "HIGHEST_SELECTED" as const,
    isRequired: true,
    minSelections: 1,
    maxSelections: 4,
    sortOrder: 1,
  },
  {
    code: GROUP_CODES.border,
    name: "Bordas",
    selectionType: "SINGLE" as const,
    pricingMode: "ADDITIVE" as const,
    isRequired: false,
    minSelections: 0,
    maxSelections: 1,
    sortOrder: 2,
  },
] as const;

export function genericMenuToMatrix(
  response: GenericMenuManagementResponse,
): MatrixState {
  const pizzaProducts = response.products.filter(
    (product) => isPizza(product) && product.isActive,
  );
  const sizes: SizeOptionMatrixRow[] = [];
  const flavors = new Map<string, FlavorOptionMatrixRow>();
  const borders = new Map<string, BorderOptionMatrixRow>();
  const flavorPrices: FlavorPrice[] = [];
  const borderPrices: BorderPrice[] = [];

  for (const product of pizzaProducts) {
    const sizeGroup = groupByCode(product, GROUP_CODES.size);
    const flavorGroup = groupByCode(product, GROUP_CODES.flavor);
    const borderGroup = groupByCode(product, GROUP_CODES.border);

    for (const option of sizeGroup?.options ?? []) {
      const flavorRule = option.rules.find(
        (rule) => rule.targetGroupCode === GROUP_CODES.flavor,
      );
      const borderRule = option.rules.find(
        (rule) => rule.targetGroupCode === GROUP_CODES.border,
      );

      sizes.push({
        id: option.id,
        productId: product.id,
        name: option.name,
        subtitle: option.description,
        type: product.type === "PIZZA_SQUARE" ? "SLICES" : "CM",
        value: inferSizeValue(option.name),
        maxFlavors: Math.max(1, flavorRule?.maxSelections ?? 1),
        allowBorder: borderRule
          ? borderRule.isEnabled && (borderRule.maxSelections ?? 1) > 0
          : true,
        sortOrder: option.sortOrder,
        isActive: option.isActive,
      });
    }

    for (const option of flavorGroup?.options ?? []) {
      mergeSharedOption(flavors, option, {
        categoryId: option.displayCategoryId,
      });

      for (const price of option.prices) {
        if (!price.dependsOnOptionId) continue;
        flavorPrices.push({
          id: price.id,
          productId: product.id,
          sizeId: price.dependsOnOptionId,
          flavorId: option.id,
          price: price.price,
        });
      }
    }

    for (const option of borderGroup?.options ?? []) {
      mergeSharedOption(borders, option);

      for (const price of option.prices) {
        if (!price.dependsOnOptionId) continue;
        borderPrices.push({
          id: price.id,
          productId: product.id,
          sizeId: price.dependsOnOptionId,
          borderId: option.id,
          price: price.price,
        });
      }
    }
  }

  return normalizeMenuPrices({
    categories: response.categories,
    products: response.products.map(toMatrixProduct),
    sizeOptions: sizes,
    flavorOptions: [...flavors.values()],
    flavorPrices: dedupeFlavorPrices(flavorPrices),
    borderOptions: [...borders.values()],
    borderPrices: dedupeBorderPrices(borderPrices),
  });
}

export function matrixToGenericUpdate(
  state: MatrixState,
  baseline: GenericMenuManagementResponse,
) {
  const productsById = new Map(
    state.products.map((product) => [product.id, product]),
  );
  const baselineIds = new Set(baseline.products.map((product) => product.id));

  return {
    categories: state.categories.map((category, index) => {
      const persisted = baseline.categories.some(
        (item) => item.id === category.id,
      );

      return {
        id: persisted ? category.id : undefined,
        clientId: persisted ? undefined : category.id,
        name: category.name,
        slug: category.slug || slugify(category.name),
        type: category.type,
        sortOrder: index,
        isActive: category.isActive,
      };
    }),
    products: [
      ...baseline.products.map((baselineProduct) => {
        const product =
          productsById.get(baselineProduct.id) ??
          toMatrixProduct(baselineProduct);

        return {
          id: baselineProduct.id,
          ...categoryReference(product.categoryId, baseline),
          name: product.name,
          description: product.description ?? undefined,
          imageUrl: product.imageUrl ?? undefined,
          type: product.type,
          pricingMode: isPizza(baselineProduct)
            ? ("FROM_MODIFIERS" as const)
            : baselineProduct.pricingMode,
          basePrice: baselineProduct.basePrice ?? undefined,
          price:
            product.type === "DRINK" || product.type === "OTHER"
              ? parseMoney(product.price)
              : (baselineProduct.price ?? undefined),
          isActive: product.isActive,
          sortOrder: product.sortOrder ?? baselineProduct.sortOrder,
          modifierGroups: isPizza(baselineProduct)
            ? buildPizzaGroups(state, baselineProduct)
            : baselineProduct.modifierGroups.map(toUpdateGroup),
        };
      }),
      ...state.products
        .filter((product) => !baselineIds.has(product.id))
        .map((product, index) => {
          const sortOrder =
            product.sortOrder ?? baseline.products.length + index;

          if (isPizza(product)) {
            const genericProduct = toNewGenericPizza(product, sortOrder);

            return {
              ...categoryReference(product.categoryId, baseline),
              name: product.name,
              description: product.description ?? undefined,
              imageUrl: product.imageUrl ?? undefined,
              type: product.type,
              pricingMode: "FROM_MODIFIERS" as const,
              isActive: product.isActive,
              sortOrder,
              modifierGroups: buildPizzaGroups(state, genericProduct),
            };
          }

          return {
            ...categoryReference(product.categoryId, baseline),
            name: product.name,
            description: product.description ?? undefined,
            imageUrl: product.imageUrl ?? undefined,
            type: product.type,
            pricingMode: "FIXED" as const,
            price: parseMoney(product.price),
            isActive: product.isActive,
            sortOrder,
            modifierGroups: [],
          };
        }),
    ],
  };
}

function buildPizzaGroups(state: MatrixState, product: GenericMenuProduct) {
  const hasLocalConfiguration =
    product.modifierGroups.length > 0 ||
    state.sizeOptions.some((size) => size.productId === product.id) ||
    state.flavorPrices.some((price) => price.productId === product.id) ||
    state.borderPrices.some((price) => price.productId === product.id);

  if (!hasLocalConfiguration) {
    return [];
  }

  const baseGroups = BASE_PIZZA_GROUPS.map((definition) => {
    return (
      groupByCode(product, definition.code) ?? createBaseGroup(definition)
    );
  });
  const groups = [
    ...baseGroups,
    ...product.modifierGroups.filter(
      (group) =>
        !BASE_PIZZA_GROUPS.some((definition) => definition.code === group.code),
    ),
  ];

  return groups.map((group) => {
    if (group.code === GROUP_CODES.size) {
      return {
        ...toUpdateGroup(group),
        options: state.sizeOptions
          .filter((size) => size.productId === product.id)
          .map((size, index) => {
            const baseline = group.options.find(
              (option) => option.id === size.id,
            );
            const flavorGroup = groupByCode(product, GROUP_CODES.flavor);
            const borderGroup = groupByCode(product, GROUP_CODES.border);

            return {
              ...optionIdentity(baseline),
              clientId: baseline ? undefined : size.id,
              code: baseline?.code ?? undefined,
              name: size.name,
              description: size.subtitle || undefined,
              imageUrl: baseline?.imageUrl ?? undefined,
              displayCategoryId: baseline?.displayCategoryId ?? undefined,
              priceDelta: baseline?.priceDelta ?? 0,
              sortOrder: index,
              isActive: size.isActive,
              prices: dedupeContextualPrices(
                baseline?.prices.map(toUpdatePrice) ?? [],
              ),
              rules: [
                buildRule(
                  baseline,
                  flavorGroup,
                  GROUP_CODES.flavor,
                  true,
                  1,
                  parsePositiveInteger(size.maxFlavors),
                ),
                buildRule(
                  baseline,
                  borderGroup,
                  GROUP_CODES.border,
                  size.allowBorder,
                  0,
                  size.allowBorder ? 1 : 0,
                ),
              ].filter(isDefined),
            };
          }),
      };
    }

    if (group.code === GROUP_CODES.flavor) {
      return {
        ...toUpdateGroup(group),
        options: state.flavorOptions.map((flavor, index) => {
          const baseline = group.options.find(
            (option) => option.id === flavor.id,
          );

          return {
            ...optionIdentity(baseline),
            clientId: baseline ? undefined : flavor.id,
            code: baseline?.code ?? undefined,
            name: flavor.name,
            description: flavor.description || undefined,
            imageUrl: flavor.imageUrl || undefined,
            displayCategoryId: flavor.categoryId ?? undefined,
            priceDelta: baseline?.priceDelta ?? 0,
            sortOrder: index,
            isActive: flavor.isActive,
            prices: dedupeContextualPrices(
              dedupeFlavorPrices(state.flavorPrices)
                .filter(
                  (price) =>
                    price.productId === product.id &&
                    price.flavorId === flavor.id,
                )
                .map((price) => ({
                  id: price.id,
                  ...contextualOptionReference(price.sizeId, product),
                  price: parseMoney(price.price),
                })),
            ),
            rules: baseline?.rules.map(toUpdateRule) ?? [],
          };
        }),
      };
    }

    if (group.code === GROUP_CODES.border) {
      return {
        ...toUpdateGroup(group),
        options: state.borderOptions.map((border, index) => {
          const baseline = group.options.find(
            (option) => option.id === border.id,
          );

          return {
            ...optionIdentity(baseline),
            clientId: baseline ? undefined : border.id,
            code: baseline?.code ?? undefined,
            name: border.name,
            description: baseline?.description ?? undefined,
            imageUrl: baseline?.imageUrl ?? undefined,
            displayCategoryId: baseline?.displayCategoryId ?? undefined,
            priceDelta: baseline?.priceDelta ?? 0,
            sortOrder: index,
            isActive: border.isActive,
            prices: dedupeContextualPrices(
              dedupeBorderPrices(state.borderPrices)
                .filter(
                  (price) =>
                    price.productId === product.id &&
                    price.borderId === border.id,
                )
                .map((price) => ({
                  id: price.id,
                  ...contextualOptionReference(price.sizeId, product),
                  price: parseMoney(price.price),
                })),
            ),
            rules: baseline?.rules.map(toUpdateRule) ?? [],
          };
        }),
      };
    }

    return toUpdateGroup(group);
  });
}

function toUpdateGroup(group: GenericModifierGroup) {
  return {
    productModifierGroupId: group.productModifierGroupId || undefined,
    modifierGroupId: group.id || undefined,
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
      ...optionIdentity(option),
      code: option.code ?? undefined,
      name: option.name,
      description: option.description ?? undefined,
      imageUrl: option.imageUrl ?? undefined,
      displayCategoryId: option.displayCategoryId ?? undefined,
      priceDelta: option.priceDelta,
      sortOrder: option.sortOrder,
      isActive: option.isActive,
      prices: dedupeContextualPrices(option.prices.map(toUpdatePrice)),
      rules: option.rules.map(toUpdateRule),
    })),
  };
}

function buildRule(
  option: GenericModifierOption | undefined,
  targetGroup: GenericModifierGroup | undefined,
  targetGroupCode: string,
  isEnabled: boolean,
  minSelections: number,
  maxSelections: number,
) {
  const existing = option?.rules.find(
    (rule) =>
      rule.targetGroupCode === targetGroupCode ||
      rule.targetGroupId === targetGroup?.id,
  );

  return {
    id: existing?.id,
    ...(targetGroup?.id
      ? { targetGroupId: targetGroup.id }
      : { targetGroupCode }),
    isEnabled,
    minSelections,
    maxSelections,
    metadata: isRecord(existing?.metadata) ? existing.metadata : undefined,
  };
}

function createBaseGroup(
  definition: (typeof BASE_PIZZA_GROUPS)[number],
): GenericModifierGroup {
  return {
    id: "",
    productModifierGroupId: "",
    code: definition.code,
    name: definition.name,
    description: null,
    selectionType: definition.selectionType,
    pricingMode: definition.pricingMode,
    isRequired: definition.isRequired,
    minSelections: definition.minSelections,
    maxSelections: definition.maxSelections,
    sortOrder: definition.sortOrder,
    isActive: true,
    options: [],
  };
}

function optionIdentity(option: GenericModifierOption | undefined) {
  return {
    productModifierOptionId: option?.productModifierOptionId,
    modifierOptionId: option?.id,
  };
}

function contextualOptionReference(
  optionId: string,
  product: GenericMenuProduct,
) {
  const persisted = product.modifierGroups.some((group) =>
    group.options.some((option) => option.id === optionId),
  );

  return persisted
    ? { dependsOnOptionId: optionId }
    : { dependsOnOptionClientId: optionId };
}

function categoryReference(
  categoryId: string,
  baseline: GenericMenuManagementResponse,
) {
  const persisted = baseline.categories.some(
    (category) => category.id === categoryId,
  );

  return persisted ? { categoryId } : { categoryClientId: categoryId };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toUpdatePrice(price: GenericModifierOption["prices"][number]) {
  return {
    id: price.id,
    dependsOnOptionId: price.dependsOnOptionId ?? undefined,
    price: price.price,
  };
}

function dedupeContextualPrices<
  T extends {
    id?: string;
    dependsOnOptionId?: string;
    dependsOnOptionClientId?: string;
  },
>(prices: T[]) {
  const unique = new Map<string, T>();

  for (const price of prices) {
    const key =
      price.dependsOnOptionId ??
      price.dependsOnOptionClientId ??
      "__base_price__";
    const current = unique.get(key);

    unique.set(key, {
      ...current,
      ...price,
      id: current?.id ?? price.id,
    });
  }

  return [...unique.values()];
}

function toUpdateRule(rule: GenericModifierOption["rules"][number]) {
  return {
    id: rule.id,
    targetGroupId: rule.targetGroupId,
    isEnabled: rule.isEnabled,
    minSelections: rule.minSelections ?? undefined,
    maxSelections: rule.maxSelections ?? undefined,
    metadata: isRecord(rule.metadata) ? rule.metadata : undefined,
  };
}

function toMatrixProduct(product: GenericMenuProduct): Product {
  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    type: product.type,
    price: product.price,
    sortOrder: product.sortOrder,
    isActive: product.isActive,
  };
}

function toNewGenericPizza(
  product: Product,
  sortOrder: number,
): GenericMenuProduct {
  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    description: product.description ?? null,
    imageUrl: product.imageUrl ?? null,
    type: product.type,
    pricingMode: "FROM_MODIFIERS",
    basePrice: null,
    price: null,
    isActive: product.isActive,
    sortOrder,
    modifierGroups: [],
  };
}

function mergeSharedOption<
  T extends FlavorOptionMatrixRow | BorderOptionMatrixRow,
>(
  target: Map<string, T>,
  option: GenericModifierOption,
  extra: Partial<T> = {},
) {
  const current = target.get(option.id);
  const value = {
    id: option.id,
    name: option.name,
    isActive: (current?.isActive ?? false) || option.isActive,
    ...("description" in extra || option.description !== null
      ? { description: option.description }
      : {}),
    ...("imageUrl" in extra || option.imageUrl !== null
      ? { imageUrl: option.imageUrl }
      : {}),
    sortOrder: option.sortOrder,
    ...extra,
  } as T;

  target.set(option.id, value);
}

function groupByCode(product: GenericMenuProduct, code: string) {
  return product.modifierGroups.find((group) => group.code === code);
}

function isPizza(product: Pick<Product, "type">) {
  return product.type === "PIZZA_ROUND" || product.type === "PIZZA_SQUARE";
}

function inferSizeValue(name: string) {
  const match = name.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
