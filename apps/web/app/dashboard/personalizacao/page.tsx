"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import {
  Check,
  Eye,
  ImageIcon,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/page-container";

type Palette = {
  id: string;
  name: string;
  colors: string[];
};

type CustomizationSettings = {
  logoUrl: string;
  coverUrl: string;
  coverPositionX: number;
  coverPositionY: number;
  paletteId: string;
  brandName: string;
  tagline: string;
};

type CustomizationResponse = CustomizationSettings & {
  tenantName: string;
  effectiveBrandName: string;
};

const palettes: Palette[] = [
  {
    id: "classic-pizza",
    name: "Pizza Classica",
    colors: ["#D90416", "#FF4A00", "#FDBA21", "#FFF4DC"],
  },
  {
    id: "hot-spicy",
    name: "Quente & Apimentado",
    colors: ["#5F0208", "#C1121F", "#F97316", "#FACC15"],
  },
  {
    id: "fresh-healthy",
    name: "Fresco & Saudavel",
    colors: ["#14532D", "#16A34A", "#BBF7D0", "#FFFFFF"],
  },
  {
    id: "burger-grill",
    name: "Burger & Grill",
    colors: ["#4A2C17", "#C05621", "#111827", "#FFF7ED"],
  },
  {
    id: "elegant",
    name: "Elegante",
    colors: ["#0F172A", "#164E63", "#CBD5E1", "#FFFFFF"],
  },
  {
    id: "sweet-warm",
    name: "Doce & Aconchego",
    colors: ["#F5E7D3", "#FDBA9B", "#FDA4AF", "#FFF7ED"],
  },
  {
    id: "wood-fired-oven",
    name: "Forno a Lenha",
    colors: ["#B8321B", "#E85D1C", "#F6A23A", "#FFF1DC"],
  },
  {
    id: "italian-cantina",
    name: "Cantina Italiana",
    colors: ["#0F6B3A", "#D62828", "#F4A261", "#FFF3E0"],
  },
  {
    id: "popular-delivery",
    name: "Delivery Popular",
    colors: ["#E63900", "#FFB703", "#2B2D42", "#FFF8E8"],
  },
  {
    id: "bbq-ember",
    name: "Churrasco & Brasa",
    colors: ["#3A1F12", "#7A2E12", "#D97706", "#FFF4E6"],
  },
  {
    id: "tropical-acai",
    name: "Acai Tropical",
    colors: ["#4B145F", "#7B2CBF", "#F72585", "#E9D8FD"],
  },
  {
    id: "bakery-coffee",
    name: "Padaria & Cafe",
    colors: ["#5C3317", "#A0522D", "#D9A441", "#FFF4DC"],
  },
  {
    id: "crispy-pastry",
    name: "Pastelaria Crocante",
    colors: ["#C2410C", "#F59E0B", "#78350F", "#FFF7ED"],
  },
  {
    id: "dark-premium",
    name: "Premium Escuro",
    colors: ["#111827", "#7C2D12", "#D97706", "#F8E7C9"],
  },
];

const emptySettings: CustomizationSettings = {
  logoUrl: "",
  coverUrl: "",
  coverPositionX: 50,
  coverPositionY: 50,
  paletteId: "classic-pizza",
  brandName: "",
  tagline: "",
};

const MAX_MENU_IMAGE_SIZE_MB = 10;
const MAX_MENU_IMAGE_SIZE_BYTES =
  MAX_MENU_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_MENU_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function clampCoverPosition(value: number) {
  if (!Number.isFinite(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, value));
}

const tabs = ["Identidade visual", "Capa e imagens"];

export default function PersonalizacaoPage() {
  const [settings, setSettings] =
    useState<CustomizationSettings>(emptySettings);
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<
    "logoUrl" | "coverUrl" | null
  >(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [customization, tenant] = await Promise.all([
        apiFetch<CustomizationResponse>("/dashboard-settings/customization"),
        apiFetch<{ slug: string; name: string; logoUrl?: string | null }>(
          "/tenants/me",
        ),
      ]);

      setSettings({
        logoUrl: customization.logoUrl || tenant.logoUrl || "",
        coverUrl: customization.coverUrl || "",
        coverPositionX: clampCoverPosition(
          customization.coverPositionX ?? 50,
        ),
        coverPositionY: clampCoverPosition(
          customization.coverPositionY ?? 50,
        ),
        paletteId: customization.paletteId || emptySettings.paletteId,
        brandName: customization.brandName?.trim() || "",
        tagline: customization.tagline || "",
      });
      setTenantSlug(tenant.slug || "");
      setTenantName(customization.tenantName || tenant.name || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar personalizacao.",
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

      const customization = await apiFetch<CustomizationResponse>(
        "/dashboard-settings/customization",
        {
          method: "PUT",
          body: JSON.stringify({
            ...settings,
            brandName: settings.brandName.trim(),
          }),
        },
      );

      setSettings((current) => ({
        ...current,
        brandName: customization.brandName,
        coverPositionX: customization.coverPositionX,
        coverPositionY: customization.coverPositionY,
      }));
      setTenantName(customization.tenantName);

      window.dispatchEvent(new Event("dashboard-brand-updated"));
      setMessage("Personalizacao salva com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar personalizacao.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleFile(
    field: "logoUrl" | "coverUrl",
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    if (!ACCEPTED_MENU_IMAGE_MIME_TYPES.has(file.type)) {
      setError(
        "Formato inválido. Envie uma imagem em PNG, JPG ou WEBP.",
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_MENU_IMAGE_SIZE_BYTES) {
      setError(
        `Imagem muito grande. Envie um arquivo de até ${MAX_MENU_IMAGE_SIZE_MB} MB.`,
      );
      event.target.value = "";
      return;
    }

    try {
      setUploadingField(field);

      const formData = new FormData();
      formData.append("image", file);

      const response = await apiFetch<{ url: string }>("/uploads/menu-image", {
        method: "POST",
        body: formData,
      });

      setSettings((current) => ({
        ...current,
        [field]: response.url,
      }));

      setMessage(
        field === "logoUrl"
          ? "Logo enviada com sucesso. Clique em salvar alteracoes para publicar."
          : "Imagem de capa enviada com sucesso. Clique em salvar alteracoes para publicar.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploadingField(null);
      event.target.value = "";
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Personalizacao do cardapio digital"
        description="Deixe seu cardapio com a cara da sua marca e ofereca uma experiencia unica aos seus clientes."
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

      <div className="space-y-5">
        {activeTab === "Identidade visual" && (
          <>
            <PublicNameCard
              brandName={settings.brandName}
              tenantName={tenantName}
              onChange={(brandName) =>
                setSettings((current) => ({ ...current, brandName }))
              }
            />

            <LogoCard
              logoUrl={settings.logoUrl}
              onChange={(event) => handleFile("logoUrl", event)}
              onRemove={() =>
                setSettings((current) => ({ ...current, logoUrl: "" }))
              }
              uploading={uploadingField === "logoUrl"}
            />

            <PaletteCard
              selectedId={settings.paletteId}
              onSelect={(paletteId) =>
                setSettings((current) => ({ ...current, paletteId }))
              }
            />
          </>
        )}

        {activeTab === "Capa e imagens" && (
          <CoverCard
            coverUrl={settings.coverUrl}
            coverPositionX={settings.coverPositionX}
            coverPositionY={settings.coverPositionY}
            onChange={(event) => handleFile("coverUrl", event)}
            onRemove={() =>
              setSettings((current) => ({ ...current, coverUrl: "" }))
            }
            onPositionChange={(coverPositionX, coverPositionY) =>
              setSettings((current) => ({
                ...current,
                coverPositionX,
                coverPositionY,
              }))
            }
            uploading={uploadingField === "coverUrl"}
          />
        )}
      </div>
    </PageContainer>
  );
}

function PublicNameCard({
  brandName,
  tenantName,
  onChange,
}: {
  brandName: string;
  tenantName: string;
  onChange: (value: string) => void;
}) {
  const effectiveName = brandName.trim() || tenantName.trim() || "Loja";

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Nome público da loja</CardTitle>
        <CardDescription>
          Nome exibido no cardápio, WhatsApp e comunicações ao cliente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          value={brandName}
          onChange={(event) => onChange(event.target.value)}
          placeholder={tenantName || "Nome cadastrado da loja"}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-orange-500"
        />
        <p className="mt-2 text-xs font-medium text-slate-500">
          Deixe vazio para usar automaticamente o nome cadastrado da loja.
        </p>
        <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
          Nome exibido atualmente:{" "}
          <strong className="text-slate-900">{effectiveName}</strong>
        </p>
      </CardContent>
    </Card>
  );
}

function LogoCard({
  logoUrl,
  onChange,
  onRemove,
  uploading,
}: {
  logoUrl: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Logo da sua marca</CardTitle>
        <CardDescription>
          Esse logo aparecera no cabecalho do seu cardapio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-12 w-12 text-orange-500" />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <FileButton
              label={uploading ? "Enviando..." : "Alterar logo"}
              onChange={onChange}
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onRemove}
              disabled={uploading}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
              Remover
            </Button>
          </div>
        </div>

        <div className="mt-3 space-y-1 text-xs font-medium text-slate-500">
          <p>Formatos aceitos: PNG, JPG ou WEBP.</p>
          <p>Tamanho máximo: {MAX_MENU_IMAGE_SIZE_MB} MB.</p>
          <p>Recomendado para logo: 512x512 px.</p>
          <p className="font-normal">
            Para melhor desempenho, prefira imagens otimizadas abaixo de 2 MB.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PaletteCard({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (paletteId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Cores do seu cardapio</CardTitle>
        <CardDescription>
          Escolha uma paleta de cores que combine com sua marca.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {palettes.map((palette) => {
          const selected = selectedId === palette.id;
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => onSelect(palette.id)}
              className={`relative rounded-3xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                selected
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              {selected && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <div className="flex overflow-hidden rounded-2xl">
                {palette.colors.map((color) => (
                  <span
                    key={color}
                    className="h-9 flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm font-black text-slate-800">
                {palette.name}
              </p>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CoverCard({
  coverUrl,
  coverPositionX,
  coverPositionY,
  onChange,
  onRemove,
  onPositionChange,
  uploading,
}: {
  coverUrl: string;
  coverPositionX: number;
  coverPositionY: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onPositionChange: (x: number, y: number) => void;
  uploading: boolean;
}) {
  function movePosition(xDelta: number, yDelta: number) {
    onPositionChange(
      clampCoverPosition(coverPositionX + xDelta),
      clampCoverPosition(coverPositionY + yDelta),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Imagem de capa</CardTitle>
        <CardDescription>
          Essa imagem sera exibida no topo do seu cardapio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-[3/1] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Capa"
              className="h-full w-full object-cover"
              style={{
                objectPosition: `${coverPositionX}% ${coverPositionY}%`,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <FileButton
            label={uploading ? "Enviando..." : "Alterar imagem"}
            onChange={onChange}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onRemove}
            disabled={uploading}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
            Remover
          </Button>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-900">Posição da capa</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
            Ajuste o enquadramento da imagem quando ela cortar no celular ou em
            telas menores.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => movePosition(0, -5)}
              disabled={uploading}
            >
              ↑ Subir
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => movePosition(0, 5)}
              disabled={uploading}
            >
              ↓ Descer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => movePosition(-5, 0)}
              disabled={uploading}
            >
              ← Esquerda
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => movePosition(5, 0)}
              disabled={uploading}
            >
              → Direita
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPositionChange(50, 50)}
              disabled={uploading}
            >
              Centralizar
            </Button>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Posição atual: X {coverPositionX}%, Y {coverPositionY}%
          </p>
        </div>
        <div className="mt-3 space-y-1 text-xs font-medium text-slate-500">
          <p>Formatos aceitos: PNG, JPG ou WEBP.</p>
          <p>Tamanho máximo: {MAX_MENU_IMAGE_SIZE_MB} MB.</p>
          <p>Recomendado para capa desktop: 1920x600 px.</p>
          <p>Recomendado para capa mobile: 1080x720 px.</p>
          <p className="font-normal">
            Para melhor resultado no celular, use uma arte adaptada ou mantenha
            textos e elementos importantes no centro.
          </p>
          <p className="font-normal">
            Para melhor desempenho, prefira imagens otimizadas abaixo de 2 MB.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FileButton({
  label,
  onChange,
  disabled = false,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-orange-50 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <Upload className="h-4 w-4" />
      {label}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  );
}
