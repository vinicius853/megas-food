import assert from "node:assert/strict";

import {
  buildCategoryTabs,
  buildMenuSections,
} from "./public-menu-mappers";
import type {
  FixedProductCard,
  FlavorCard,
  PublicMenuV2Product,
} from "./public-menu.types";

const flavors: FlavorCard[] = [
  {
    id: "calabresa",
    name: "Calabresa",
    description: "Tradicional",
    categoryName: "Tradicionais",
    categorySortOrder: 1,
    minPrice: 40,
    prices: [{ label: "30cm", value: 40 }],
  },
  {
    id: "banana",
    name: "Banana",
    description: "Doce",
    categoryName: "Doces",
    categorySortOrder: 3,
    minPrice: 44,
    prices: [{ label: "30cm", value: 44 }],
  },
];

const products: FixedProductCard[] = [
  {
    id: "promo-combo",
    product: product("promo-combo"),
    name: "Combo promoção",
    description: "Produto simples",
    categoryName: "Promoção",
    categorySortOrder: 0,
    price: 29,
  },
  {
    id: "bebida",
    product: product("bebida"),
    name: "Refrigerante",
    description: "Bebida",
    categoryName: "Bebidas",
    categorySortOrder: 4,
    price: 12,
  },
];

assert.deepEqual(buildCategoryTabs(flavors, products), [
  "Todos",
  "Promoção",
  "Tradicionais",
  "Doces",
  "Bebidas",
]);

assert.deepEqual(
  buildMenuSections(flavors, products).map((section) => section.title),
  ["Promoção", "Pizzas tradicionais", "Pizzas doces", "Bebidas"],
);

function product(id: string): PublicMenuV2Product {
  return {
    id,
    name: id,
    description: null,
    imageUrl: null,
    type: "OTHER",
    pricingMode: "FIXED",
    basePrice: null,
    price: 10,
    sortOrder: 0,
    modifierGroups: [],
  };
}
