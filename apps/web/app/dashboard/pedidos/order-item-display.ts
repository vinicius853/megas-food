import type { OrderItem, OrderItemModifier } from "./types";

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

  return {
    source: "V2_GENERIC",
    name: cleanText(item.name) || "Produto",
    quantity: Number(item.quantity ?? 1),
    unitPrice: Number(item.unitPrice ?? 0),
    total: Number(item.total ?? 0),
    notes: item.notes,
    modifiers,
    groups: groupModifiers(modifiers),
  };
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

function toOptionalNumber(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}
