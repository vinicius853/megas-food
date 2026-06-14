import { apiFetch } from "@/lib/api";

import type {
  WhatsAppEvent,
  WhatsAppQrResponse,
  WhatsAppSettings,
} from "./types";

export function getWhatsAppSettings() {
  return apiFetch<WhatsAppSettings>("/whatsapp/settings");
}

export function updateWhatsAppSettings(input: {
  automationEnabled: boolean;
  enabledEvents: WhatsAppEvent[];
}) {
  return apiFetch<WhatsAppSettings>("/whatsapp/settings", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function testWhatsAppConnection() {
  return apiFetch<{ status: string; error?: string | null }>("/whatsapp/test", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function getWhatsAppQrCode() {
  return apiFetch<WhatsAppQrResponse>("/whatsapp/connection/qr");
}
