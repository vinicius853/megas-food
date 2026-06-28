"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock, CreditCard, MessageCircle, Save, Store } from "lucide-react";

import { apiFetch } from "@/lib/api";

import { PageContainer, PageHeader } from "@/components/layout/page-container";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppSettingsContent } from "./whatsapp/whatsapp-settings-content";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  zipCode?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
};

type OpeningHourRange = {
  enabled?: boolean;
  open: string;
  close: string;
};

type DeliveryOpeningHours = {
  monday: OpeningHourRange;
  tuesday: OpeningHourRange;
  wednesday: OpeningHourRange;
  thursday: OpeningHourRange;
  friday: OpeningHourRange;
  saturday: OpeningHourRange;
  sunday: OpeningHourRange;
  weekday?: OpeningHourRange;
};

type DeliverySettings = {
  isDeliveryOpen?: boolean;
  city?: string;
  state?: string;
  storeCep?: string;
  storeAddress?: string;
  whatsapp?: string;
  zones?: unknown[];
  openingHours?: DeliveryOpeningHours;
  options?: Record<string, unknown>;
};

type SettingsTab = "store" | "hours" | "whatsapp" | "subscription";
type WeekDayKey = Exclude<keyof DeliveryOpeningHours, "weekday">;

const fallbackOpeningHours: DeliveryOpeningHours = {
  monday: { enabled: false, open: "", close: "" },
  tuesday: { enabled: false, open: "", close: "" },
  wednesday: { enabled: false, open: "", close: "" },
  thursday: { enabled: false, open: "", close: "" },
  friday: { enabled: false, open: "", close: "" },
  saturday: { enabled: false, open: "", close: "" },
  sunday: { enabled: false, open: "", close: "" },
};

const tabs: Array<{
  id: SettingsTab;
  label: string;
  icon: typeof Store;
}> = [
  { id: "store", label: "Dados da loja", icon: Store },
  { id: "hours", label: "Horarios", icon: Clock },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "subscription", label: "Assinatura", icon: CreditCard },
];

const weekDays: Array<{
  key: WeekDayKey;
  label: string;
}> = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terca" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sabado" },
  { key: "sunday", label: "Domingo" },
];

function normalizeOpeningHours(openingHours?: Partial<DeliveryOpeningHours>) {
  const weekday = openingHours?.weekday;

  return {
    monday: {
      ...fallbackOpeningHours.monday,
      ...(weekday ?? {}),
      ...(openingHours?.monday ?? {}),
    },
    tuesday: {
      ...fallbackOpeningHours.tuesday,
      ...(weekday ?? {}),
      ...(openingHours?.tuesday ?? {}),
    },
    wednesday: {
      ...fallbackOpeningHours.wednesday,
      ...(weekday ?? {}),
      ...(openingHours?.wednesday ?? {}),
    },
    thursday: {
      ...fallbackOpeningHours.thursday,
      ...(weekday ?? {}),
      ...(openingHours?.thursday ?? {}),
    },
    friday: {
      ...fallbackOpeningHours.friday,
      ...(weekday ?? {}),
      ...(openingHours?.friday ?? {}),
    },
    saturday: {
      ...fallbackOpeningHours.saturday,
      ...(openingHours?.saturday ?? {}),
    },
    sunday: {
      ...fallbackOpeningHours.sunday,
      ...(openingHours?.sunday ?? {}),
    },
  };
}

function timeToMinutes(value?: string) {
  const [hours, minutes] = String(value ?? "")
    .split(":")
    .map((part) => Number(part));

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;

  return hours * 60 + minutes;
}

function getTodayOpeningRange(
  openingHours?: DeliveryOpeningHours,
): OpeningHourRange {
  const day = new Date().getDay();
  const key = weekDays[day === 0 ? 6 : day - 1]?.key;

  return key
    ? (openingHours?.[key] ?? fallbackOpeningHours[key])
    : fallbackOpeningHours.monday;
}

function isOpenNow(delivery?: DeliverySettings | null) {
  if (delivery?.isDeliveryOpen === false) return false;

  const range = getTodayOpeningRange(delivery?.openingHours);

  if (range.enabled === false) return false;

  const openMinutes = timeToMinutes(range.open);
  const closeMinutes = timeToMinutes(range.close);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
}

export default function ConfiguracoesPizzariaPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("store");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [delivery, setDelivery] = useState<DeliverySettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadTenant() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [tenant, deliverySettings] = await Promise.all([
        apiFetch<Tenant>("/tenants/me"),
        apiFetch<DeliverySettings>("/dashboard-settings/delivery"),
      ]);

      setName(tenant.name || "");
      setSlug(tenant.slug || "");
      setPhone(tenant.phone || "");
      setWhatsapp(tenant.whatsapp || "");
      setAddress(tenant.address || deliverySettings.storeAddress || "");
      setCity(tenant.city || deliverySettings.city || "");
      setState(tenant.state || deliverySettings.state || "");
      setZipCode(tenant.zipCode || deliverySettings.storeCep || "");
      setDelivery({
        ...deliverySettings,
        openingHours: normalizeOpeningHours(deliverySettings.openingHours),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar configuracoes.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveStoreData() {
    try {
      setSavingStore(true);
      setError("");
      setMessage("");

      if (!name.trim()) {
        throw new Error("Informe o nome da loja.");
      }

      if (!slug.trim()) {
        throw new Error("Informe o slug do cardapio.");
      }

      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
      };

      const updatedTenant = await apiFetch<Tenant>("/tenants/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const updatedDelivery = await apiFetch<DeliverySettings>(
        "/dashboard-settings/delivery",
        {
          method: "PUT",
          body: JSON.stringify({
            ...(delivery ?? {}),
            city: city.trim(),
            state: state.trim(),
            storeCep: zipCode.trim(),
            storeAddress: address.trim(),
            whatsapp: whatsapp.trim(),
          }),
        },
      );

      setDelivery({
        ...updatedDelivery,
        openingHours: normalizeOpeningHours(updatedDelivery.openingHours),
      });

      localStorage.setItem("tenantName", updatedTenant.name);
      localStorage.setItem("tenantSlug", updatedTenant.slug);
      window.dispatchEvent(new Event("dashboard-brand-updated"));

      setMessage("Dados da loja salvos com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar dados da loja.",
      );
    } finally {
      setSavingStore(false);
    }
  }

  async function saveOpeningHours() {
    try {
      setSavingHours(true);
      setError("");
      setMessage("");

      const updatedDelivery = await apiFetch<DeliverySettings>(
        "/dashboard-settings/delivery",
        {
          method: "PUT",
          body: JSON.stringify({
            ...(delivery ?? {}),
            openingHours: delivery?.openingHours ?? fallbackOpeningHours,
          }),
        },
      );

      setDelivery({
        ...updatedDelivery,
        openingHours: normalizeOpeningHours(updatedDelivery.openingHours),
      });
      setMessage("Horarios salvos com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar horarios.");
    } finally {
      setSavingHours(false);
    }
  }

  function updateOpeningHours(
    key: WeekDayKey,
    patch: Partial<OpeningHourRange>,
  ) {
    setDelivery((current) => ({
      ...(current ?? {}),
      openingHours: {
        ...normalizeOpeningHours(current?.openingHours),
        [key]: {
          ...normalizeOpeningHours(current?.openingHours)[key],
          ...patch,
        },
      },
    }));
  }

  useEffect(() => {
    loadTenant();
  }, []);

  const openNow = useMemo(() => isOpenNow(delivery), [delivery]);
  const currentRange = useMemo(
    () => getTodayOpeningRange(delivery?.openingHours),
    [delivery?.openingHours],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Configuracoes da loja"
        description="Organize os dados e preferencias da sua loja em um so lugar."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          {message}
        </div>
      )}

      <div className="mb-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <div className="grid min-w-max grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                  active
                    ? "bg-orange-50 text-orange-600 ring-1 ring-orange-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "store" && (
        <Card>
          <CardHeader>
            <CardTitle>Dados da loja</CardTitle>
            <CardDescription>
              Informacoes exibidas no cardapio publico e usadas nos pedidos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {loading ? (
              <p className="text-sm font-bold text-slate-500">
                Carregando configuracoes...
              </p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <LabeledInput
                    label="Nome da loja"
                    value={name}
                    onChange={setName}
                  />
                  <LabeledInput
                    label="Slug do cardapio publico"
                    value={slug}
                    onChange={setSlug}
                    helper={`URL: /c/${slug || "sua-loja"}`}
                  />
                  <LabeledInput
                    label="Telefone"
                    value={phone}
                    onChange={setPhone}
                  />
                  <LabeledInput
                    label="WhatsApp para receber pedidos"
                    value={whatsapp}
                    onChange={setWhatsapp}
                    helper="Use DDD + numero. Ex: 24999999999."
                  />
                </div>

                <LabeledInput
                  label="Endereco fisico da loja"
                  value={address}
                  onChange={setAddress}
                />

                <div className="grid gap-4 md:grid-cols-[1fr_160px_1fr]">
                  <LabeledInput
                    label="Cidade"
                    value={city}
                    onChange={setCity}
                  />
                  <LabeledInput
                    label="Estado"
                    value={state}
                    onChange={setState}
                  />
                  <LabeledInput
                    label="CEP"
                    value={zipCode}
                    onChange={setZipCode}
                  />
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={loadTenant}
                    disabled={loading || savingStore}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={saveStoreData}
                    disabled={loading || savingStore}
                  >
                    <Save className="h-4 w-4" />
                    {savingStore ? "Salvando..." : "Salvar alteracoes"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "hours" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Horarios de funcionamento</CardTitle>
                <CardDescription>
                  Controle quando o cardapio aceita pedidos.
                </CardDescription>
              </div>

              <Badge variant={openNow ? "success" : "warning"}>
                {openNow ? "Aberto agora" : "Fechado agora"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {loading ? (
              <p className="text-sm font-bold text-slate-500">
                Carregando horarios...
              </p>
            ) : (
              <>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  Hoje:{" "}
                  <strong className="text-slate-950">
                    {currentRange.enabled === false
                      ? "Fechado"
                      : `${currentRange.open} - ${currentRange.close}`}
                  </strong>
                </div>

                <div className="grid gap-3">
                  {weekDays.map((day) => (
                    <ScheduleEditorRow
                      key={day.key}
                      label={day.label}
                      range={
                        delivery?.openingHours?.[day.key] ??
                        fallbackOpeningHours[day.key]
                      }
                      onChange={(patch) => updateOpeningHours(day.key, patch)}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={loadTenant}
                    disabled={loading || savingHours}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={saveOpeningHours}
                    disabled={loading || savingHours}
                  >
                    <Save className="h-4 w-4" />
                    {savingHours ? "Salvando..." : "Salvar horarios"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "whatsapp" && <WhatsAppSettingsContent />}

      {activeTab === "subscription" && (
        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
            <CardDescription>
              Acompanhe plano, vencimento, status de acesso e cobrancas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Plano e situacao da assinatura
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                Consulte os dados reais de cobranca e acesso.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/configuracoes/assinatura">
                Gerenciar assinatura
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
      {helper && <span className="text-xs text-slate-500">{helper}</span>}
    </label>
  );
}

function ScheduleEditorRow({
  label,
  range,
  onChange,
}: {
  label: string;
  range: OpeningHourRange;
  onChange: (patch: Partial<OpeningHourRange>) => void;
}) {
  const closed = range.enabled === false;

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[160px_1fr_auto] md:items-center">
      <div>
        <p className="text-sm font-black text-slate-950">{label}</p>
        <p className="text-xs font-medium text-slate-500">
          {closed ? "Fechado" : "Aberto"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-bold text-slate-500">Abertura</span>
          <Input
            type="time"
            value={range.open}
            disabled={closed}
            onChange={(event) => onChange({ open: event.target.value })}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-bold text-slate-500">Fechamento</span>
          <Input
            type="time"
            value={range.close}
            disabled={closed}
            onChange={(event) => onChange({ close: event.target.value })}
          />
        </label>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 md:justify-center">
        Fechado
        <input
          type="checkbox"
          checked={closed}
          onChange={(event) => onChange({ enabled: !event.target.checked })}
          className="h-5 w-5 accent-orange-600"
        />
      </label>
    </div>
  );
}
