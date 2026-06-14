"use client";

import { MessageCircle, Send } from "lucide-react";
import type { ReactNode } from "react";

import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { WhatsAppEvent } from "./types";
import { useWhatsAppSettings } from "./use-whatsapp-settings";
import { WhatsAppQrCard } from "./whatsapp-qr-card";

const events: Array<{ value: WhatsAppEvent; label: string }> = [
  { value: "ORDER_CREATED", label: "Pedido recebido" },
  { value: "ORDER_CONFIRMED", label: "Pedido confirmado" },
  { value: "ORDER_CANCELLED", label: "Pedido cancelado" },
  { value: "ORDER_READY", label: "Pedido pronto para retirada" },
  { value: "ORDER_OUT_FOR_DELIVERY", label: "Saiu para entrega" },
  { value: "ORDER_DELIVERED", label: "Pedido entregue" },
];

const statusLabels = {
  DISCONNECTED: "Desconectado",
  AWAITING_CONFIGURATION: "Aguardando configuração",
  CONNECTED: "Conectado",
  ERROR: "Com erro",
};

export default function WhatsAppSettingsPage() {
  const state = useWhatsAppSettings();
  const settings = state.settings;

  return (
    <PageContainer size="narrow">
      <PageHeader
        title="WhatsApp"
        description="Automatize atualizações de pedido sem interromper a operação."
      />

      {state.error && <Feedback tone="error">{state.error}</Feedback>}
      {state.message && <Feedback tone="success">{state.message}</Feedback>}

      {state.loading || !settings ? (
        <Card className="p-6 text-sm text-slate-500">Carregando...</Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Conexão Evolution API</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Credenciais ficam somente no servidor.
                </p>
              </div>
              <Badge
                variant={
                  settings.status === "CONNECTED" ? "success" : "warning"
                }
              >
                {statusLabels[settings.status]}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Info label="Número da loja" value={settings.recipientPhone} />
              <Info label="Número conectado" value={settings.connectedPhone} />
              <WhatsAppQrCard
                qr={state.qr}
                loading={state.qrLoading}
                onRefresh={state.refreshQr}
              />
              {settings.lastError && (
                <p className="sm:col-span-2 text-sm text-red-600">
                  Último erro: {settings.lastError}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="font-semibold">Enviar mensagens automáticas</p>
                  <p className="text-sm text-slate-500">
                    Desligado por padrão. O envio manual continua disponível.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.automationEnabled}
                  onChange={(event) =>
                    state.setSettings({
                      ...settings,
                      automationEnabled: event.target.checked,
                    })
                  }
                  className="h-5 w-5 accent-orange-600"
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                {events.map((event) => (
                  <label
                    key={event.value}
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={settings.enabledEvents.includes(event.value)}
                      onChange={() => state.toggleEvent(event.value)}
                      className="h-4 w-4 accent-orange-600"
                    />
                    {event.label}
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={state.test}
                  disabled={state.saving}
                >
                  <Send className="h-4 w-4" /> Testar
                </Button>
                <Button
                  variant="primary"
                  onClick={state.save}
                  disabled={state.saving}
                >
                  <MessageCircle className="h-4 w-4" />
                  {state.saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">
        {value || "Não informado"}
      </p>
    </div>
  );
}

function Feedback({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {children}
    </div>
  );
}
