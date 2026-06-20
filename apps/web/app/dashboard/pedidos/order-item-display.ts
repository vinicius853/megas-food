import type { OrderItem, OrderItemModifier } from "./types";
import { buildConfiguredItemName } from "@/lib/configured-item-name";

export type NormalizedOrderItemModifier = {
  id: string;
  groupName: string;
  groupCode?: string | null;
  optionName: string;
  optionCode?: string | null;
  pricingMode?: string | null;
  quantity: number;
  fraction?: number | null;
  dependsOnOptionId?: string | null;
  unitPriceDelta: number;
  totalDelta: number;
  sortOrder: number;
  metadata?: unknown;
};

export type NormalizedOrderItemForDisplay = {
  source: "V2_GENERIC";
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string | null;
  modifiers: NormalizedOrderItemModifier[];
  groups: Array<{
    groupName: string;
    groupCode?: string | null;
    pricingMode?: string | null;
    options: NormalizedOrderItemModifier[];
  }>;
};

export function normalizeOrderItemForDisplay(
  item: OrderItem,
): NormalizedOrderItemForDisplay {
  const modifiers = normalizeModifiers(item.modifiers);
  const groups = groupModifiers(modifiers);
  const originalName = cleanText(item.name) || "Produto";

  return {
    source: "V2_GENERIC",
    name: buildConfiguredItemName(
      originalName,
      groups.map((group) => ({
        code: group.groupCode,
        name: group.groupName,
        options: group.options.map((option) => ({
          name: option.optionName,
          fraction: option.fraction,
        })),
      })),
    ),
    quantity: Number(item.quantity ?? 1),
    unitPrice: Number(item.unitPrice ?? 0),
    total: Number(item.total ?? 0),
    notes: item.notes,
    modifiers,
    groups,
  };
}

export function getDashboardOrderItemName(
  normalized: NormalizedOrderItemForDisplay,
) {
  const sizeGroup = normalized.groups.find((group) =>
    isGroupType(group, ["size", "sizes", "tamanho", "tamanhos"]),
  );
  const flavorGroup = normalized.groups.find((group) =>
    isGroupType(group, ["flavor", "flavors", "sabor", "sabores"]),
  );
  const sizeName = sizeGroup?.options[0]?.optionName?.trim();
  const flavorCount = flavorGroup?.options.length ?? 0;

  if (!sizeName || flavorCount === 0) {
    return normalized.name;
  }

  return `Pizza ${sizeName}${
    flavorCount > 1 ? ` (${flavorCount} Sabores)` : ""
  }`;
}

function isGroupType(
  group: NormalizedOrderItemForDisplay["groups"][number],
  terms: string[],
) {
  const codeParts = normalizeToken(group.groupCode).split("_");
  const name = normalizeToken(group.groupName);

  return codeParts.some((part) => terms.includes(part)) || terms.includes(name);
}

function normalizeModifiers(modifiers: OrderItemModifier[]) {
  return [...modifiers]
    .sort(
      (left, right) =>
        Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0),
    )
    .map(
      (modifier): NormalizedOrderItemModifier => ({
        id: modifier.id,
        groupName: cleanText(modifier.groupName) || "Grupo",
        groupCode: modifier.groupCode,
        optionName: cleanText(modifier.optionName) || "Opcao",
        optionCode: modifier.optionCode,
        pricingMode: modifier.pricingMode,
        quantity: Number(modifier.quantity ?? 1),
        fraction: toOptionalNumber(modifier.fraction),
        dependsOnOptionId: modifier.dependsOnOptionId,
        unitPriceDelta: Number(modifier.unitPriceDelta ?? 0),
        totalDelta: Number(modifier.totalDelta ?? 0),
        sortOrder: Number(modifier.sortOrder ?? 0),
        metadata: modifier.metadata,
      }),
    );
}

function groupModifiers(modifiers: NormalizedOrderItemModifier[]) {
  const groupMap = new Map<
    string,
    NormalizedOrderItemForDisplay["groups"][number]
  >();

  for (const modifier of modifiers) {
    const key = modifier.groupCode ?? modifier.groupName;
    const group = groupMap.get(key) ?? {
      groupName: modifier.groupName,
      groupCode: modifier.groupCode,
      pricingMode: modifier.pricingMode,
      options: [],
    };

    group.options.push(modifier);
    groupMap.set(key, group);
  }

  return [...groupMap.values()];
}

function cleanText(value?: string | number | null) {
  return String(value ?? "").trim();
}

function normalizeToken(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function toOptionalNumber(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}
