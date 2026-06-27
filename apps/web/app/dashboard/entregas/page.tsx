"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  Eye,
  MapPin,
  Plus,
  Save,
  Trash2,
  Truck,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { Skeleton } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageContainer, PageHeader } from "@/components/layout/page-container";

type DeliveryZone = {
  id: string;
  name: string;
  fee: number;
  eta: string;
  isActive: boolean;
  streetRules?: DeliveryStreetRule[];
};

type DeliveryStreetRule = {
  id: string;
  streetName: string;
  fee: number;
  eta?: string;
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
  isDeliveryOpen: boolean;
  city: string;
  state: string;
  storeCep: string;
  storeAddress: string;
  whatsapp: string;
  zones: DeliveryZone[];
  openingHours: DeliveryOpeningHours;
};

const emptySettings: DeliverySettings = {
  isDeliveryOpen: false,
  city: "",
  state: "",
  storeCep: "",
  storeAddress: "",
  whatsapp: "",
  zones: [],
  openingHours: {
    monday: { enabled: false, open: "", close: "" },
    tuesday: { enabled: false, open: "", close: "" },
    wednesday: { enabled: false, open: "", close: "" },
    thursday: { enabled: false, open: "", close: "" },
    friday: { enabled: false, open: "", close: "" },
    saturday: { enabled: false, open: "", close: "" },
    sunday: { enabled: false, open: "", close: "" },
  },
};

const tabs = ["Areas de entrega", "Horarios de funcionamento", "Configuracoes"];

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeOpeningHours(
  openingHours?: Partial<DeliveryOpeningHours>,
): DeliveryOpeningHours {
  const weekday = openingHours?.weekday;

  return {
    monday: {
      ...emptySettings.openingHours.monday,
      ...(weekday ?? {}),
      ...(openingHours?.monday ?? {}),
    },
    tuesday: {
      ...emptySettings.openingHours.tuesday,
      ...(weekday ?? {}),
      ...(openingHours?.tuesday ?? {}),
    },
    wednesday: {
      ...emptySettings.openingHours.wednesday,
      ...(weekday ?? {}),
      ...(openingHours?.wednesday ?? {}),
    },
    thursday: {
      ...emptySettings.openingHours.thursday,
      ...(weekday ?? {}),
      ...(openingHours?.thursday ?? {}),
    },
    friday: {
      ...emptySettings.openingHours.friday,
      ...(weekday ?? {}),
      ...(openingHours?.friday ?? {}),
    },
    saturday: {
      ...emptySettings.openingHours.saturday,
      ...(openingHours?.saturday ?? {}),
    },
    sunday: {
      ...emptySettings.openingHours.sunday,
      ...(openingHours?.sunday ?? {}),
    },
  };
}

export default function EntregasPage() {
  const [settings, setSettings] = useState<DeliverySettings>(emptySettings);
  const [tenantSlug, setTenantSlug] = useState("");
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [zoneToFocusId, setZoneToFocusId] = useState<string | null>(null);
  const [expandedZoneIds, setExpandedZoneIds] = useState<string[]>([]);

  const summary = useMemo(() => {
    const activeZones = settings.zones.filter((zone) => zone.isActive);
    const fees = activeZones.map((zone) => zone.fee);

    return {
      activeCount: activeZones.length,
      minFee: fees.length ? Math.min(...fees) : 0,
      maxFee: fees.length ? Math.max(...fees) : 0,
      etaRange: activeZones.length
        ? [
            ...new Set(activeZones.map((zone) => zone.eta).filter(Boolean)),
          ].join(", ")
        : "Não configurado",
    };
  }, [settings.zones]);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [delivery, tenant] = await Promise.all([
        apiFetch<DeliverySettings>("/dashboard-settings/delivery"),
        apiFetch<{ slug: string }>("/tenants/me"),
      ]);

      setSettings({
        ...emptySettings,
        ...delivery,
        zones: delivery.zones ?? [],
        openingHours: normalizeOpeningHours(delivery.openingHours),
      });
      setTenantSlug(tenant.slug || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar entregas.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await apiFetch("/dashboard-settings/delivery", {
        method: "PUT",
        body: JSON.stringify(settings),
      });

      setMessage("Configuracoes de entrega salvas com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar entregas.");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof DeliverySettings, value: string | boolean) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateZone(id: string, patch: Partial<DeliveryZone>) {
    setSettings((current) => ({
      ...current,
      zones: current.zones.map((zone) =>
        zone.id === id ? { ...zone, ...patch } : zone,
      ),
    }));
  }

  function updateOpeningHours(
    key: keyof Omit<DeliveryOpeningHours, "weekday">,
    patch: Partial<OpeningHourRange>,
  ) {
    setSettings((current) => ({
      ...current,
      openingHours: {
        ...current.openingHours,
        [key]: {
          ...current.openingHours[key],
          ...patch,
        },
      },
    }));
  }

  function addZone() {
    const id = crypto.randomUUID();

    setSettings((current) => ({
      ...current,
      zones: [
        ...current.zones,
        {
          id,
          name: "",
          fee: 0,
          eta: "",
          isActive: false,
          streetRules: [],
        },
      ],
    }));
    setZoneToFocusId(id);
    setExpandedZoneIds((current) => [...current, id]);
  }

  function removeZone(id: string) {
    setSettings((current) => ({
      ...current,
      zones: current.zones.filter((zone) => zone.id !== id),
    }));
    setExpandedZoneIds((current) => current.filter((zoneId) => zoneId !== id));
  }

  function toggleZoneExpanded(id: string) {
    setExpandedZoneIds((current) =>
      current.includes(id)
        ? current.filter((zoneId) => zoneId !== id)
        : [...current, id],
    );
  }

  function addStreetRule(zoneId: string) {
    const id = crypto.randomUUID();

    setSettings((current) => ({
      ...current,
      zones: current.zones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              streetRules: [
                ...(zone.streetRules ?? []),
                {
                  id,
                  streetName: "",
                  fee: zone.fee,
                  eta: "",
                  isActive: true,
                },
              ],
            }
          : zone,
      ),
    }));
    setExpandedZoneIds((current) =>
      current.includes(zoneId) ? current : [...current, zoneId],
    );
  }

  function updateStreetRule(
    zoneId: string,
    ruleId: string,
    patch: Partial<DeliveryStreetRule>,
  ) {
    setSettings((current) => ({
      ...current,
      zones: current.zones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              streetRules: (zone.streetRules ?? []).map((rule) =>
                rule.id === ruleId ? { ...rule, ...patch } : rule,
              ),
            }
          : zone,
      ),
    }));
  }

  function removeStreetRule(zoneId: string, ruleId: string) {
    setSettings((current) => ({
      ...current,
      zones: current.zones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              streetRules: (zone.streetRules ?? []).filter(
                (rule) => rule.id !== ruleId,
              ),
            }
          : zone,
      ),
    }));
  }

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!zoneToFocusId) return;

    const input = document.getElementById(
      `delivery-zone-name-${zoneToFocusId}`,
    );

    if (!(input instanceof HTMLInputElement)) return;

    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus();
    setZoneToFocusId(null);
  }, [settings.zones, zoneToFocusId]);

  return (
    <PageContainer>
      <PageHeader
        title="Entregas"
        description="Gerencie suas areas de entrega, taxas e horarios de funcionamento."
        actions={
          <>
            {tenantSlug && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/c/${tenantSlug}`} target="_blank">
                  <Eye className="h-4 w-4" />
                  Ver cardápio público
                </Link>
              </Button>
            )}

            <Button
              onClick={saveSettings}
              disabled={saving || loading}
              variant="primary"
              size="sm"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      )}

      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-600">
                <Truck className="h-8 w-8" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-emerald-600">
                    {settings.isDeliveryOpen
                      ? "Entregas ativas"
                      : "Entregas fechadas"}
                  </h2>
                  <Badge
                    variant={settings.isDeliveryOpen ? "success" : "warning"}
                  >
                    {settings.isDeliveryOpen ? "Recebendo pedidos" : "Pausado"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {settings.isDeliveryOpen
                    ? "Sua pizzaria esta recebendo pedidos para entrega."
                    : "Pedidos para entrega estao temporariamente pausados."}
                </p>
              </div>
            </div>

            <StatusMetric
              icon={MapPin}
              value={summary.activeCount}
              label="Bairros atendidos"
            />
            <StatusMetric
              icon={CheckCircle2}
              value={
                summary.activeCount
                  ? `${formatMoney(summary.minFee)} - ${formatMoney(summary.maxFee)}`
                  : "Não configurada"
              }
              label="Taxa de entrega"
            />
          </div>
        </CardContent>
      </Card>

      <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-5 py-4 text-sm font-black transition ${
              activeTab === tab
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "Areas de entrega" && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Areas de entrega</CardTitle>
                    <CardDescription>
                      Gerencie bairros atendidos pela sua pizzaria e os valores
                      de frete.
                    </CardDescription>
                  </div>

                  <Button onClick={addZone} variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                    Adicionar bairro
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {loading && <Skeleton className="h-40 w-full rounded-3xl" />}
                {!loading && settings.zones.length === 0 && (
                  <EmptyState
                    icon={MapPin}
                    title="Nenhuma entrega cadastrada"
                    description="Adicione um bairro para configurar taxa e prazo de entrega."
                    action={
                      <Button onClick={addZone} variant="outline" size="sm">
                        <Plus className="h-4 w-4" />
                        Adicionar bairro
                      </Button>
                    }
                    className="bg-slate-50"
                  />
                )}
                {!loading &&
                  settings.zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="grid gap-3 lg:grid-cols-[1.2fr_150px_150px_auto_auto] lg:items-center">
                        <Input
                          id={`delivery-zone-name-${zone.id}`}
                          value={zone.name}
                          onChange={(event) =>
                            updateZone(zone.id, { name: event.target.value })
                          }
                          aria-label="Nome do bairro"
                        />

                        <FeeInput
                          value={zone.fee}
                          onChange={(fee) => updateZone(zone.id, { fee })}
                        />

                        <Input
                          value={zone.eta}
                          onChange={(event) =>
                            updateZone(zone.id, { eta: event.target.value })
                          }
                          aria-label="Tempo estimado"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            updateZone(zone.id, { isActive: !zone.isActive })
                          }
                          className={`rounded-2xl px-4 py-3 text-xs font-black transition ${
                            zone.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {zone.isActive ? "Ativo" : "Inativo"}
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => toggleZoneExpanded(zone.id)}
                            className="flex h-11 min-w-24 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 text-xs font-black text-slate-600"
                          >
                            <Edit3 className="h-4 w-4" />
                            {(zone.streetRules ?? []).length} ruas
                          </button>

                          <button
                            type="button"
                            onClick={() => removeZone(zone.id)}
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-100 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {expandedZoneIds.includes(zone.id) && (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-black text-slate-900">
                                Ruas com taxa diferenciada
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                Se a rua nao tiver taxa especifica, sera usada a taxa padrao do bairro.
                              </p>
                            </div>

                            <Button
                              type="button"
                              onClick={() => addStreetRule(zone.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="h-4 w-4" />
                              Adicionar rua
                            </Button>
                          </div>

                          <div className="mt-4 space-y-3">
                            {(zone.streetRules ?? []).length === 0 && (
                              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm font-semibold text-slate-500">
                                Nenhuma rua com taxa diferenciada.
                              </div>
                            )}

                            {(zone.streetRules ?? []).map((rule) => (
                              <div
                                key={rule.id}
                                className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 lg:grid-cols-[1.2fr_150px_150px_auto_auto] lg:items-center"
                              >
                                <Input
                                  value={rule.streetName}
                                  onChange={(event) =>
                                    updateStreetRule(zone.id, rule.id, {
                                      streetName: event.target.value,
                                    })
                                  }
                                  aria-label="Nome da rua"
                                  placeholder="Nome da rua"
                                />

                                <FeeInput
                                  value={rule.fee}
                                  onChange={(fee) =>
                                    updateStreetRule(zone.id, rule.id, { fee })
                                  }
                                />

                                <Input
                                  value={rule.eta ?? ""}
                                  onChange={(event) =>
                                    updateStreetRule(zone.id, rule.id, {
                                      eta: event.target.value,
                                    })
                                  }
                                  aria-label="Tempo estimado da rua"
                                  placeholder="Prazo opcional"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateStreetRule(zone.id, rule.id, {
                                      isActive: !rule.isActive,
                                    })
                                  }
                                  className={`rounded-2xl px-4 py-3 text-xs font-black transition ${
                                    rule.isActive
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {rule.isActive ? "Ativa" : "Inativa"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeStreetRule(zone.id, rule.id)
                                  }
                                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-100 text-red-600"
                                  aria-label="Remover rua"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                {!loading && settings.zones.length > 0 && (
                  <div className="flex justify-center pt-2">
                    <Button onClick={addZone} variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                      Adicionar bairro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "Horarios de funcionamento" && (
            <ScheduleCard
              openingHours={settings.openingHours}
              updateOpeningHours={updateOpeningHours}
            />
          )}
          {activeTab === "Configuracoes" && (
            <DeliveryInfoCard
              settings={settings}
              updateField={updateField}
            />
          )}
      </div>
    </PageContainer>
  );
}

function StatusMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof MapPin;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-black text-slate-950">{value}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function DeliveryInfoCard({
  settings,
  updateField,
}: {
  settings: DeliverySettings;
  updateField: (field: keyof DeliverySettings, value: string | boolean) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacoes da entrega</CardTitle>
        <CardDescription>
          Dados usados no atendimento ao cliente.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <LabeledInput
          label="Cidade"
          value={settings.city}
          onChange={(value) => updateField("city", value)}
        />
        <LabeledInput
          label="Estado"
          value={settings.state}
          onChange={(value) => updateField("state", value)}
        />
        <LabeledInput
          label="CEP da loja"
          value={settings.storeCep}
          onChange={(value) => updateField("storeCep", value)}
        />
        <LabeledInput
          label="Endereco da loja"
          value={settings.storeAddress}
          onChange={(value) => updateField("storeAddress", value)}
        />
        <LabeledInput
          label="WhatsApp para pedidos"
          value={settings.whatsapp}
          onChange={(value) => updateField("whatsapp", value)}
        />
      </CardContent>
    </Card>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-500">
        {label}
      </span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function formatFeeInput(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function FeeInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(formatFeeInput(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(formatFeeInput(value));
    }
  }, [focused, value]);

  function handleChange(nextValue: string) {
    setDraft(nextValue);

    if (!nextValue.trim()) {
      onChange(0);
      return;
    }

    onChange(parseMoney(nextValue));
  }

  return (
    <Input
      value={draft}
      onFocus={(event) => {
        setFocused(true);
        event.currentTarget.select();
      }}
      onBlur={() => {
        setFocused(false);
        setDraft(formatFeeInput(value));
      }}
      onChange={(event) => handleChange(event.target.value)}
      inputMode="decimal"
      placeholder="0,00"
      aria-label="Taxa de entrega"
    />
  );
}

function ScheduleCard({
  openingHours,
  updateOpeningHours,
}: {
  openingHours: DeliveryOpeningHours;
  updateOpeningHours: (
    key: keyof Omit<DeliveryOpeningHours, "weekday">,
    patch: Partial<OpeningHourRange>,
  ) => void;
}) {
  const days: Array<{
    key: keyof Omit<DeliveryOpeningHours, "weekday">;
    label: string;
  }> = [
    { key: "monday", label: "Segunda-feira" },
    { key: "tuesday", label: "Terca-feira" },
    { key: "wednesday", label: "Quarta-feira" },
    { key: "thursday", label: "Quinta-feira" },
    { key: "friday", label: "Sexta-feira" },
    { key: "saturday", label: "Sabado" },
    { key: "sunday", label: "Domingo" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horarios de funcionamento</CardTitle>
        <CardDescription>
          Configure quando sua pizzaria aceita pedidos de entrega.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {days.map((day) => (
          <div
            key={day.key}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">{day.label}</p>
              <button
                type="button"
                onClick={() =>
                  updateOpeningHours(day.key, {
                    enabled: openingHours[day.key].enabled === false,
                  })
                }
                className={`rounded-full px-3 py-1 text-xs font-black transition ${
                  openingHours[day.key].enabled === false
                    ? "bg-slate-200 text-slate-500"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {openingHours[day.key].enabled === false ? "Fechado" : "Aberto"}
              </button>
            </div>
            <div
              className={`mt-3 grid grid-cols-2 gap-2 ${
                openingHours[day.key].enabled === false ? "opacity-45" : ""
              }`}
            >
              <Input
                type="time"
                value={openingHours[day.key].open}
                disabled={openingHours[day.key].enabled === false}
                onChange={(event) =>
                  updateOpeningHours(day.key, { open: event.target.value })
                }
              />
              <Input
                type="time"
                value={openingHours[day.key].close}
                disabled={openingHours[day.key].enabled === false}
                onChange={(event) =>
                  updateOpeningHours(day.key, { close: event.target.value })
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
