"use client";

import Image from "next/image";
import { QrCode, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { WhatsAppQrResponse } from "./types";

type WhatsAppQrCardProps = {
  qr: WhatsAppQrResponse | null;
  loading: boolean;
  onRefresh: () => void;
};

export function WhatsAppQrCard({
  qr,
  loading,
  onRefresh,
}: WhatsAppQrCardProps) {
  const qrSource = buildQrSource(qr);
  const title =
    qr?.status === "CONNECTED"
      ? "Conectado"
      : qr?.status === "ERROR"
        ? "Erro ao gerar QR Code"
        : "Aguardando leitura do QR Code";

  return (
    <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <QrCode className="h-4 w-4" /> {title}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {qr?.message ??
              "Use o WhatsApp do celular para escanear o codigo desta loja."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Atualizando..." : "Atualizar QR Code"}
        </Button>
      </div>

      {qrSource && qr?.status === "QR_PENDING" && (
        <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
          <Image
            src={qrSource}
            alt="QR Code para conectar o WhatsApp"
            width={256}
            height={256}
            unoptimized
            className="h-auto w-full max-w-64"
          />
        </div>
      )}

      {qr?.instanceName && (
        <p className="mt-3 break-all text-xs text-slate-400">
          Instancia: {qr.instanceName}
        </p>
      )}
    </div>
  );
}

function buildQrSource(qr: WhatsAppQrResponse | null) {
  if (!qr) return null;
  if (qr.qrCode?.startsWith("data:image/")) return qr.qrCode;
  if (qr.qrCodeBase64?.startsWith("data:image/")) return qr.qrCodeBase64;
  if (qr.qrCodeBase64) {
    return `data:image/png;base64,${qr.qrCodeBase64}`;
  }
  return null;
}
