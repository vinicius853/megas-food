import assert from "node:assert/strict";

import {
  buildPrintHtml,
  buildReceiptText,
  center,
  itemLine,
  leftRight,
  line,
  money,
  wrapText,
} from "./print-order";

const printOptions80 = {
  paperSize: "80mm" as const,
  mode: "customer" as const,
  autoClose: false,
};

const printOptions58 = {
  ...printOptions80,
  paperSize: "58mm" as const,
};

function run() {
  validatesTextHelpers();
  validatesPaperProfiles();
  validatesProfessionalReceiptLayout();
  validatesConfiguredPizzaAndIndentedModifiers();
  validatesAdditionalDeduplicationPrefersPrice();
  validatesAdditionalWithoutPriceIsPreserved();
  validatesSimpleProductsAndGroupedQuantity();
  validatesTotalsAlignment();
  validatesTechnicalNotesAreHidden();
  validatesRealCustomerObservation();
}

function validatesTextHelpers() {
  assert.equal(line("=", 5), "=====");
  assert.equal(center("LOJA", 10), "   LOJA");
  assert.deepEqual(leftRight("TOTAL", "R$ 10,00", 20), [
    "TOTAL       R$ 10,00",
  ]);
  assert.equal(money(1234.5), "1.234,50");
  assert.deepEqual(wrapText("produto com nome longo", 14, 2), [
    "  produto com",
    "  nome longo",
  ]);
  const itemRow = itemLine(2, "Guaravita", 8, 32)[0];
  assert.equal(itemRow.length, 32);
  assert.match(itemRow, /^2\s+Guaravita/);
  assert.match(itemRow, /8,00$/);
}

function validatesPaperProfiles() {
  const html80 = buildPrintHtml(receiptOrder(), printOptions80);
  const html58 = buildPrintHtml(receiptOrder(), printOptions58);

  assert.match(html80, /class="receipt receipt-80mm"/);
  assert.match(html80, /width: 74mm;/);
  assert.match(html58, /class="receipt receipt-58mm"/);
  assert.match(html58, /width: 50mm;/);

  for (const html of [html80, html58]) {
    assert.match(html, /<pre class="receipt/);
    assert.match(html, /Courier New/);
    assert.match(html, /white-space: pre/);
    assert.doesNotMatch(html, /class="item-/);
    assert.doesNotMatch(html, /display:\s*(flex|grid)/);
  }
}

function validatesProfessionalReceiptLayout() {
  const text = buildReceiptText(receiptOrder(), printOptions80);
  const rows = text.split("\n");

  assert.equal(rows[0], "=".repeat(48));
  assert.equal(rows[2], "=".repeat(48));
  assert.match(rows[1], /^\s+DEMONSTRAÇÃO MEGAS FOOD$/);
  assert.match(rows[3], /^PEDIDO #57\s+19\/06\/2026\s+21:30:11$/);
  assert.match(rows[4], /^\s+\*\*\* ENTREGA \*\*\*$/);
  assert.match(text, /CLIENTE: VINICIUS DE SOUZA/);
  assert.match(text, /FONE: \(24\) 99850-8308/);
  assert.match(text, /ENDEREÇO:/);
  assert.match(text, /Rua Presidente Tancredo Neves, 1105/);
  assert.match(text, /Vista Alegre, Barra Mansa - RJ/);
  assert.match(text, /CEP: 27320-360/);
  assert.match(text, /QTD DESCRIÇÃO\s+VALOR/);
}

function validatesConfiguredPizzaAndIndentedModifiers() {
  const text = buildReceiptText(receiptOrder(), printOptions80);

  assert.match(text, /^1\s+Pizza 40cm \(4 Sabores\)\s+75,00$/m);
  assert.match(text, /^ {6}- 1\/4 Queijo e Presunto$/m);
  assert.match(text, /^ {6}- 1\/4 Lombo Canadense \(\+ R\$ 60,00\)$/m);
  assert.match(text, /^ {6}- 1\/4 Peperone$/m);
  assert.match(text, /^ {6}- 1\/4 Calabresa$/m);
  assert.match(text, /^ {6}- Borda: Cream Cheese \(\+ R\$ 15,00\)$/m);
  assert.match(text, /^ {6}- Adicional: Palmito \(\+ R\$ 5,00\)$/m);
  assert.match(text, /^ {6}- Adicional: Cheddar \(\+ R\$ 5,00\)$/m);
}

function validatesAdditionalDeduplicationPrefersPrice() {
  const order = receiptOrder();
  order.items[0].notes = "Adicionais: Palmito, Cheddar";
  const text = buildReceiptText(order, printOptions80);

  assert.equal((text.match(/Adicional: Palmito/g) ?? []).length, 1);
  assert.equal((text.match(/Adicional: Cheddar/g) ?? []).length, 1);
  assert.match(text, /Adicional: Palmito \(\+ R\$ 5,00\)/);
  assert.match(text, /Adicional: Cheddar \(\+ R\$ 5,00\)/);
  assert.doesNotMatch(text, /Adicional: Palmito\s*$/m);
  assert.doesNotMatch(text, /Adicional: Cheddar\s*$/m);
}

function validatesAdditionalWithoutPriceIsPreserved() {
  const order = receiptOrder();
  order.items[0].notes = "Adicionais: Ovos";
  const text = buildReceiptText(order, printOptions80);

  assert.equal((text.match(/Adicional: Ovos/g) ?? []).length, 1);
  assert.match(text, /^ {6}- Adicional: Ovos$/m);
}

function validatesSimpleProductsAndGroupedQuantity() {
  const text = buildReceiptText(receiptOrder(), printOptions80);

  assert.match(text, /^1\s+Coca Cola Zero 2L\s+14,00$/m);
  assert.match(text, /^2\s+Guaravita \(2x R\$ 4,00\)\s+8,00$/m);
}

function validatesTotalsAlignment() {
  const text = buildReceiptText(receiptOrder(), printOptions80);
  const rows = text.split("\n");
  const subtotal = rows.find((row) => row.startsWith("SUBTOTAL"));
  const delivery = rows.find((row) => row.startsWith("TAXA DE ENTREGA"));
  const total = rows.find((row) => row.startsWith("TOTAL"));

  assert.equal(subtotal?.length, 48);
  assert.equal(delivery?.length, 48);
  assert.equal(total?.length, 48);
  assert.match(subtotal ?? "", /R\$ 107,00$/);
  assert.match(delivery ?? "", /R\$ 3,00$/);
  assert.match(total ?? "", /R\$ 110,00$/);
  assert.match(text, /=+\nTOTAL\s+R\$ 110,00\n=+/);
  assert.match(text, /PAGAMENTO: PIX/);
}

function validatesTechnicalNotesAreHidden() {
  const order = receiptOrder();
  const text = buildReceiptText(order, printOptions80);

  assert.doesNotMatch(text, /Adicional de Nova pizza redonda/i);
  assert.doesNotMatch(text, /V2_GENERIC|dependsOnOptionId|groupCode/);
  assert.equal((text.match(/Palmito/g) ?? []).length, 1);
  assert.equal((text.match(/Cheddar/g) ?? []).length, 1);
}

function validatesRealCustomerObservation() {
  const order = receiptOrder();
  order.items[0].notes = "Sem cebola";
  const text = buildReceiptText(order, printOptions80);

  assert.match(text, /^ {6}Obs: Sem cebola$/m);
}

function receiptOrder() {
  return {
    id: "order-57",
    displayNumber: "57",
    tenantName: "Demonstração Megas Food",
    customerName: "Vinicius de Souza",
    customerPhone: "24998508308",
    type: "DELIVERY",
    status: "PENDING",
    subtotal: 107,
    deliveryFee: 3,
    total: 110,
    paymentType: "PIX",
    notes:
      "Endereço: Rua Presidente Tancredo Neves, 1105, Vista Alegre, Barra Mansa/RJ, CEP: 27320-360",
    createdAt: "2026-06-20T00:30:11.000Z",
    items: [
      {
        id: "pizza",
        name: "Nova pizza redonda",
        quantity: 1,
        unitPrice: 75,
        total: 75,
        notes: "",
        modifiers: [
          modifier("size", "Tamanho", "pizza_size", "40cm", 0),
          modifier(
            "flavor-1",
            "Sabores",
            "pizza_flavor",
            "Queijo e Presunto",
            0,
            0.25,
          ),
          modifier(
            "flavor-2",
            "Sabores",
            "pizza_flavor",
            "Lombo Canadense",
            60,
            0.25,
          ),
          modifier("flavor-3", "Sabores", "pizza_flavor", "Peperone", 0, 0.25),
          modifier("flavor-4", "Sabores", "pizza_flavor", "Calabresa", 0, 0.25),
          modifier("border", "Borda", "pizza_border", "Cream Cheese", 15),
        ],
      },
      {
        ...simpleItem("palmito", "Palmito", 1, 5, 5),
        notes: "Adicional de Nova pizza redonda",
      },
      {
        ...simpleItem("cheddar", "Cheddar", 1, 5, 5),
        notes: "Adicional de Nova pizza redonda",
      },
      simpleItem("coca", "Coca Cola Zero 2L", 1, 14, 14),
      simpleItem("guaravita", "Guaravita", 2, 4, 8),
    ],
  };
}

function simpleItem(
  id: string,
  name: string,
  quantity: number,
  unitPrice: number,
  total: number,
) {
  return {
    id,
    name,
    quantity,
    unitPrice,
    total,
    notes: "",
    modifiers: [],
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
