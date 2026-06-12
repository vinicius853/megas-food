import {
  normalizeCategoryLabel,
  parseMoney,
} from "./public-menu-formatters";
import type {
  FixedProductCard,
  FlavorCard,
  MenuSection,
  PublicMenuV2Option,
  PublicMenuV2Product,
  PublicMenuV2Response,
} from "./public-menu.types";

const SIZE_GROUP_CODE = "pizza_size";
const FLAVOR_GROUP_CODE = "pizza_flavor";

export function getPizzaProductFromV2(data: PublicMenuV2Response) {
  return (
    data.categories
      .flatMap((category) => category.products)
      .find(isPizzaConfiguratorProduct) ?? null
  );
}

export function mapFlavorCardsFromV2(data: PublicMenuV2Response): FlavorCard[] {
  const pizzaProduct = getPizzaProductFromV2(data);
  const productCategory = findV2CategoryByProductId(data, pizzaProduct?.id);

  if (!pizzaProduct || !productCategory) return [];

  return mapGenericFlavorCardsFromProduct({
    product: pizzaProduct,
    categoryName: productCategory.name,
    categorySortOrder: productCategory.sortOrder,
  });
}

export function mapFixedProductCardsFromV2(
  data: PublicMenuV2Response,
): FixedProductCard[] {
  return data.categories
    .flatMap((category) =>
      category.products.map((product) => ({
        product,
        category,
      })),
    )
    .filter(({ product }) => !isPizzaConfiguratorProduct(product))
    .map(({ product, category }) => ({
      id: product.id,
      product,
      name: product.name,
      description: product.description ?? "Produto cadastrado no cardapio.",
      categoryName: category.name,
      categorySortOrder: category.sortOrder,
      image: product.imageUrl || undefined,
      price: parseMoney(product.price ?? product.basePrice),
    }))
    .filter((product) => product.price > 0);
}

function mapGenericFlavorCardsFromProduct(input: {
  product: PublicMenuV2Product;
  categoryName: string;
  categorySortOrder: number;
}) {
  const sizeGroup = input.product.modifierGroups.find(
    (group) => group.code === SIZE_GROUP_CODE,
  );
  const flavorGroup = input.product.modifierGroups.find(
    (group) => group.code === FLAVOR_GROUP_CODE,
  );

  if (!sizeGroup || !flavorGroup) return [];

  const activeSizes = sizeGroup.options.filter((option) => option.isActive);
  const activeFlavors = flavorGroup.options.filter((option) => option.isActive);

  if (activeSizes.length === 0 || activeFlavors.length === 0) return [];

  return buildFlavorCardsFromGenericOptions({
    sizes: activeSizes,
    flavors: activeFlavors,
    fallbackCategoryName: input.categoryName,
    fallbackCategorySortOrder: input.categorySortOrder,
  });
}

function buildFlavorCardsFromGenericOptions(input: {
  sizes: PublicMenuV2Option[];
  flavors: PublicMenuV2Option[];
  fallbackCategoryName: string;
  fallbackCategorySortOrder: number;
}) {
  return input.flavors
    .map((flavor) => {
      const prices = input.sizes
        .map((size) => buildGenericFlavorPrice(flavor, size))
        .filter((price) => price.value > 0)
        .slice(0, 4);

      return {
        id: flavor.id,
        name: flavor.name,
        description:
          flavor.description ??
          "Pizza artesanal preparada com ingredientes selecionados.",
        categoryName: flavor.category?.name ?? input.fallbackCategoryName,
        categorySortOrder:
          flavor.category?.sortOrder ?? input.fallbackCategorySortOrder,
        image: flavor.imageUrl || undefined,
        minPrice:
          prices.length > 0
            ? Math.min(...prices.map((price) => price.value))
            : 0,
        prices,
      };
    })
    .filter((flavor) => flavor.minPrice > 0);
}

function buildGenericFlavorPrice(
  flavor: PublicMenuV2Option,
  size: PublicMenuV2Option,
) {
  return {
    label: size.name,
    subtitle: size.description,
    value: getV2ContextualOptionPrice(flavor, size.id),
  };
}

export function getV2ContextualOptionPrice(
  option: PublicMenuV2Option,
  dependsOnOptionId: string,
) {
  return parseMoney(
    option.prices.find((price) => price.dependsOnOptionId === dependsOnOptionId)
      ?.price,
  );
}

function findV2CategoryByProductId(
  data: PublicMenuV2Response,
  productId?: string,
) {
  if (!productId) return undefined;

  return data.categories.find((category) =>
    category.products.some((product) => product.id === productId),
  );
}

function isPizzaConfiguratorProduct(product: PublicMenuV2Product) {
  const groupCodes = new Set(product.modifierGroups.map((group) => group.code));

  return groupCodes.has(SIZE_GROUP_CODE) && groupCodes.has(FLAVOR_GROUP_CODE);
}

export function isAdditionalCategory(value: string) {
  return normalizeCategoryLabel(value).includes("adicion");
}

function groupByCategory<
  T extends { categoryName: string; categorySortOrder: number },
>(items: T[]) {
  const groups = new Map<
    string,
    {
      title: string;
      sortOrder: number;
      items: T[];
    }
  >();

  for (const item of items) {
    const key = item.categoryName;
    const existing = groups.get(key);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(key, {
      title: key,
      sortOrder: item.categorySortOrder,
      items: [item],
    });
  }

  return Array.from(groups.values());
}

export function buildMenuSections(
  flavors: FlavorCard[],
  products: FixedProductCard[],
): MenuSection[] {
  const flavorSections = groupByCategory(flavors).map((section) => ({
    id: `flavors-${section.title}`,
    title: section.title.toLowerCase().includes("pizza")
      ? section.title
      : `Pizzas ${section.title.toLowerCase()}`,
    sortOrder: section.sortOrder,
    type: "flavors" as const,
    items: section.items,
  }));

  const productSections = groupByCategory(products).map((section) => ({
    id: `products-${section.title}`,
    title: section.title,
    sortOrder: section.sortOrder,
    type: "products" as const,
    items: section.items,
  }));

  return [...flavorSections, ...productSections].sort(compareMenuSection);
}

export function buildCategoryTabs(
  flavors: FlavorCard[],
  products: FixedProductCard[],
) {
  const tabs = new Map<
    string,
    {
      sortOrder: number;
      type: MenuSection["type"];
    }
  >();

  for (const flavor of flavors) {
    const current = tabs.get(flavor.categoryName);
    tabs.set(flavor.categoryName, {
      sortOrder: Math.min(
        current?.sortOrder ?? flavor.categorySortOrder,
        flavor.categorySortOrder,
      ),
      type: "flavors",
    });
  }

  for (const product of products) {
    const current = tabs.get(product.categoryName);
    tabs.set(product.categoryName, {
      sortOrder: Math.min(
        current?.sortOrder ?? product.categorySortOrder,
        product.categorySortOrder,
      ),
      type: current?.type === "flavors" ? "flavors" : "products",
    });
  }

  return [
    "Todos",
    ...Array.from(tabs.entries())
      .sort(([firstName, first], [secondName, second]) =>
        compareTypedCategory(
          firstName,
          first.sortOrder,
          first.type,
          secondName,
          second.sortOrder,
          second.type,
        ),
      )
      .map(([name]) => name),
  ];
}

function compareMenuSection(first: MenuSection, second: MenuSection) {
  return compareTypedCategory(
    first.title,
    first.sortOrder,
    first.type,
    second.title,
    second.sortOrder,
    second.type,
  );
}

function compareTypedCategory(
  firstName: string,
  firstSortOrder: number,
  firstType: MenuSection["type"],
  secondName: string,
  secondSortOrder: number,
  secondType: MenuSection["type"],
) {
  const typeOrder = {
    flavors: 0,
    products: 1,
  } satisfies Record<MenuSection["type"], number>;
  const typeDifference = typeOrder[firstType] - typeOrder[secondType];

  if (typeDifference !== 0) return typeDifference;

  const sortDifference = firstSortOrder - secondSortOrder;

  if (sortDifference !== 0) return sortDifference;

  return firstName.localeCompare(secondName, "pt-BR");
}
