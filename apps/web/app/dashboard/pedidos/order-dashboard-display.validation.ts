import assert from "node:assert/strict";

import { normalizeOrderItemForDisplay } from "./order-item-display";
import type { OrderItem, OrderItemModifier } from "./types";

function run() {
  validatesGenericWholePizza();
  validatesGenericHalfAndHalf();
  validatesGenericPizzaWithBorder();
  validatesGenericBurger();
}

function validatesGenericWholePizza() {
  const lines = displayLines(
    genericItem([
      modifier("size", "Tamanho", "pizza_size", "30cm", 0),
      modifier("flavor", "Sabores", "pizza_flavor", "calabresa", 40),
    ]),
  );

  assertLineMatches(lines, /\* calabresa \(\+ R\$\s*40,00\)/);
}

function validatesGenericHalfAndHalf() {
  const lines = displayLines(
    genericItem([
      modifier("size", "Tamanho", "pizza_size", "30cm", 0),
      modifier("flavor-1", "Sabores", "pizza_flavor", "calabresa", 40, 0.5),
      modifier("flavor-2", "Sabores", "pizza_flavor", "mussarela", 0, 0.5),
    ]),
  );

  assertLineMatches(lines, /\* 1\/2 calabresa \(\+ R\$\s*40,00\)/);
  assert(lines.includes("* 1/2 mussarela"));
}

function validatesGenericPizzaWithBorder() {
  const lines = displayLines(
    genericItem([
      modifier("size", "Tamanho", "pizza_size", "30cm", 0),
      modifier("flavor", "Sabores", "pizza_flavor", "calabresa", 40),
      modifier("border", "Borda", "pizza_border", "catupiry", 8),
    ]),
  );

  assert(lines.includes("Borda:"));
  assertLineMatches(lines, /\* catupiry \(\+ R\$\s*8,00\)/);
}

function validatesGenericBurger() {
  const lines = displayLines(
    genericItem(
      [
        modifier("point", "Ponto da carne", "ponto_carne", "Ao ponto", 0),
        modifier("cheese", "Queijos", "queijos", "Cheddar", 3),
        modifier("extra", "Extras", "extras", "Bacon", 5),
      ],
      "Hamburguer artesanal",
    ),
  );

  assert(lines.includes("1x Hamburguer artesanal"));
  assert(lines.includes("Ponto da carne:"));
  assert(lines.includes("* Ao ponto"));
  assertLineMatches(lines, /\* Cheddar \(\+ R\$\s*3,00\)/);
  assertLineMatches(lines, /\* Bacon \(\+ R\$\s*5,00\)/);
}

function assertLineMatches(lines: string[], pattern: RegExp) {
  assert(
    lines.some((line) => pattern.test(line)),
    `Expected a line matching ${pattern}, got:\n${lines.join("\n")}`,
  );
}

function displayLines(item: OrderItem) {
  const normalized = normalizeOrderItemForDisplay(item);
  const lines = [`${normalized.quantity}x ${normalized.name}`];

  for (const group of normalized.groups) {
    lines.push(`${group.groupName}:`);

    for (const option of group.options) {
      lines.push(
        `* ${formatFraction(option.fraction)}${option.optionName}${formatDelta(option.totalDelta)}`,
      );
    }
  }

  lines.push(`Total: ${formatMoney(normalized.total)}`);

  return lines;
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

function formatFraction(value?: number | null) {
  if (!value || value === 1) return "";
  if (value === 0.5) return "1/2 ";
  return `${value} `;
}

function formatDelta(value: number) {
  return value > 0 ? ` (+ ${formatMoney(value)})` : "";
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

run();
