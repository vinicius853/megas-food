import assert from "node:assert/strict";

import { dedupeFlavorPrices } from "../hooks/menu-management-prices";
import {
  validateFlavorDrafts,
  validateSizeDrafts,
} from "../hooks/menu-management-drafts";
import type {
  Category,
  FlavorOptionMatrixRow,
  SizeOptionMatrixRow,
} from "../types/menu-management";
import {
  ALL_FLAVOR_CATEGORIES,
  buildFlavorCategoryOptions,
  countAvailableSizes,
  findFlavorPriceRecord,
  formatSlices,
  getPizzaModelLabel,
  getSizeSlices,
  matchesFlavorCategoryFilter,
} from "./pizza-pricing-helpers";

const sizes: SizeOptionMatrixRow[] = Array.from({ length: 10 }, (_, index) => ({
  id: `size-${index}`,
  productId: index < 6 ? "round" : "square",
  name: `${25 + index * 5}cm`,
  subtitle: `${4 + index} fatias`,
  type: index < 6 ? "CM" : "SLICES",
  maxFlavors: Math.min(4, index + 1),
  allowBorder: index > 0,
  isActive: true,
}));

const duplicatedPrices = [
  {
    id: "persisted",
    productId: "round",
    flavorId: "four-cheese",
    sizeId: "size-0",
    price: 42,
    isActive: true,
  },
  {
    productId: "round",
    flavorId: "four-cheese",
    sizeId: "size-0",
    price: 45,
  },
  {
    productId: "round",
    flavorId: "four-cheese",
    sizeId: "size-1",
    price: 48,
    isActive: false,
  },
];

const prices = dedupeFlavorPrices(duplicatedPrices);

assert.equal(sizes.length, 10);
assert.equal(getPizzaModelLabel(sizes), "Redondas e quadradas");
assert.equal(getSizeSlices(sizes[0]), 4);
assert.equal(formatSlices("12"), "12 fatias");
assert.equal(prices.length, 2);
assert.equal(prices[0].id, "persisted");
assert.equal(prices[0].price, 45);
assert.equal(countAvailableSizes(prices, "four-cheese"), 1);
assert.equal(
  findFlavorPriceRecord(prices, "round", "four-cheese", "size-1")?.price,
  48,
);
assert.equal(
  findFlavorPriceRecord(
    prices,
    "round",
    "four-cheese",
    "size-0",
  )?.price,
  45,
);
assert.equal(
  validateSizeDrafts(
    [
      {
        ...sizes[0],
        id: "size-11111111-1111-4111-8111-111111111111",
      },
    ],
    [],
    [],
  ),
  null,
);
assert.equal(
  validateFlavorDrafts(
    [
      {
        id: "flavor-11111111-1111-4111-8111-111111111111",
        name: "Quatro queijos",
        isActive: true,
      },
    ],
    sizes,
    prices.map((price) => ({
      ...price,
      flavorId: "flavor-11111111-1111-4111-8111-111111111111",
    })),
  ),
  null,
);

const flavorCategories: Category[] = [
  category("cat-tradicionais", "Tradicionais", "tradicionais"),
  category("cat-especiais", "Especiais", "especiais"),
  category("cat-doces", "Doces", "doces"),
];
const flavorRows: FlavorOptionMatrixRow[] = [
  flavor("calabresa", "Calabresa", "cat-tradicionais", true),
  flavor("portuguesa", "Portuguesa", "tradicionais", false),
  flavor("camarao", "Camarao", "cat-especiais", true),
  flavor("banana", "Banana", "Doces", true),
  flavor("sem-categoria", "Sem categoria", null, true),
];
const categoryOptions = buildFlavorCategoryOptions(
  flavorRows,
  flavorCategories,
);

assert.deepEqual(
  categoryOptions.map((option) => option.label),
  ["Doces", "Especiais", "Tradicionais"],
);
assert.equal(
  matchesFlavorCategoryFilter(
    flavorRows[0],
    flavorCategories,
    categoryOptions.find((option) => option.label === "Tradicionais")?.key ??
      "",
  ),
  true,
);
assert.equal(
  matchesFlavorCategoryFilter(
    flavorRows[1],
    flavorCategories,
    categoryOptions.find((option) => option.label === "Tradicionais")?.key ??
      "",
  ),
  true,
);
assert.equal(
  matchesFlavorCategoryFilter(
    flavorRows[3],
    flavorCategories,
    categoryOptions.find((option) => option.label === "Doces")?.key ?? "",
  ),
  true,
);
assert.equal(
  matchesFlavorCategoryFilter(
    flavorRows[4],
    flavorCategories,
    categoryOptions.find((option) => option.label === "Doces")?.key ?? "",
  ),
  false,
);
assert.equal(
  matchesFlavorCategoryFilter(
    flavorRows[4],
    flavorCategories,
    ALL_FLAVOR_CATEGORIES,
  ),
  true,
);

console.log("Pizza pricing validation passed.");

function category(id: string, name: string, slug: string): Category {
  return {
    id,
    name,
    slug,
    type: "PIZZA_FLAVOR_GROUP",
    isActive: true,
  };
}

function flavor(
  id: string,
  name: string,
  categoryId: string | null,
  isActive: boolean,
): FlavorOptionMatrixRow {
  return {
    id,
    name,
    categoryId,
    isActive,
  };
}
