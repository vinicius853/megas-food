import assert from "node:assert/strict";

import {
  genericMenuToMatrix,
  matrixToGenericUpdate,
} from "./generic-menu-admin-adapter";
import type {
  GenericMenuManagementResponse,
  GenericModifierGroup,
} from "../types/menu-management";

const response: GenericMenuManagementResponse = {
  categories: [
    {
      id: "category-pizzas",
      name: "Pizzas",
      slug: "pizzas",
      type: "PRODUCT_SECTION",
      sortOrder: 0,
      isActive: true,
    },
    {
      id: "category-doces",
      name: "Doces",
      slug: "doces",
      type: "PIZZA_FLAVOR_GROUP",
      sortOrder: 1,
      isActive: true,
    },
  ],
  products: [
    {
      id: "pizza",
      categoryId: "category-pizzas",
      name: "Pizza redonda",
      description: null,
      imageUrl: null,
      type: "PIZZA_ROUND",
      pricingMode: "FROM_MODIFIERS",
      basePrice: null,
      price: null,
      isActive: true,
      sortOrder: 0,
      modifierGroups: [
        group("size-group", "pizza_size", [
          {
            ...option("size-30", "30cm"),
            rules: [
              rule("flavor-group", "pizza_flavor", true, 1, 2),
              rule("border-group", "pizza_border", true, 0, 1),
            ],
          },
        ]),
        group("flavor-group", "pizza_flavor", [
          {
            ...option("flavor", "Calabresa"),
            displayCategoryId: "category-doces",
            prices: [price("flavor-price", "size-30", 42)],
          },
        ]),
        group("border-group", "pizza_border", [
          {
            ...option("border", "Catupiry"),
            prices: [price("border-price", "size-30", 8)],
          },
        ]),
        group("extra-group", "burger_extra", [
          option("unknown-option", "Ignorado pela matriz"),
        ]),
      ],
    },
  ],
};

function run() {
  const matrix = genericMenuToMatrix(response);
  assert.equal(matrix.sizeOptions[0].maxFlavors, 2);
  assert.equal(matrix.sizeOptions[0].allowBorder, true);
  assert.equal(matrix.flavorOptions[0].categoryId, "category-doces");
  assert.equal(matrix.flavorPrices[0].price, 42);
  assert.equal(matrix.borderPrices[0].price, 8);

  matrix.flavorOptions[0].name = "Calabresa atualizada";
  matrix.flavorOptions[0].isActive = false;
  matrix.sizeOptions[0].isActive = false;
  matrix.borderOptions[0].isActive = false;
  matrix.flavorPrices[0].price = 43;
  matrix.borderPrices[0].price = 9;
  matrix.sizeOptions[0].maxFlavors = 3;
  matrix.sizeOptions[0].allowBorder = false;
  matrix.flavorOptions[0].categoryId = null;
  matrix.sizeOptions.push({
    id: "size-11111111-1111-4111-8111-111111111111",
    productId: "pizza",
    name: "45cm",
    subtitle: "12 fatias",
    type: "CM",
    value: 45,
    maxFlavors: 4,
    allowBorder: true,
    isActive: true,
  });
  matrix.flavorPrices.push({
    productId: "pizza",
    sizeId: "size-11111111-1111-4111-8111-111111111111",
    flavorId: "flavor",
    price: 70,
  });
  matrix.borderPrices.push({
    productId: "pizza",
    sizeId: "size-11111111-1111-4111-8111-111111111111",
    borderId: "border",
    price: 12,
  });

  const payload = matrixToGenericUpdate(matrix, response);
  const pizza = payload.products[0];
  const size = findGroup(pizza.modifierGroups, "pizza_size").options[0];
  const flavor = findGroup(pizza.modifierGroups, "pizza_flavor").options[0];
  const border = findGroup(pizza.modifierGroups, "pizza_border").options[0];
  const unknown = findGroup(pizza.modifierGroups, "burger_extra");

  assert.equal(flavor.name, "Calabresa atualizada");
  assert.equal(flavor.isActive, false);
  assert.equal(size.isActive, false);
  assert.equal(border.isActive, false);
  assert.equal(flavor.displayCategoryId, undefined);
  assert.equal(flavor.prices[0].price, 43);
  assert.equal(border.prices[0].price, 9);
  assert.equal(
    size.rules.find((item) => item.targetGroupId === "flavor-group")
      ?.maxSelections,
    3,
  );
  assert.equal(
    size.rules.find((item) => item.targetGroupId === "border-group")?.isEnabled,
    false,
  );
  assert.equal(unknown.options[0].name, "Ignorado pela matriz");
  const newSize = findGroup(pizza.modifierGroups, "pizza_size").options.find(
    (option) => option.name === "45cm",
  ) as { clientId?: string } | undefined;
  const newFlavorPrice = flavor.prices.find((price) => price.price === 70) as
    | { dependsOnOptionClientId?: string }
    | undefined;
  const newBorderPrice = border.prices.find((price) => price.price === 12) as
    | { dependsOnOptionClientId?: string }
    | undefined;

  assert.equal(newSize?.clientId, "size-11111111-1111-4111-8111-111111111111");
  assert.equal(
    newFlavorPrice?.dependsOnOptionClientId,
    "size-11111111-1111-4111-8111-111111111111",
  );
  assert.equal(
    newBorderPrice?.dependsOnOptionClientId,
    "size-11111111-1111-4111-8111-111111111111",
  );

  console.log("Generic menu admin adapter validation passed.");
}

function group(
  id: string,
  code: string,
  options: GenericModifierGroup["options"],
): GenericModifierGroup {
  return {
    id,
    productModifierGroupId: `link-${id}`,
    code,
    name: code,
    description: null,
    selectionType: code === "pizza_flavor" ? "MULTIPLE" : "SINGLE",
    pricingMode:
      code === "pizza_flavor"
        ? "HIGHEST_SELECTED"
        : code === "pizza_border"
          ? "ADDITIVE"
          : "INCLUDED",
    isRequired: code !== "pizza_border",
    minSelections: code === "pizza_border" ? 0 : 1,
    maxSelections: code === "pizza_flavor" ? 3 : 1,
    sortOrder: 0,
    isActive: true,
    options,
  };
}

function option(id: string, name: string) {
  return {
    id,
    productModifierOptionId: `link-${id}`,
    code: `legacy_${id}`,
    name,
    description: null,
    imageUrl: null,
    displayCategoryId: null,
    priceDelta: 0,
    sortOrder: 0,
    isActive: true,
    prices: [],
    rules: [],
  };
}

function price(id: string, dependsOnOptionId: string, value: number) {
  return {
    id,
    dependsOnOptionId,
    price: value,
  };
}

function rule(
  targetGroupId: string,
  targetGroupCode: string,
  isEnabled: boolean,
  minSelections: number,
  maxSelections: number,
) {
  return {
    id: `rule-${targetGroupId}`,
    targetGroupId,
    targetGroupCode,
    isEnabled,
    minSelections,
    maxSelections,
    metadata: null,
  };
}

function findGroup<T extends { code: string }>(groups: T[], code: string) {
  const group = groups.find((item) => item.code === code);
  if (!group) throw new Error(`Grupo nao encontrado: ${code}`);
  return group;
}

run();
