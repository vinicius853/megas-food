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
  CREDIT_CARD: "Cartao",
  DEBIT_CARD: "Cartao",
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
      result.address = line.replace(/^endere[cç]o:\s*/i, "").trim();
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

function formatModifierFraction(value?: number | null) {
  if (!value || value === 1) return "";

  if (value === 0.5) return "1/2 ";
  if (value === 0.33 || value === 0.333) return "1/3 ";
  if (value === 0.25) return "1/4 ";

  return `${value} `;
}

function formatModifierPrice(
  modifier: NormalizedOrderItemModifier,
  showPrice: boolean,
) {
  if (!showPrice || Number(modifier.totalDelta ?? 0) <= 0) {
    return "";
  }

  return ` (+ ${formatMoney(modifier.totalDelta)})`;
}

function buildNormalizedGroupsHtml(
  normalized: NormalizedOrderItemForDisplay,
  showPrice: boolean,
) {
  if (!normalized.groups.length) return "";

  return normalized.groups
    .map((group) => {
      const optionsHtml = group.options
        .map((option) => {
          const fraction = formatModifierFraction(option.fraction);
          const price = formatModifierPrice(option, showPrice);

          return `
            <div class="item-detail">- ${escapeHtml(fraction)}${escapeHtml(option.optionName)}${escapeHtml(price)}</div>
          `;
        })
        .join("");

      return `
        <div class="item-detail-title">${escapeHtml(group.groupName)}:</div>
        ${optionsHtml}
      `;
    })
    .join("");
}

function buildAdditionsHtml(item: any) {
  const parsedNotes = splitItemNotes(item.notes);
  const additions = Array.isArray(item.additionals)
    ? item.additionals
        .map((addition: any) => cleanText(addition.name ?? addition))
        .filter(Boolean)
    : parsedNotes.additions;

  if (!additions.length) return "";

  return `
    <div class="item-detail-title">Extras:</div>
    ${additions
      .map(
        (addition: string) => `
          <div class="item-detail">- ${escapeHtml(addition)}</div>
        `,
      )
      .join("")}
  `;
}

function splitItemNotes(notes: unknown) {
  const lines = cleanText(String(notes ?? ""))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const additions: string[] = [];
  const otherNotes: string[] = [];

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
      continue;
    }

    otherNotes.push(line);
  }

  return {
    additions,
    notes: otherNotes.join("\n"),
  };
}

function buildItemHtml(item: any, mode: PrintMode) {
  const normalized = normalizeOrderItemForDisplay(item);
  const itemName = getCommercialItemName(item);
  const showPrice = mode === "customer";
  const parsedNotes = splitItemNotes(item.notes);

  return `
    <div class="item">
      <div class="item-head">
        <span>${escapeHtml(normalized.quantity)}x ${escapeHtml(itemName)}</span>
      </div>

      ${buildNormalizedGroupsHtml(normalized, showPrice)}

      ${
        showPrice
          ? `
            <div class="item-price">${formatMoney(item.total)}</div>
          `
          : ""
      }

      ${buildAdditionsHtml(item)}

      ${
        isFilled(parsedNotes.notes)
          ? `<div class="item-detail note-line item-note">Obs: ${escapeHtml(parsedNotes.notes)}</div>`
          : ""
      }
    </div>
  `;
}

function buildItemsHtml(order: any, mode: PrintMode) {
  return (order.items ?? [])
    .map((item: any) => buildItemHtml(item, mode))
    .join("");
}

function buildAddressHtml(
  order: any,
  parsedNotes: ReturnType<typeof parseNotes>,
) {
  if (order.type !== "DELIVERY") return "";

  const address = splitAddress(parsedNotes.address);

  if (
    !address.streetLine &&
    !address.neighborhood &&
    !address.cityUf &&
    !address.cep
  ) {
    return "";
  }

  return `
    <div class="dash"></div>
    <div class="section-title">ENDERECO</div>
    ${address.streetLine ? `<p>${escapeHtml(address.streetLine)}</p>` : ""}
    ${address.neighborhood ? `<p>${escapeHtml(address.neighborhood)}</p>` : ""}
    ${address.cityUf ? `<p>${escapeHtml(address.cityUf)}</p>` : ""}
    ${address.cep ? `<p>CEP: ${escapeHtml(address.cep)}</p>` : ""}
  `;
}

function buildPaymentHtml(
  order: any,
  parsedNotes: ReturnType<typeof parseNotes>,
) {
  const payment =
    parsedNotes.payment ||
    paymentLabels[order.paymentType] ||
    cleanText(order.paymentType);

  if (!payment) return "";

  return `
    <div class="dash"></div>
    <p class="payment-line">Pagamento: <strong>${escapeHtml(payment)}</strong></p>
    ${
      parsedNotes.cashPaid
        ? `<p class="payment-line">Troco para: <strong>${escapeHtml(parsedNotes.cashPaid)}</strong></p>`
        : ""
    }
    ${
      parsedNotes.change
        ? `<p class="payment-line">Troco: <strong>${escapeHtml(parsedNotes.change)}</strong></p>`
        : ""
    }
  `;
}

export function buildPrintHtml(
  order: any,
  options: Required<PrintOrderOptions>,
) {
  const isKitchen = options.mode === "kitchen";
  const paperWidth = options.paperSize === "58mm" ? "58mm" : "80mm";
  const receiptWidth = options.paperSize === "58mm" ? "50mm" : "74mm";
  const parsedNotes = parseNotes(order.notes);
  const orderType =
    typeLabels[order.type] ?? String(order.type ?? "").toUpperCase();

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <title>${isKitchen ? "Comanda cozinha" : "Comprovante"}</title>

        <style>
          @page {
            size: ${paperWidth};
            margin: 0;
          }

          * {
            box-sizing: border-box;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          html,
          body {
            width: 100%;
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff;
            font-family: "Courier New", Consolas, monospace;
            font-size: ${options.paperSize === "58mm" ? "10px" : "12px"};
            font-weight: 600;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .receipt {
            width: ${receiptWidth};
            max-width: ${receiptWidth};
            margin: 0 auto;
            padding: ${options.paperSize === "58mm" ? "2mm 0" : "2.5mm 0"};
          }

          h1, h2, h3, p {
            margin: 0;
            padding: 0;
          }

          .center {
            text-align: center;
          }

          .store {
            font-size: ${options.paperSize === "58mm" ? "12px" : "15px"};
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0;
            line-height: 1.3;
          }

          .dash {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }

          .equals {
            border-top: 1px solid #000;
            margin: 7px 0 5px;
          }

          .order-number {
            margin: 5px 0 4px;
            padding: 3px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            font-size: ${options.paperSize === "58mm" ? "15px" : "18px"};
            font-weight: 700;
            line-height: 1.3;
            text-align: center;
          }

          .section-title {
            margin-bottom: 4px;
            font-size: ${options.paperSize === "58mm" ? "11px" : "13px"};
            font-weight: 700;
            text-transform: uppercase;
          }

          .item {
            margin-bottom: 6px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #000;
          }

          .item:last-child {
            border-bottom: 0;
          }

          .item-head {
            font-size: ${options.paperSize === "58mm" ? "11px" : "13px"};
            font-weight: 700;
            line-height: 1.35;
          }

          .item-price {
            width: 100%;
            margin-top: 2px;
            padding-right: 1mm;
            font-weight: 700;
            line-height: 1.35;
            text-align: right;
          }

          .item-detail {
            margin-top: 1px;
            padding-left: 10px;
            font-size: ${options.paperSize === "58mm" ? "10px" : "12px"};
            font-weight: 500;
          }

          .item-detail-title {
            margin-top: 3px;
            padding-left: 0;
            font-size: ${options.paperSize === "58mm" ? "10px" : "12px"};
            font-weight: 700;
          }

          .note-line {
            margin-top: 4px;
            padding: 3px;
            border: 1px solid #000;
            font-size: ${options.paperSize === "58mm" ? "11px" : "13px"};
            font-weight: 700;
          }

          .item-note {
            padding-left: 4px;
          }

          .payment-line {
            margin-top: 3px;
            font-size: ${options.paperSize === "58mm" ? "11px" : "13px"};
            font-weight: 600;
          }

          .total-label {
            text-align: center;
            font-size: ${options.paperSize === "58mm" ? "12px" : "15px"};
            font-weight: 700;
          }

          .total-value {
            margin-top: 3px;
            padding: 3px 1mm 3px 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            font-size: ${options.paperSize === "58mm" ? "16px" : "19px"};
            font-weight: 700;
            line-height: 1.3;
            text-align: right;
          }

          .footer {
            margin-top: 7px;
            text-align: center;
            font-size: ${options.paperSize === "58mm" ? "9px" : "11px"};
            font-weight: 500;
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
        <main class="receipt receipt-${options.paperSize}">
          <div class="center">
            <div class="store">${escapeHtml(getStoreName(order))}</div>
          </div>

          <div class="order-number">
            ${isKitchen ? "COMANDA " : "PEDIDO "}${escapeHtml(shortOrderNumber(order))}
          </div>

          <p>Data/hora: ${escapeHtml(formatDateTime(order.createdAt))}</p>
          <p>${escapeHtml(orderType)}</p>

          <div class="dash"></div>
          <p>Cliente: ${escapeHtml(cleanText(order.customerName).toUpperCase() || "NAO INFORMADO")}</p>
          ${
            !isKitchen
              ? `<p>Telefone: ${escapeHtml(order.customerPhone || "NAO INFORMADO")}</p>`
              : ""
          }

          ${!isKitchen ? buildAddressHtml(order, parsedNotes) : ""}

          <div class="dash"></div>
          <div class="section-title">ITENS</div>

          ${buildItemsHtml(order, options.mode)}

          ${
            parsedNotes.general.length
              ? `
              <div class="dash"></div>
              <div class="section-title">OBSERVACOES</div>
              ${parsedNotes.general
                .map(
                  (line: string) =>
                    `<p class="note-line">${escapeHtml(line)}</p>`,
                )
                .join("")}
              `
              : ""
          }

          ${
            !isKitchen
              ? `
              <div class="dash"></div>
              ${
                order.couponCode || parsedNotes.couponCode
                  ? `<p>Cupom: ${escapeHtml(order.couponCode ?? parsedNotes.couponCode)}</p>`
                  : ""
              }
              ${
                Number(order.discountAmount ?? 0) > 0 ||
                parsedNotes.discountAmount
                  ? `<p>Desconto: -${formatMoney(
                      order.discountAmount ??
                        String(parsedNotes.discountAmount)
                          .replace(/[^\d,.-]/g, "")
                          .replace(",", "."),
                    )}</p>`
                  : ""
              }
              <p>Taxa entrega: ${formatMoney(order.deliveryFee)}</p>

              <div class="equals"></div>
              <div class="total-label">TOTAL</div>
              <div class="total-value">${formatMoney(order.total)}</div>

              ${buildPaymentHtml(order, parsedNotes)}

              <div class="footer">
                <div>Sistema Megas Food</div>
              </div>
              `
              : `
              <div class="footer">
                <div>Conferir itens antes de finalizar</div>
                <div>Sistema Megas Food</div>
              </div>
              `
          }
        </main>
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
