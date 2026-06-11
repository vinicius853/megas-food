import assert from "node:assert/strict";

import { buildPrintHtml } from "./print-order";

const printOptions = {
  paperSize: "80mm" as const,
  mode: "customer" as const,
  autoClose: false,
};

function run() {
  validatesGenericWholePizza();
  validatesGenericHalfAndHalf();
  validatesGenericPizzaWithBorder();
  validatesGenericBurger();
}

function validatesGenericWholePizza() {
  const html = buildPrintHtml(
    baseOrder([
      genericItem([
        modifier("size", "Tamanho", "pizza_size", "30cm", 0),
        modifier("flavor", "Sabores", "pizza_flavor", "calabresa", 40),
      ]),
    ]),
    printOptions,
  );

  assert.match(html, /Pizza redonda/);
  assert.match(html, /Tamanho:/);
  assert.match(html, /\* 30cm/);
  assert.match(html, /Sabores:/);
  assert.match(html, /\* calabresa/);
}

function validatesGenericHalfAndHalf() {
  const html = buildPrintHtml(
    baseOrder([
      genericItem([
        modifier("size", "Tamanho", "pizza_size", "30cm", 0),
        modifier("flavor-1", "Sabores", "pizza_flavor", "calabresa", 40, 0.5),
        modifier("flavor-2", "Sabores", "pizza_flavor", "mussarela", 0, 0.5),
      ]),
    ]),
    printOptions,
  );

  assert.match(html, /\* 1\/2 calabresa/);
  assert.match(html, /\* 1\/2 mussarela/);
}

function validatesGenericPizzaWithBorder() {
  const html = buildPrintHtml(
    baseOrder([
      genericItem([
        modifier("size", "Tamanho", "pizza_size", "30cm", 0),
        modifier("flavor", "Sabores", "pizza_flavor", "calabresa", 40),
        modifier("border", "Borda", "pizza_border", "catupiry", 8),
      ]),
    ]),
    printOptions,
  );

  assert.match(html, /Borda:/);
  assert.match(html, /\* catupiry \(\+ R\$\s*8,00\)/);
}

function validatesGenericBurger() {
  const html = buildPrintHtml(
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
    printOptions,
  );

  assert.match(html, /Hamburguer artesanal/);
  assert.match(html, /Ponto da carne:/);
  assert.match(html, /\* Ao ponto/);
  assert.match(html, /Queijos:/);
  assert.match(html, /\* Cheddar \(\+ R\$\s*3,00\)/);
  assert.match(html, /Extras:/);
  assert.match(html, /\* Bacon \(\+ R\$\s*5,00\)/);
}

function baseOrder(items: any[]) {
  return {
    id: "order-1",
    displayNumber: "123",
    customerName: "Cliente",
    customerPhone: "11999999999",
    type: "DELIVERY",
    status: "PENDING",
    subtotal: 48,
    deliveryFee: 0,
    total: 48,
    notes: "",
    createdAt: "2026-06-03T12:00:00.000Z",
    items,
  };
}

function genericItem(modifiers: any[], name = "Pizza redonda") {
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
) {
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
