"use client";

import {
  ChevronDown,
  MoreVertical,
  Pizza,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { ImageUploadField } from "../components/image-upload-field";
import { isNewFlavorDraft } from "../hooks/menu-management-drafts";
import type {
  Category,
  FlavorOptionMatrixRow,
  FlavorPrice,
  SizeOptionMatrixRow,
} from "../types/menu-management";
import { countAvailableSizes } from "./pizza-pricing-helpers";
import { PizzaPriceGrid } from "./pizza-price-grid";

type Props = {
  expanded: boolean;
  flavor: FlavorOptionMatrixRow;
  flavorGroups: Category[];
  prices: FlavorPrice[];
  sizes: SizeOptionMatrixRow[];
  onExpandedChange: () => void;
  onRemove: () => void;
  onSetAvailability: (
    productId: string,
    flavorId: string,
    sizeId: string,
    enabled: boolean,
  ) => void;
  onUpdateActive: (value: boolean) => void;
  onUpdateCategory: (value: string) => void;
  onUpdateDescription: (value: string) => void;
  onUpdateImage: (value: string | null) => void;
  onUpdateName: (value: string) => void;
  onUpdatePrice: (
    productId: string,
    flavorId: string,
    sizeId: string,
    value: string,
  ) => void;
};

export function PizzaFlavorCard({
  expanded,
  flavor,
  flavorGroups,
  prices,
  sizes,
  onExpandedChange,
  onRemove,
  onSetAvailability,
  onUpdateActive,
  onUpdateCategory,
  onUpdateDescription,
  onUpdateImage,
  onUpdateName,
  onUpdatePrice,
}: Props) {
  const category = flavorGroups.find((group) => group.id === flavor.categoryId);
  const availableSizes = countAvailableSizes(prices, flavor.id);

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white transition ${
        expanded ? "border-orange-200 shadow-sm" : "border-slate-200"
      } ${flavor.isActive ? "" : "opacity-70"}`}
    >
      <button
        type="button"
        onClick={onExpandedChange}
        className="flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 sm:px-5"
        aria-expanded={expanded}
      >
        <span className="flex h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-orange-50">
          {flavor.imageUrl ? (
            <img
              src={flavor.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-orange-500">
              <Pizza className="h-6 w-6" />
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-black text-slate-950 sm:text-base">
              {flavor.name || "Novo sabor"}
            </span>
            <Badge variant={flavor.isActive ? "success" : "default"}>
              {flavor.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </span>
          <span className="mt-1 line-clamp-1 block text-sm text-slate-500">
            {[category?.name, flavor.description].filter(Boolean).join(" · ") ||
              "Preencha os dados deste sabor."}
          </span>
        </span>

        <span className="hidden text-right sm:block">
          <span className="block text-xs font-black text-slate-700">
            {availableSizes} tamanhos
          </span>
          <span className="text-xs text-slate-400">com preço</span>
        </span>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition ${
            expanded ? "rotate-180" : ""
          }`}
        />
        <MoreVertical className="h-4 w-4 shrink-0 text-slate-300" />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 sm:p-5">
          <div className="grid min-w-0 gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
            <ImageUploadField
              imageUrl={flavor.imageUrl}
              label={flavor.name || "sabor"}
              onChange={onUpdateImage}
            />

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <label className="min-w-0 text-xs font-black uppercase text-slate-500">
                Nome do sabor
                <input
                  autoFocus={isNewFlavorDraft(flavor)}
                  value={flavor.name}
                  onChange={(event) => onUpdateName(event.target.value)}
                  placeholder="Ex.: Calabresa"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold normal-case text-slate-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />
              </label>

              <label className="min-w-0 text-xs font-black uppercase text-slate-500">
                Categoria visual
                <select
                  value={flavor.categoryId ?? ""}
                  onChange={(event) => onUpdateCategory(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case text-slate-700 outline-none focus:border-orange-500"
                >
                  <option value="">Sem categoria</option>
                  {flavorGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 text-xs font-black uppercase text-slate-500 sm:col-span-2">
                Ingredientes ou descrição
                <textarea
                  value={flavor.description ?? ""}
                  onChange={(event) =>
                    onUpdateDescription(event.target.value)
                  }
                  rows={3}
                  placeholder="Molho, mussarela, calabresa fatiada..."
                  className="mt-1.5 min-h-[88px] w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium normal-case leading-6 text-slate-700 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <h4 className="text-sm font-black text-slate-950">
                Preços por tamanho
              </h4>
              <p className="mt-0.5 text-xs text-slate-500">
                Desmarque um tamanho para ocultar este sabor nele.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={flavor.isActive}
                  onChange={(event) => onUpdateActive(event.target.checked)}
                  className="h-4 w-4 accent-orange-600"
                />
                Sabor ativo
              </label>
              <button
                type="button"
                onClick={onRemove}
                title="Desativar ou descartar sabor"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <PizzaPriceGrid
              flavor={flavor}
              prices={prices}
              sizes={sizes}
              onAvailabilityChange={onSetAvailability}
              onPriceChange={onUpdatePrice}
            />
          </div>
        </div>
      )}
    </article>
  );
}
