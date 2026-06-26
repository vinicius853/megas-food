import assert from "node:assert/strict";

import {
  getCategoryMoveAvailability,
  moveCategory,
  orderCategories,
} from "./category-order";
import type { Category } from "../types/menu-management";

const categories: Category[] = [
  category("tradicionais", "Tradicionais", "PIZZA_FLAVOR_GROUP", 1),
  category("promocao", "Promoção", "PRODUCT_SECTION", 0),
  category("doces", "Doces", "PIZZA_FLAVOR_GROUP", 2),
  category("bebidas", "Bebidas", "PRODUCT_SECTION", 3),
];

assert.deepEqual(
  orderCategories(categories).map((item) => item.name),
  ["Promoção", "Tradicionais", "Doces", "Bebidas"],
);

assert.deepEqual(getCategoryMoveAvailability(categories, "promocao"), {
  canMoveUp: false,
  canMoveDown: true,
});
assert.deepEqual(getCategoryMoveAvailability(categories, "bebidas"), {
  canMoveUp: true,
  canMoveDown: false,
});

assert.deepEqual(
  moveCategory(categories, "tradicionais", "up").map((item) => ({
    id: item.id,
    sortOrder: item.sortOrder,
  })),
  [
    { id: "tradicionais", sortOrder: 0 },
    { id: "promocao", sortOrder: 1 },
    { id: "doces", sortOrder: 2 },
    { id: "bebidas", sortOrder: 3 },
  ],
);

assert.deepEqual(
  moveCategory(categories, "doces", "down").map((item) => ({
    id: item.id,
    sortOrder: item.sortOrder,
  })),
  [
    { id: "promocao", sortOrder: 0 },
    { id: "tradicionais", sortOrder: 1 },
    { id: "bebidas", sortOrder: 2 },
    { id: "doces", sortOrder: 3 },
  ],
);

function category(
  id: string,
  name: string,
  type: Category["type"],
  sortOrder: number,
): Category {
  return {
    id,
    name,
    slug: id,
    type,
    sortOrder,
    isActive: true,
  };
}
