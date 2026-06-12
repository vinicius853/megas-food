import assert from "node:assert/strict";

import { dedupeFlavorPrices } from "../hooks/menu-management-prices";
import {
  validateFlavorDrafts,
  validateSizeDrafts,
} from "../hooks/menu-management-drafts";
import type { SizeOptionMatrixRow } from "../types/menu-management";
import {
  countAvailableSizes,
  findFlavorPriceRecord,
  formatSlices,
  getPizzaModelLabel,
  getSizeSlices,
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
  },
  {
    productId: "round",
    flavorId: "four-cheese",
    sizeId: "size-0",
    price: 45,
  },
];

const prices = dedupeFlavorPrices(duplicatedPrices);

assert.equal(sizes.length, 10);
assert.equal(getPizzaModelLabel(sizes), "Redondas e quadradas");
assert.equal(getSizeSlices(sizes[0]), 4);
assert.equal(formatSlices("12"), "12 fatias");
assert.equal(prices.length, 1);
assert.equal(prices[0].id, "persisted");
assert.equal(prices[0].price, 45);
assert.equal(countAvailableSizes(prices, "four-cheese"), 1);
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

console.log("Pizza pricing validation passed.");
