import type {
  Category,
  FlavorOptionMatrixRow,
  FlavorPrice,
  SizeOptionMatrixRow,
} from "../types/menu-management";

export const ALL_FLAVOR_CATEGORIES = "all";

export type FlavorCategoryOption = {
  key: string;
  label: string;
};

export function getPizzaModelLabel(sizes: SizeOptionMatrixRow[]) {
  const active = sizes.filter((size) => size.isActive);
  const hasRound = active.some((size) => size.type === "CM");
  const hasSquare = active.some((size) => size.type === "SLICES");

  if (hasRound && hasSquare) return "Redondas e quadradas";
  if (hasRound) return "Pizzas redondas";
  if (hasSquare) return "Pizzas quadradas";
  return "Nenhum modelo ativo";
}

export function getSizeSlices(size: SizeOptionMatrixRow) {
  const match = String(size.subtitle ?? "").match(/(\d+)/);
  return match ? Number(match[1]) : "";
}

export function formatSlices(value: string) {
  const slices = Number(value);
  return Number.isFinite(slices) && slices > 0
    ? `${Math.trunc(slices)} fatias`
    : "";
}

export function findFlavorPriceRecord(
  prices: FlavorPrice[],
  productId: string,
  flavorId: string,
  sizeId: string,
) {
  return prices.find(
    (price) =>
      price.productId === productId &&
      price.flavorId === flavorId &&
      price.sizeId === sizeId,
  );
}

export function countAvailableSizes(
  prices: FlavorPrice[],
  flavorId: string,
) {
  return new Set(
    prices
      .filter((price) => price.flavorId === flavorId && price.isActive === true)
      .map((price) => `${price.productId}:${price.sizeId}`),
  ).size;
}

export function buildFlavorCategoryOptions(
  flavors: FlavorOptionMatrixRow[],
  categories: Category[],
) {
  const options = new Map<string, FlavorCategoryOption>();

  for (const flavor of flavors) {
    const category = findFlavorCategory(flavor, categories);
    if (!category) continue;

    const key = getCategoryFilterKey(category);
    if (!key || options.has(key)) continue;

    options.set(key, {
      key,
      label: category.name.trim() || "Sem nome",
    });
  }

  return Array.from(options.values()).sort((left, right) =>
    left.label.localeCompare(right.label, "pt-BR", {
      sensitivity: "base",
    }),
  );
}

export function matchesFlavorCategoryFilter(
  flavor: FlavorOptionMatrixRow,
  categories: Category[],
  selectedCategory: string,
) {
  if (selectedCategory === ALL_FLAVOR_CATEGORIES) return true;

  const category = findFlavorCategory(flavor, categories);
  if (!category) return false;

  return getCategoryFilterKey(category) === selectedCategory;
}

function findFlavorCategory(
  flavor: FlavorOptionMatrixRow,
  categories: Category[],
) {
  const rawCategory = String(flavor.categoryId ?? "").trim();
  if (!rawCategory) return null;

  const normalizedCategory = normalizeCategoryKey(rawCategory);

  return (
    categories.find((category) => category.id === rawCategory) ??
    categories.find((category) => category.slug === rawCategory) ??
    categories.find(
      (category) => normalizeCategoryKey(category.name) === normalizedCategory,
    ) ??
    null
  );
}

function getCategoryFilterKey(category: Category) {
  if (category.id) return `id:${category.id}`;
  if (category.slug) return `slug:${category.slug}`;

  const normalizedName = normalizeCategoryKey(category.name);
  return normalizedName ? `name:${normalizedName}` : "";
}

function normalizeCategoryKey(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}
