"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

import type {
  DashboardCustomizationSettings,
  DashboardDeliverySettings,
  DashboardOrder,
} from "./dashboard-data";

export function useDashboardOverview() {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [delivery, setDelivery] = useState<DashboardDeliverySettings | null>(
    null,
  );
  const [customization, setCustomization] =
    useState<DashboardCustomizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      apiFetch<DashboardOrder[]>("/orders"),
      apiFetch<DashboardDeliverySettings>("/dashboard-settings/delivery"),
      apiFetch<DashboardCustomizationSettings>(
        "/dashboard-settings/customization",
      ),
    ]);

    if (results[0].status === "fulfilled") setOrders(results[0].value);
    if (results[1].status === "fulfilled") setDelivery(results[1].value);
    if (results[2].status === "fulfilled") {
      setCustomization(results[2].value);
    }

    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length === results.length) {
      setError("Não foi possível carregar os dados do dashboard.");
    } else if (failures.length > 0) {
      setError("Alguns dados não puderam ser atualizados agora.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial synchronization with the API; later reloads are user-driven.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return {
    orders,
    delivery,
    customization,
    loading,
    error,
    reload: load,
  };
}
