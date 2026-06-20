import assert from "node:assert/strict";

import { buildPrintHtml } from "./print-order";

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
  validatesPaperProfiles();
  validatesSimpleOrder();
  validatesGenericWholePizza();
  validatesGenericHalfAndHalf();
  validatesGenericPizzaWithBorder();
  validatesGenericBurger();
  validatesPizzaWithExtras();
  validatesDrink();
  validatesLongTextAndPriceStructure();
}

function validatesPaperProfiles() {
  const html80 = buildPrintHtml(baseOrder([genericItem([])]), printOptions80);
  const html58 = buildPrintHtml(baseOrder([genericItem([])]), printOptions58);

  assert.match(html80, /width: 74mm;/);
  assert.match(html80, /receipt-80mm/);
  assert.doesNotMatch(html80, /80mm auto/);

  assert.match(html58, /width: 50mm;/);
  assert.match(html58, /receipt-58mm/);
  assert.doesNotMatch(html58, /58mm auto/);

  for (const html of [html80, html58]) {
    assert.match(html, /@page\s*{\s*margin: 0;/);
    assert.doesNotMatch(html, /@page\s*{[^}]*size:/);
    assert.match(html, /Courier New/);
    assert.match(html, /line-height: 1\.4/);
    assert.match(html, /overflow-wrap: anywhere/);
    assert.match(html, /word-break: break-word/);
    assert.doesNotMatch(html, /overflow:\s*hidden/);
    assert.doesNotMatch(html, /(?:^|\n)\s*transform:/);
    assert.doesNotMatch(html, /(?:^|\n)\s*zoom:/);
    assert.doesNotMatch(html, /(?:^|\n)\s*display:\s*(flex|grid)/);
    assert.doesNotMatch(html, /(?:^|\n)\s*break-inside:\s*avoid/);
  }
}

function validatesSimpleOrder() {
  const html = buildPrintHtml(
    baseOrder([genericItem([], "Marmita executiva")]),
    printOptions80,
  );

  assert.match(html, /Marmita executiva/);
  assert.match(html, /class="item-price">R\$\s*48,00/);
}

function validatesGenericWholePizza() {
  const html = buildPrintHtml(
    baseOrder([
      genericItem([
        modifier("size", "Tamanho", "pizza_size", "30cm", 0),
        modifier("flavor", "Sabores", "pizza_flavor", "calabresa", 40),
      ]),
    ]),
    printOptions80,
  );

  assert.match(html, /Pizza calabresa/);
  assert.match(html, /Tamanho:/);
  assert.match(html, /- 30cm/);
  assert.match(html, /Sabores:/);
  assert.match(html, /- calabresa/);
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
    printOptions80,
  );

  assert.match(html, /- 1\/2 calabresa/);
  assert.match(html, /- 1\/2 mussarela/);
  assert.match(html, /Pizza 1\/2 calabresa \+ 1\/2 mussarela/);
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
    printOptions80,
  );

  assert.match(html, /Borda:/);
  assert.match(html, /- catupiry \(\+ R\$\s*8,00\)/);
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
    printOptions80,
  );

  assert.match(html, /Hamburguer artesanal/);
  assert.match(html, /Ponto da carne:/);
  assert.match(html, /- Ao ponto/);
  assert.match(html, /Queijos:/);
  assert.match(html, /- Cheddar \(\+ R\$\s*3,00\)/);
  assert.match(html, /Extras:/);
  assert.match(html, /- Bacon \(\+ R\$\s*5,00\)/);
}

function validatesPizzaWithExtras() {
  const item = genericItem(
    [
      modifier("size", "Tamanho", "pizza_size", "35cm", 0),
      modifier("flavor", "Sabores", "pizza_flavor", "Portuguesa", 45),
      modifier("border", "Borda", "pizza_border", "Catupiry", 8),
    ],
    "Pizza portuguesa especial",
  );
  item.notes = "Adicionais: Bacon, Cebola caramelizada";

  const html = buildPrintHtml(baseOrder([item]), printOptions58);

  assert.match(html, /Pizza Portuguesa/);
  assert.match(html, /Borda:/);
  assert.match(html, /Extras:/);
  assert.match(html, /Bacon/);
  assert.match(html, /Cebola caramelizada/);
}

function validatesDrink() {
  const html = buildPrintHtml(
    baseOrder([genericItem([], "Refrigerante lata 350ml")]),
    printOptions58,
  );

  assert.match(html, /Refrigerante lata 350ml/);
}

function validatesLongTextAndPriceStructure() {
  const order = baseOrder([
    genericItem(
      [],
      "Produto com nome muito longo que precisa quebrar sem ultrapassar a largura util do comprovante",
    ),
  ]);
  order.customerName =
    "Cliente com nome muito longo para validar quebra segura no papel termico";
  order.notes =
    "Observacao: texto muito longo sem risco de corte horizontal ou perda de conteudo";
  order.total = 123456.78;

  const html = buildPrintHtml(order, printOptions58);

  assert.match(html, /class="receipt receipt-58mm"/);
  assert.match(html, /class="item-price">R\$\s*48,00/);
  assert.match(html, /class="total-value">R\$\s*123\.456,78/);
  assert.match(html, /padding-right: 1mm/);
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
