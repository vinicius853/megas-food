import { getOrderDisplayNumber } from "./order-display-number";
import {
  normalizeOrderItemForDisplay,
  type NormalizedOrderItemForDisplay,
  type NormalizedOrderItemModifier,
} from "./order-item-display";

type PrintPaperSize = "58mm" | "80mm";
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
    order.tenant?.name ??
    order.tenantName ??
    order.storeName ??
    "PARADA DA PIZZA"
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
            <div class="item-detail">* ${escapeHtml(fraction)}${escapeHtml(option.optionName)}${escapeHtml(price)}</div>
          `;
        })
        .join("");

      return `
        <div class="item-detail item-detail-title">${escapeHtml(group.groupName)}:</div>
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
    <div class="item-detail">Adicionais:</div>
    ${additions
      .map(
        (addition: string) => `
          <div class="item-detail">+ ${escapeHtml(addition)}</div>
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
            <div class="item-row">
              <span></span>
              <strong>${formatMoney(item.total)}</strong>
            </div>
          `
          : ""
      }

      ${buildAdditionsHtml(item)}

      ${
        isFilled(parsedNotes.notes)
          ? `<div class="item-detail">Obs: ${escapeHtml(parsedNotes.notes)}</div>`
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
    <div class="spacer"></div>
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
    <p>Pagamento: ${escapeHtml(payment)}</p>
    ${
      parsedNotes.cashPaid
        ? `<p>Troco para: ${escapeHtml(parsedNotes.cashPaid)}</p>`
        : ""
    }
    ${parsedNotes.change ? `<p>Troco: ${escapeHtml(parsedNotes.change)}</p>` : ""}
  `;
}

export function buildPrintHtml(
  order: any,
  options: Required<PrintOrderOptions>,
) {
  const isKitchen = options.mode === "kitchen";
  const paperWidth = options.paperSize === "58mm" ? "58mm" : "80mm";
  const parsedNotes = parseNotes(order.notes);
  const orderType =
    typeLabels[order.type] ?? String(order.type ?? "").toUpperCase();

  return `
    <html>
      <head>
        <title>${isKitchen ? "Comanda cozinha" : "Comprovante"}</title>

        <style>
          @page {
            size: ${paperWidth} auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          body {
            width: ${paperWidth};
            margin: 0;
            padding: ${options.paperSize === "58mm" ? "5px" : "8px"};
            color: #000;
            background: #fff;
            font-family: "Courier New", Courier, monospace;
            font-size: ${options.paperSize === "58mm" ? "10.5px" : "12px"};
            line-height: 1.3;
          }

          h1, h2, h3, p {
            margin: 0;
            padding: 0;
          }

          .center {
            text-align: center;
          }

          .store {
            font-size: ${options.paperSize === "58mm" ? "13px" : "16px"};
            font-weight: 900;
            text-transform: uppercase;
          }

          .subtitle {
            margin-top: 2px;
            font-size: ${options.paperSize === "58mm" ? "10px" : "11px"};
            font-weight: 800;
            text-transform: uppercase;
          }

          .dash {
            border-top: 1px dashed #000;
            margin: 7px 0;
          }

          .equals {
            border-top: 2px solid #000;
            margin: 9px 0 7px;
          }

          .order-label {
            margin-top: 8px;
            font-weight: 800;
            text-align: center;
          }

          .order-number {
            margin: 5px 0 8px;
            font-size: ${options.paperSize === "58mm" ? "22px" : "28px"};
            font-weight: 900;
            text-align: center;
          }

          .section-title {
            font-weight: 900;
            text-transform: uppercase;
          }

          .spacer {
            height: 6px;
          }

          .item {
            margin-bottom: 8px;
            break-inside: avoid;
          }

          .item-head {
            font-weight: 900;
          }

          .item-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
            margin-top: 2px;
          }

          .item-row span {
            min-width: 0;
          }

          .item-row strong {
            flex-shrink: 0;
            text-align: right;
          }

          .item-detail {
            margin-top: 2px;
            padding-left: 10px;
          }

          .total-label {
            text-align: center;
            font-weight: 900;
          }

          .total-value {
            margin-top: 5px;
            font-size: ${options.paperSize === "58mm" ? "18px" : "24px"};
            font-weight: 900;
            text-align: right;
          }

          .footer {
            margin-top: 12px;
            text-align: center;
            font-size: ${options.paperSize === "58mm" ? "9.5px" : "11px"};
            font-weight: 800;
          }

          @media print {
            html, body {
              width: ${paperWidth};
            }
          }
        </style>
      </head>

      <body>
        <div class="center">
          <div class="store">${escapeHtml(getStoreName(order))}</div>
          <div class="subtitle">
            ${isKitchen ? "COMANDA COZINHA" : "COMPROVANTE DE PEDIDO"}
          </div>
        </div>

        <div class="dash"></div>

        <div class="order-label">${isKitchen ? "COZINHA" : "PEDIDO ONLINE"}</div>
        <div class="order-number">${escapeHtml(shortOrderNumber(order))}</div>

        <p>Tipo: ${escapeHtml(orderType)}</p>
        <p>Data: ${escapeHtml(formatDateTime(order.createdAt))}</p>

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
        <div class="spacer"></div>

        ${buildItemsHtml(order, options.mode)}

        ${
          parsedNotes.general.length
            ? `
              <div class="dash"></div>
              <div class="section-title">OBSERVACOES</div>
              <div class="spacer"></div>
              ${parsedNotes.general
                .map((line: string) => `<p>${escapeHtml(line)}</p>`)
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
                <div>IMPRESSO AUTOMATICAMENTE</div>
                <div>MEGAS FOOD</div>
              </div>
            `
            : `
              <div class="footer">
                <div>CONFERIR ITENS ANTES DE FINALIZAR</div>
                <div>MEGAS FOOD</div>
              </div>
            `
        }
      </body>
    </html>
  `;
}

export function printOrder(order: any, options?: PrintOrderOptions) {
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
