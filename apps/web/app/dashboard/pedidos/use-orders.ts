import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { apiFetch } from "@/lib/api";

import type { Order, OrderListItem, OrderStatus } from "./types";

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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useOrders() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [period, setPeriodState] = useState<OrdersPeriod>("today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const periodRef = useRef(period);
  const loadInFlightRef = useRef<Promise<void> | null>(null);
  const refreshPendingRef = useRef(false);

  const periodLabel = useMemo(() => periodLabels[period], [period]);

  const loadOrders = useCallback(() => {
    if (loadInFlightRef.current) {
      refreshPendingRef.current = true;
      return loadInFlightRef.current;
    }

    const run = async () => {
      setLoading(true);

      try {
        do {
          refreshPendingRef.current = false;
          const requestedPeriod = periodRef.current;

          try {
            setError("");

            const data = await apiFetch<OrderListItem[]>(
              buildOrdersUrl(requestedPeriod),
            );

            setOrders(data);
          } catch (error: unknown) {
            setError(getErrorMessage(error, "Erro ao carregar pedidos."));
          }

          if (periodRef.current !== requestedPeriod) {
            refreshPendingRef.current = true;
          }
        } while (refreshPendingRef.current);
      } finally {
        setLoading(false);
        loadInFlightRef.current = null;
      }
    };

    const request = run();
    loadInFlightRef.current = request;
    return request;
  }, []);

  const setPeriod = useCallback(
    (nextPeriod: OrdersPeriod) => {
      periodRef.current = nextPeriod;
      setPeriodState(nextPeriod);
      void loadOrders();
    },
    [loadOrders],
  );

  async function updateStatus(orderId: string, status: OrderStatus) {
    try {
      const result = await apiFetch<{
        whatsappNotification?: {
          automaticScheduled?: boolean;
        };
      }>(`/orders/${orderId}`, {
        method: "PATCH",

        body: JSON.stringify({
          status,
        }),
      });

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

      void loadOrders();
      return Boolean(result.whatsappNotification?.automaticScheduled);
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Erro ao atualizar pedido."));
      throw error;
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
      const result = await apiFetch<{
        url: string | null;
        message?: string;
        suppressed?: boolean;
      }>(
        `/whatsapp/orders/${orderId}/manual-link?event=${event}`,
      );
      if (result.suppressed || !result.url) {
        alert(
          result.message ??
            "WhatsApp indisponivel para este pedido.",
        );
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Erro ao preparar mensagem do WhatsApp."));
    }
  }

  const loadOrderDetails = useCallback((orderId: string) => {
    return apiFetch<Order>(`/orders/${orderId}`);
  }, []);

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
    loadOrderDetails,
  };
}
