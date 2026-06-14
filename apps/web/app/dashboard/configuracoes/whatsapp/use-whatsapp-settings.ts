"use client";

import { useEffect, useState } from "react";

import {
  getWhatsAppQrCode,
  getWhatsAppSettings,
  testWhatsAppConnection,
  updateWhatsAppSettings,
} from "./whatsapp-api";
import type {
  WhatsAppEvent,
  WhatsAppQrResponse,
  WhatsAppSettings,
} from "./types";

export function useWhatsAppSettings() {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qr, setQr] = useState<WhatsAppQrResponse | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const loadedSettings = await getWhatsAppSettings();
      setSettings(loadedSettings);
      if (loadedSettings.providerConfigured) {
        void refreshQr();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshQr() {
    try {
      setQrLoading(true);
      setError("");
      const result = await getWhatsAppQrCode();
      setQr(result);
      setSettings((current) => {
        if (!current) return current;
        if (result.status === "CONNECTED") {
          return {
            ...current,
            status: "CONNECTED",
            connectedPhone: result.connectedPhone ?? current.connectedPhone,
            lastError: null,
          };
        }
        if (result.status === "ERROR") {
          return {
            ...current,
            status: "ERROR",
            lastError: result.message ?? current.lastError,
          };
        }
        return {
          ...current,
          status: "DISCONNECTED",
          connectedPhone: null,
          lastError: null,
        };
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Falha ao atualizar QR Code.",
      );
    } finally {
      setQrLoading(false);
    }
  }

  function toggleEvent(event: WhatsAppEvent) {
    setSettings((current) => {
      if (!current) return current;
      const enabledEvents = current.enabledEvents.includes(event)
        ? current.enabledEvents.filter((item) => item !== event)
        : [...current.enabledEvents, event];
      return { ...current, enabledEvents };
    });
  }

  async function save() {
    if (!settings) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const result = await updateWhatsAppSettings({
        automationEnabled: settings.automationEnabled,
        enabledEvents: settings.enabledEvents,
      });
      setSettings(result);
      setMessage("Configuração do WhatsApp salva.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    try {
      setSaving(true);
      setError("");
      const result = await testWhatsAppConnection();
      setMessage(
        result.status === "DRY_RUN"
          ? "Teste registrado em modo simulado. Configure a Evolution API para enviar."
          : "Mensagem de teste processada.",
      );
      if (result.error && result.status !== "DRY_RUN") setError(result.error);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha no teste.");
    } finally {
      setSaving(false);
    }
  }

  return {
    settings,
    setSettings,
    loading,
    saving,
    qr,
    qrLoading,
    message,
    error,
    toggleEvent,
    save,
    test,
    refreshQr,
  };
}
