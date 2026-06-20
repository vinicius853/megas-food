import { isLoadTestOrder } from "@/lib/order-external-effects";

import { getOrderDisplayNumber } from "./order-display-number";
import {
  normalizeOrderItemForDisplay,
  type NormalizedOrderItemForDisplay,
  type NormalizedOrderItemModifier,
} from "./order-item-display";

export type PrintPaperSize = "58mm" | "80mm";
type PrintMode = "customer" | "kitchen";

type PrintOrderOptions = {
  paperSize?: PrintPaperSize;
  mode?: PrintMode;
  autoClose?: boolean;
};

const typeLabels: Record<string, string> = {
  ONLINE: "ONLINE",
  TAKEAWAY: "RETIRADA",
  DELIVERY: "ENTREGA",
};

const paymentLabels: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CREDIT_CARD: "Cartão",
  DEBIT_CARD: "Cartão",
};

export function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function escapeHtml(value?: string | number | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanText(value?: string | number | null) {
  return String(value ?? "").trim();
}

function isFilled(value?: string | number | null) {
  return cleanText(value).length > 0 && cleanText(value) !== "-";
}

function shortOrderNumber(order: any) {
  return getOrderDisplayNumber(order);
}

function getStoreName(order: any) {
  return (
    order.tenant?.name ?? order.tenantName ?? order.storeName ?? "MEGAS FOOD"
  );
}

function parseNotes(notes?: string | null) {
  const result = {
    general: [] as string[],
    address: "",
    payment: "",
    cashPaid: "",
    change: "",
    couponCode: "",
    discountAmount: "",
  };

  const lines = cleanText(notes)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const normalized = line
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (normalized.startsWith("endereco:")) {
      result.address = line.slice(line.indexOf(":") + 1).trim();
      continue;
    }

    if (normalized.startsWith("pagamento:")) {
      result.payment = line.replace(/^pagamento:\s*/i, "").trim();
      continue;
    }

    if (normalized.startsWith("cliente vai pagar com:")) {
      result.cashPaid = line.replace(/^cliente vai pagar com:\s*/i, "").trim();
      continue;
    }

    if (normalized.startsWith("troco:")) {
      result.change = line.replace(/^troco:\s*/i, "").trim();
      continue;
    }

    if (normalized.startsWith("cupom:")) {
      result.couponCode = line.replace(/^cupom:\s*/i, "").trim();
      continue;
    }

    if (normalized.startsWith("desconto:")) {
      result.discountAmount = line.replace(/^desconto:\s*/i, "").trim();
      continue;
    }

    if (normalized.startsWith("taxa de entrega:")) {
      continue;
    }

    result.general.push(line);
  }

  return result;
}

function splitAddress(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const cepPart = parts.find((part) =>
    part
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .startsWith("cep:"),
  );
  const withoutCep = parts.filter((part) => part !== cepPart);
  const cityUf = withoutCep.at(-1) ?? "";
  const neighborhood = withoutCep.length >= 2 ? (withoutCep.at(-2) ?? "") : "";
  const streetLine = withoutCep.slice(0, -2).join(", ") || withoutCep[0] || "";

  return {
    streetLine,
    neighborhood,
    cityUf: cityUf.replace("/", " - "),
    cep: cepPart?.replace(/^cep:\s*/i, "") ?? "",
  };
}

function getCommercialItemName(item: any) {
  const normalized = normalizeOrderItemForDisplay(item);
  return normalized.name || "Produto";
}

function splitItemNotes(notes: unknown) {
  const lines = cleanText(String(notes ?? ""))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const additions: string[] = [];
  const otherNotes: string[] = [];
  let additionalParent = "";

  for (const line of lines) {
    if (/^adicionais:/i.test(line)) {
      additions.push(
        ...line
          .replace(/^adicionais:\s*/i, "")
          .split(",")
          .map((addition) => addition.trim())
          .filter(Boolean),
      );
      continue;
    }

    if (/^adicional de\s+/i.test(line)) {
      additionalParent = line.replace(/^adicional de\s+/i, "").trim();
      continue;
    }

    otherNotes.push(line);
  }

  return {
    additions,
    notes: otherNotes.join("\n"),
    additionalParent,
  };
}

export function line(char: string, width: number) {
  return char.slice(0, 1).repeat(width);
}

export function center(text: string, width: number) {
  const value = cleanText(text).slice(0, width);
  const leftPadding = Math.max(0, Math.floor((width - value.length) / 2));

  return `${" ".repeat(leftPadding)}${value}`;
}

export function leftRight(left: string, right: string, width: number) {
  const leftText = cleanText(left);
  const rightText = cleanText(right);
  const minimumGap = 1;
  const availableLeft = width - rightText.length - minimumGap;

  if (availableLeft < 1) {
    return [
      leftText.slice(0, width),
      rightText.slice(0, width).padStart(width),
    ];
  }

  const fittedLeft = leftText.slice(0, availableLeft);

  return [
    `${fittedLeft}${" ".repeat(width - fittedLeft.length - rightText.length)}${rightText}`,
  ];
}

export function money(value: string | number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function wrapText(text: string, width: number, indent = 0) {
  const prefix = " ".repeat(indent);
  const contentWidth = Math.max(1, width - indent);
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > contentWidth) {
      if (current) {
        lines.push(`${prefix}${current}`);
        current = "";
      }

      for (let index = 0; index < word.length; index += contentWidth) {
        lines.push(`${prefix}${word.slice(index, index + contentWidth)}`);
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length <= contentWidth) {
      current = candidate;
    } else {
      lines.push(`${prefix}${current}`);
      current = word;
    }
  }

  if (current) {
    lines.push(`${prefix}${current}`);
  }

  return lines.length > 0 ? lines : [prefix];
}

export function itemLine(
  quantity: number,
  description: string,
  value: string | number,
  width: number,
) {
  const quantityColumn = 4;
  const valueText = money(value);
  const valueColumn = Math.max(8, valueText.length);
  const descriptionWidth = width - quantityColumn - valueColumn;
  const descriptionLines = wrapText(description, descriptionWidth);

  return descriptionLines.map((descriptionLine, index) => {
    const quantityText = index === 0 ? String(quantity) : "";
    const priceText = index === 0 ? valueText : "";

    return `${quantityText.padEnd(quantityColumn)}${descriptionLine.padEnd(
      descriptionWidth,
    )}${priceText.padStart(valueColumn)}`;
  });
}

function formatReceiptDateTime(value: string) {
  const date = new Date(value);

  return {
    date: date.toLocaleDateString("pt-BR"),
    time: date.toLocaleTimeString("pt-BR"),
  };
}

function formatPhone(value?: string | null) {
  const digits = cleanText(value).replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return cleanText(value) || "NAO INFORMADO";
}

function formatModifierFraction(value?: number | null) {
  if (!value || value === 1) return "";
  if (value === 0.5) return "1/2 ";
  if (value === 0.33 || value === 0.333) return "1/3 ";
  if (value === 0.25) return "1/4 ";

  return `${value} `;
}

function modifierPrice(modifier: NormalizedOrderItemModifier) {
  return Number(modifier.totalDelta ?? 0) > 0
    ? ` (+ R$ ${money(modifier.totalDelta)})`
    : "";
}

function findGroup(normalized: NormalizedOrderItemForDisplay, codes: string[]) {
  return normalized.groups.find((group) =>
    codes.includes(group.groupCode ?? ""),
  );
}

function buildItemDescription(
  item: any,
  normalized: NormalizedOrderItemForDisplay,
) {
  const sizeGroup = findGroup(normalized, ["pizza_size", "size"]);
  const flavorGroup = findGroup(normalized, ["pizza_flavor", "flavor"]);
  const sizeName = sizeGroup?.options[0]?.optionName;
  const flavorCount = flavorGroup?.options.length ?? 0;

  if (sizeName && flavorCount > 0) {
    return `Pizza ${sizeName}${
      flavorCount > 1 ? ` (${flavorCount} Sabores)` : ""
    }`;
  }

  const itemName = getCommercialItemName(item);

  if (normalized.quantity > 1 && normalized.unitPrice > 0) {
    return `${itemName} (${normalized.quantity}x R$ ${money(
      normalized.unitPrice,
    )})`;
  }

  return itemName;
}

function buildModifierLines(
  normalized: NormalizedOrderItemForDisplay,
  width: number,
) {
  const result: string[] = [];

  for (const group of normalized.groups) {
    if (["pizza_size", "size"].includes(group.groupCode ?? "")) {
      continue;
    }

    for (const option of group.options) {
      const fraction = formatModifierFraction(option.fraction);
      const groupCode = group.groupCode ?? "";
      const prefix = ["pizza_flavor", "flavor"].includes(groupCode)
        ? ""
        : `${cleanText(group.groupName)}: `;

      result.push(
        ...wrapText(
          `- ${prefix}${fraction}${option.optionName}${modifierPrice(option)}`,
          width,
          6,
        ),
      );
    }
  }

  return result;
}

function buildAdditionalLines(
  item: any,
  width: number,
  linkedAdditionalItems: any[] = [],
) {
  const parsedNotes = splitItemNotes(item.notes);
  const embeddedAdditions = Array.isArray(item.additionals)
    ? item.additionals
        .map((addition: any) => ({
          name: cleanText(addition.name ?? addition),
          price: Number(addition.price ?? 0),
        }))
        .filter((addition: { name: string }) => addition.name)
    : parsedNotes.additions.map((name) => ({ name, price: 0 }));
  const additions = [
    ...embeddedAdditions,
    ...linkedAdditionalItems.map((additional) => ({
      name: getCommercialItemName(additional),
      price: Number(additional.total ?? additional.unitPrice ?? 0),
    })),
  ];
  const deduplicatedAdditions = new Map<
    string,
    { name: string; price: number }
  >();

  for (const addition of additions) {
    const key = normalizeComparisonText(addition.name);
    const existing = deduplicatedAdditions.get(key);

    if (!key) continue;

    if (!existing || addition.price > existing.price) {
      deduplicatedAdditions.set(key, addition);
    }
  }

  return [...deduplicatedAdditions.values()].flatMap(
    (addition: { name: string; price: number }) =>
      wrapText(
        `- Adicional: ${addition.name}${
          addition.price > 0 ? ` (+ R$ ${money(addition.price)})` : ""
        }`,
        width,
        6,
      ),
  );
}

function buildItemText(
  item: any,
  mode: PrintMode,
  width: number,
  linkedAdditionalItems: any[] = [],
) {
  const normalized = normalizeOrderItemForDisplay(item);
  const description = buildItemDescription(item, normalized);
  const parsedNotes = splitItemNotes(item.notes);
  const rows =
    mode === "customer"
      ? itemLine(normalized.quantity, description, normalized.total, width)
      : wrapText(`${normalized.quantity}   ${description}`, width);

  rows.push(...buildModifierLines(normalized, width));
  rows.push(...buildAdditionalLines(item, width, linkedAdditionalItems));

  if (isFilled(parsedNotes.notes)) {
    rows.push(...wrapText(`Obs: ${parsedNotes.notes}`, width, 6));
  }

  return rows;
}

function normalizeComparisonText(value: unknown) {
  return cleanText(String(value ?? ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function organizeReceiptItems(items: any[]) {
  const mainItems = items.filter(
    (item) => !splitItemNotes(item.notes).additionalParent,
  );
  const linkedAdditions = new Map<any, any[]>();

  for (const item of items) {
    const additionalParent = splitItemNotes(item.notes).additionalParent;

    if (!additionalParent) continue;

    const parent = mainItems.find(
      (candidate) =>
        normalizeComparisonText(candidate.name) ===
        normalizeComparisonText(additionalParent),
    );

    if (!parent) {
      mainItems.push(item);
      continue;
    }

    linkedAdditions.set(parent, [...(linkedAdditions.get(parent) ?? []), item]);
  }

  return {
    mainItems,
    linkedAdditions,
  };
}

function itemTableHeader(width: number) {
  const quantityColumn = 4;
  const valueColumn = 8;
  const descriptionColumn = width - quantityColumn - valueColumn;

  return `${"QTD".padEnd(quantityColumn)}${"DESCRIÇÃO".padEnd(
    descriptionColumn,
  )}${"VALOR".padStart(valueColumn)}`;
}

export function buildReceiptText(
  order: any,
  options: Required<PrintOrderOptions>,
) {
  const width = options.paperSize === "58mm" ? 32 : 48;
  const parsedNotes = parseNotes(order.notes);
  const orderType =
    typeLabels[order.type] ?? String(order.type ?? "").toUpperCase();
  const dateTime = formatReceiptDateTime(order.createdAt);
  const rows: string[] = [];

  rows.push(line("=", width));
  rows.push(
    ...wrapText(getStoreName(order).toUpperCase(), width).map((value) =>
      center(value, width),
    ),
  );
  rows.push(line("=", width));
  rows.push(
    ...leftRight(
      `${options.mode === "kitchen" ? "COMANDA" : "PEDIDO"} ${shortOrderNumber(order)}`,
      `${dateTime.date}  ${dateTime.time}`,
      width,
    ),
  );
  rows.push(center(`*** ${orderType} ***`, width));
  rows.push(line("-", width));
  rows.push(
    ...wrapText(
      `CLIENTE: ${cleanText(order.customerName).toUpperCase() || "NÃO INFORMADO"}`,
      width,
    ),
  );

  if (options.mode === "customer") {
    rows.push(...wrapText(`FONE: ${formatPhone(order.customerPhone)}`, width));
  }

  if (options.mode === "customer" && order.type === "DELIVERY") {
    const address = splitAddress(parsedNotes.address);

    if (
      address.streetLine ||
      address.neighborhood ||
      address.cityUf ||
      address.cep
    ) {
      rows.push("");
      rows.push("ENDEREÇO:");
      if (address.streetLine) {
        rows.push(...wrapText(address.streetLine, width));
      }
      if (address.neighborhood || address.cityUf) {
        rows.push(
          ...wrapText(
            [address.neighborhood, address.cityUf].filter(Boolean).join(", "),
            width,
          ),
        );
      }
      if (address.cep) {
        rows.push(`CEP: ${address.cep}`);
      }
    }
  }

  rows.push(line("-", width));

  if (options.mode === "customer") {
    rows.push(itemTableHeader(width));
  } else {
    rows.push("QTD DESCRIÇÃO");
  }

  rows.push(line("-", width));

  const items = Array.isArray(order.items) ? order.items : [];
  const organizedItems = organizeReceiptItems(items);

  organizedItems.mainItems.forEach((item: any, index: number) => {
    rows.push(
      ...buildItemText(
        item,
        options.mode,
        width,
        organizedItems.linkedAdditions.get(item) ?? [],
      ),
    );
    if (index < organizedItems.mainItems.length - 1) rows.push("");
  });

  if (options.mode === "customer") {
    rows.push(line("-", width));
    rows.push(...leftRight("SUBTOTAL", `R$ ${money(order.subtotal)}`, width));

    const discount =
      Number(order.discountAmount ?? 0) ||
      Number(
        String(parsedNotes.discountAmount)
          .replace(/[^\d,.-]/g, "")
          .replace(",", "."),
      );

    if (discount > 0) {
      rows.push(...leftRight("DESCONTO", `- R$ ${money(discount)}`, width));
    }

    rows.push(
      ...leftRight("TAXA DE ENTREGA", `R$ ${money(order.deliveryFee)}`, width),
    );
    rows.push(line("=", width));
    rows.push(...leftRight("TOTAL", `R$ ${money(order.total)}`, width));
    rows.push(line("=", width));

    const payment =
      parsedNotes.payment ||
      paymentLabels[order.paymentType] ||
      cleanText(order.paymentType);

    if (payment) {
      rows.push(`PAGAMENTO: ${payment.toUpperCase()}`);
    }
    if (parsedNotes.cashPaid) {
      rows.push(`TROCO PARA: ${parsedNotes.cashPaid}`);
    }
    if (parsedNotes.change) {
      rows.push(`TROCO: ${parsedNotes.change}`);
    }
  }

  if (parsedNotes.general.length > 0) {
    rows.push("");
    parsedNotes.general.forEach((note) => {
      rows.push(...wrapText(`Obs: ${note}`, width));
    });
  }

  rows.push("");
  rows.push(center("Sistema Megas Food", width));

  return rows.join("\n");
}

export function buildPrintHtml(
  order: any,
  options: Required<PrintOrderOptions>,
) {
  const receiptWidth = options.paperSize === "58mm" ? "50mm" : "74mm";
  const receiptText = buildReceiptText(order, options);

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <title>${options.mode === "kitchen" ? "Comanda cozinha" : "Comprovante"}</title>

        <style>
          @page {
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 100%;
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff;
            font-family: "Courier New", Consolas, monospace;
            font-size: ${options.paperSize === "58mm" ? "10.5px" : "12px"};
            font-weight: 600;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .receipt {
            display: block;
            width: ${receiptWidth};
            max-width: ${receiptWidth};
            margin: 0 auto;
            padding: ${options.paperSize === "58mm" ? "2mm 0" : "2.5mm 0"};
            white-space: pre;
            overflow: visible;
          }

          @media print {
            html,
            body {
              width: 100%;
            }
          }
        </style>
      </head>

      <body>
        <pre class="receipt receipt-${options.paperSize}">${escapeHtml(receiptText)}</pre>
      </body>
    </html>
  `;
}

export function printOrder(order: any, options?: PrintOrderOptions) {
  if (isLoadTestOrder(order)) {
    alert("Impressao desativada para pedido de teste de carga.");
    return;
  }

  const finalOptions: Required<PrintOrderOptions> = {
    paperSize: options?.paperSize ?? "80mm",
    mode: options?.mode ?? "customer",
    autoClose: options?.autoClose ?? false,
  };

  const printWindow = window.open("", "", "width=420,height=720");

  if (!printWindow) {
    alert("Nao foi possivel abrir impressao.");
    return;
  }

  printWindow.document.write(buildPrintHtml(order, finalOptions));
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();

      if (finalOptions.autoClose) {
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }
    }, 300);
  };
}
