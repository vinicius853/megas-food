import type { LucideIcon } from "lucide-react";

export type DashboardOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type DashboardOrder = {
  id: string;
  displayNumber?: string | number | null;
  customerName?: string | null;
  status: DashboardOrderStatus;
  total: string | number;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
};

export type DashboardDeliveryZone = {
  id: string;
  name: string;
  fee: number;
  eta: string;
  isActive: boolean;
};

export type DashboardDeliverySettings = {
  isDeliveryOpen?: boolean;
  zones?: DashboardDeliveryZone[];
};

export type DashboardCustomizationSettings = {
  logoUrl?: string;
  coverUrl?: string;
  paletteId?: string;
  brandName?: string;
  tagline?: string;
};

export type DashboardStat = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent: string;
};

export const orderStatusLabels: Record<DashboardOrderStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getOrderDisplayNumber(order: DashboardOrder) {
  return order.displayNumber
    ? `#${order.displayNumber}`
    : `#${order.id.slice(0, 6).toUpperCase()}`;
}

export function getActiveOrders(orders: DashboardOrder[]) {
  return orders.filter((order) =>
    ["PENDING", "CONFIRMED", "READY", "OUT_FOR_DELIVERY"].includes(
      order.status,
    ),
  );
}

export function getValidOrders(orders: DashboardOrder[]) {
  return orders.filter((order) => order.status !== "CANCELLED");
}

export function getBestSellers(orders: DashboardOrder[]) {
  const totals = new Map<string, number>();

  getValidOrders(orders).forEach((order) => {
    order.items.forEach((item) => {
      const name = item.name.trim();
      if (!name) return;

      totals.set(name, (totals.get(name) ?? 0) + item.quantity);
    });
  });

  return [...totals.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((first, second) => second.quantity - first.quantity)
    .slice(0, 5);
}

export function getDeliverySummary(settings: DashboardDeliverySettings | null) {
  const activeZones = (settings?.zones ?? []).filter((zone) => zone.isActive);
  const fees = activeZones.map((zone) => toNumber(zone.fee));

  return {
    activeZones,
    activeCount: activeZones.length,
    minFee: fees.length ? Math.min(...fees) : null,
    maxFee: fees.length ? Math.max(...fees) : null,
  };
}

export function hasCustomization(
  settings: DashboardCustomizationSettings | null,
) {
  return Boolean(settings?.logoUrl || settings?.coverUrl || settings?.tagline);
}
