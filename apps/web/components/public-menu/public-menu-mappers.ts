import {
  compareCategoryOrder,
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
    sortOrder: section.sortOrder + 100,
    type: "products" as const,
    items: section.items,
  }));

  return [...flavorSections, ...productSections].sort((a, b) =>
    compareCategoryOrder(a.title, a.sortOrder, b.title, b.sortOrder),
  );
}

export function buildCategoryTabs(
  flavors: FlavorCard[],
  products: FixedProductCard[],
) {
  const tabs = new Map<string, number>();

  for (const flavor of flavors) {
    tabs.set(
      flavor.categoryName,
      Math.min(
        tabs.get(flavor.categoryName) ?? flavor.categorySortOrder,
        flavor.categorySortOrder,
      ),
    );
  }

  for (const product of products) {
    tabs.set(
      product.categoryName,
      Math.min(
        tabs.get(product.categoryName) ?? product.categorySortOrder + 100,
        product.categorySortOrder + 100,
      ),
    );
  }

  return [
    "Todos",
    ...Array.from(tabs.entries())
      .sort((a, b) => compareCategoryOrder(a[0], a[1], b[0], b[1]))
      .map(([name]) => name),
  ];
}
