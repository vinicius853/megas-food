import assert from "node:assert/strict";

import {
  getDashboardOrderItemName,
  normalizeOrderItemForDisplay,
} from "./order-item-display";
import type { OrderItem, OrderItemModifier } from "./types";

function run() {
  validatesGenericPizzaHalfAndHalf();
  validatesGenericPizzaWithThreeFlavors();
  validatesDashboardPizzaNameWithFourFlavors();
  validatesDashboardPizzaNameWithNamedSize();
  validatesGenericPizzaWithBorder();
  validatesGenericBurger();
  validatesDashboardSimpleProductName();
}

function validatesGenericPizzaHalfAndHalf() {
  const normalized = normalizeOrderItemForDisplay(
    genericItem([
      modifier("size", "Tamanho", "pizza_size", "30cm", 0),
      modifier("flavor-1", "Sabores", "pizza_flavor", "calabresa", 40, 0.5),
      modifier("flavor-2", "Sabores", "pizza_flavor", "mussarela", 0, 0.5),
    ]),
  );

  assert.equal(normalized.source, "V2_GENERIC");
  assert.equal(normalized.name, "Pizza 1/2 calabresa + 1/2 mussarela");
  assert.equal(normalized.groups.length, 2);
  assert.equal(normalized.groups[1].options.length, 2);
  assert.equal(normalized.groups[1].options[0].fraction, 0.5);
}

function validatesGenericPizzaWithThreeFlavors() {
  const normalized = normalizeOrderItemForDisplay(
    genericItem([
      modifier("flavor-1", "Sabores", "pizza_flavor", "Calabresa", 40),
      modifier("flavor-2", "Sabores", "pizza_flavor", "Mussarela", 0),
      modifier("flavor-3", "Sabores", "pizza_flavor", "Peperone", 0),
    ]),
  );

  assert.equal(
    normalized.name,
    "Pizza 1/3 Calabresa + 1/3 Mussarela + 1/3 Peperone",
  );
}

function validatesDashboardPizzaNameWithFourFlavors() {
  const normalized = normalizeOrderItemForDisplay(
    genericItem([
      modifier("size", "Tamanhos", "pizza_size", "40cm", 0),
      modifier("flavor-1", "Sabores", "pizza_flavor", "Calabresa", 40, 0.25),
      modifier("flavor-2", "Sabores", "pizza_flavor", "Baiana", 0, 0.25),
      modifier(
        "flavor-3",
        "Sabores",
        "pizza_flavor",
        "Brocolis com Bacon",
        0,
        0.25,
      ),
      modifier("flavor-4", "Sabores", "pizza_flavor", "Caipira", 0, 0.25),
    ]),
  );

  assert.equal(getDashboardOrderItemName(normalized), "Pizza 40cm (4 Sabores)");
}

function validatesDashboardPizzaNameWithNamedSize() {
  const normalized = normalizeOrderItemForDisplay(
    genericItem([
      modifier("size", "Tamanho", "pizza_size", "Grande", 0),
      modifier("flavor-1", "Sabores", "pizza_flavor", "Calabresa", 40, 0.5),
      modifier("flavor-2", "Sabores", "pizza_flavor", "Mussarela", 0, 0.5),
    ]),
  );

  assert.equal(
    getDashboardOrderItemName(normalized),
    "Pizza Grande (2 Sabores)",
  );
}

function validatesGenericPizzaWithBorder() {
  const normalized = normalizeOrderItemForDisplay(
    genericItem([
      modifier("size", "Tamanho", "pizza_size", "30cm", 0),
      modifier("flavor", "Sabores", "pizza_flavor", "calabresa", 40),
      modifier("border", "Borda", "pizza_border", "catupiry", 8),
    ]),
  );
  const borderGroup = normalized.groups.find(
    (group) => group.groupCode === "pizza_border",
  );

  assert.equal(borderGroup?.options[0].optionName, "catupiry");
  assert.equal(borderGroup?.options[0].totalDelta, 8);
}

function validatesGenericBurger() {
  const normalized = normalizeOrderItemForDisplay(
    genericItem(
      [
        modifier("point", "Ponto da carne", "ponto_carne", "Ao ponto", 0),
        modifier("cheese", "Queijos", "queijos", "Cheddar", 3),
        modifier("extra", "Extras", "extras", "Bacon", 4),
      ],
      "Hamburguer artesanal",
    ),
  );

  assert.deepEqual(
    normalized.groups.map((group) => group.groupCode),
    ["ponto_carne", "queijos", "extras"],
  );
  assert.equal(normalized.name, "Hamburguer artesanal");
}

function validatesDashboardSimpleProductName() {
  const normalized = normalizeOrderItemForDisplay(
    genericItem([], "Coca Cola Zero 2L"),
  );

  assert.equal(getDashboardOrderItemName(normalized), "Coca Cola Zero 2L");
}

function genericItem(
  modifiers: OrderItemModifier[],
  name = "Pizza redonda",
): OrderItem {
  return {
    id: "item-v2",
    name,
    quantity: 1,
    unitPrice: 40,
    total: 40,
    modifiers,
  };
}

function modifier(
  id: string,
  groupName: string,
  groupCode: string,
  optionName: string,
  totalDelta: number,
  fraction?: number,
): OrderItemModifier {
  return {
    id,
    groupName,
    groupCode,
    optionName,
    optionCode: optionName,
    pricingMode: groupCode === "pizza_border" ? "ADDITIVE" : "INCLUDED",
    quantity: 1,
    fraction,
    dependsOnOptionId: groupCode === "pizza_size" ? null : "size",
    unitPriceDelta: totalDelta,
    totalDelta,
    sortOrder: id === "size" ? 0 : 1,
  };
}

run();
