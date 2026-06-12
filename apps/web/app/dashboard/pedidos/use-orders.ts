import { useCallback, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

import type { Order, OrderStatus } from "./types";

export type OrdersPeriod = "today" | "yesterday" | "last7" | "last30";

const periodLabels: Record<OrdersPeriod, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  last7: "Últimos 7 dias",
  last30: "Últimos 30 dias",
};

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getPeriodRange(period: OrdersPeriod) {
  const today = startOfDay(new Date());

  if (period === "yesterday") {
    return {
      dateFrom: addDays(today, -1),
      dateTo: today,
    };
  }

  if (period === "last7") {
    return {
      dateFrom: addDays(today, -6),
      dateTo: addDays(today, 1),
    };
  }

  if (period === "last30") {
    return {
      dateFrom: addDays(today, -29),
      dateTo: addDays(today, 1),
    };
  }

  return {
    dateFrom: today,
    dateTo: addDays(today, 1),
  };
}

function buildOrdersUrl(period: OrdersPeriod) {
  const range = getPeriodRange(period);
  const params = new URLSearchParams({
    dateFrom: range.dateFrom.toISOString(),
    dateTo: range.dateTo.toISOString(),
  });

  return `/orders?${params.toString()}`;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<OrdersPeriod>("today");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [whatsappAutomationEnabled, setWhatsappAutomationEnabled] =
    useState(false);

  const periodLabel = useMemo(() => periodLabels[period], [period]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const [data, whatsappSettings] = await Promise.all([
        apiFetch<Order[]>(buildOrdersUrl(period)),
        apiFetch<{
          automationEnabled: boolean;
          providerConfigured: boolean;
          status: string;
        }>("/whatsapp/settings").catch(() => ({
          automationEnabled: false,
          providerConfigured: false,
          status: "DISCONNECTED",
        })),
      ]);

      setOrders(data);
      setWhatsappAutomationEnabled(
        whatsappSettings.automationEnabled &&
          whatsappSettings.providerConfigured &&
          whatsappSettings.status === "CONNECTED",
      );
    } catch (err: any) {
      setError(err.message || "Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    try {
      await apiFetch(`/orders/${orderId}`, {
        method: "PATCH",

        body: JSON.stringify({
          status,
        }),
      });

      await loadOrders();

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status,
              }
            : order,
        ),
      );
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar pedido.");
    }
  }

  async function openManualWhatsApp(orderId: string, status: OrderStatus) {
    const events: Partial<Record<OrderStatus, string>> = {
      CONFIRMED: "ORDER_CONFIRMED",
      CANCELLED: "ORDER_CANCELLED",
      READY: "ORDER_READY",
      OUT_FOR_DELIVERY: "ORDER_OUT_FOR_DELIVERY",
      DELIVERED: "ORDER_DELIVERED",
    };
    const event = events[status];
    if (!event) return;

    try {
      const result = await apiFetch<{ url: string }>(
        `/whatsapp/orders/${orderId}/manual-link?event=${event}`,
      );
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      alert(err.message || "Erro ao preparar mensagem do WhatsApp.");
    }
  }

  return {
    orders,
    loading,
    error,
    period,
    periodLabel,

    loadOrders,
    setPeriod,
    updateStatus,
    openManualWhatsApp,
    whatsappAutomationEnabled,
  };
}
