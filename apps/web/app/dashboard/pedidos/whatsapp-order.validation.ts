import assert from "node:assert/strict";

import { buildWhatsAppMessage } from "./whatsapp-order";
import type { OrderItem, OrderItemModifier } from "./types";

function run() {
  validatesGenericWholePizza();
  validatesGenericHalfAndHalf();
  validatesGenericPizzaWithBorder();
  validatesGenericBurger();
}

function validatesGenericWholePizza() {
  const message = buildWhatsAppMessage(
    baseOrder([
      genericItem([
        modifier("size", "Tamanho", "pizza_size", "30cm", 0),
        modifier("flavor", "Sabores", "pizza_flavor", "calabresa", 40),
      ]),
    ]),
  );

  assert.match(message, /Pizza redonda/);
  assert.match(message, /Tamanho:/);
  assert.match(message, /\* 30cm/);
  assert.match(message, /Sabores:/);
  assert.match(message, /\* calabresa/);
}

function validatesGenericHalfAndHalf() {
  const message = buildWhatsAppMessage(
    baseOrder([
      genericItem([
        modifier("size", "Tamanho", "pizza_size", "30cm", 0),
        modifier("flavor-1", "Sabores", "pizza_flavor", "calabresa", 40, 0.5),
        modifier("flavor-2", "Sabores", "pizza_flavor", "mussarela", 0, 0.5),
      ]),
    ]),
  );

  assert.match(message, /\* 1\/2 calabresa/);
  assert.match(message, /\* 1\/2 mussarela/);
}

function validatesGenericPizzaWithBorder() {
  const message = buildWhatsAppMessage(
    baseOrder([
      genericItem([
        modifier("size", "Tamanho", "pizza_size", "30cm", 0),
        modifier("flavor", "Sabores", "pizza_flavor", "calabresa", 40),
        modifier("border", "Borda", "pizza_border", "catupiry", 8),
      ]),
    ]),
  );

  assert.match(message, /Borda:/);
  assert.match(message, /\* catupiry \(\+ R\$\s*8,00\)/);
}

function validatesGenericBurger() {
  const message = buildWhatsAppMessage(
    baseOrder([
      genericItem(
        [
          modifier("point", "Ponto da carne", "ponto_carne", "Ao ponto", 0),
          modifier("cheese", "Queijos", "queijos", "Cheddar", 3),
          modifier("extra", "Extras", "extras", "Bacon", 5),
        ],
        "Hamburguer artesanal",
      ),
    ]),
  );

  assert.match(message, /Hamburguer artesanal/);
  assert.match(message, /Ponto da carne:/);
  assert.match(message, /\* Ao ponto/);
  assert.match(message, /Queijos:/);
  assert.match(message, /\* Cheddar \(\+ R\$\s*3,00\)/);
  assert.match(message, /Extras:/);
  assert.match(message, /\* Bacon \(\+ R\$\s*5,00\)/);
}

function baseOrder(items: OrderItem[]) {
  return {
    customerName: "Cliente",
    customerPhone: "11999999999",
    type: "DELIVERY" as const,
    status: "CONFIRMED" as const,
    total: 48,
    items,
  };
}

function genericItem(
  modifiers: OrderItemModifier[],
  name = "Pizza redonda",
): OrderItem {
  return {
    id: "item-v2",
    name,
    quantity: 1,
    unitPrice: 48,
    total: 48,
    notes: "",
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
