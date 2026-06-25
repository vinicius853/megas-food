"use client";

import { ChevronDown, CirclePlus, Ruler } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import type {
  Category,
  SizeOptionMatrixRow,
} from "../types/menu-management";
import { getPizzaModelLabel } from "./pizza-pricing-helpers";
import { PizzaSizeCard } from "./pizza-size-card";

type Props = {
  baseCategories: Category[];
  baseCategoryId: string;
  needsBaseCategory: boolean;
  sizes: SizeOptionMatrixRow[];
  onAdd: (type: "round" | "square") => string | null;
  onBaseCategoryChange: (value: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<SizeOptionMatrixRow>) => void;
};

export function PizzaSizesPanel({
  baseCategories,
  baseCategoryId,
  needsBaseCategory,
  sizes,
  onAdd,
  onBaseCategoryChange,
  onRemove,
  onUpdate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [inactiveOpen, setInactiveOpen] = useState(true);
  const activeSizes = sizes.filter((size) => size.isActive !== false);
  const inactiveSizes = sizes.filter((size) => size.isActive === false);
  const canCreateBaseProduct = !needsBaseCategory || Boolean(baseCategoryId);

  function add(type: "round" | "square") {
    const created = onAdd(type);
    if (created) setOpen(true);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
        aria-expanded={open}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <Ruler className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-base font-black text-slate-950">
            Configurar tamanhos da pizzaria
          </span>
          <span className="mt-0.5 block text-sm text-slate-500">
            Tamanhos, fatias, bordas e limite de sabores.
          </span>
        </span>

        <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 sm:block">
          {activeSizes.length} ativos
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          {needsBaseCategory && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
              <label className="block text-sm font-black text-slate-900">
                Categoria visual do produto-base
              </label>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Escolha em qual categoria visual o produto-base da pizza será
                criado. Isso não limita os sabores; cada sabor poderá aparecer
                em Tradicionais, Especiais, Doces etc.
              </p>

              <select
                value={baseCategoryId}
                onChange={(event) => onBaseCategoryChange(event.target.value)}
                className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-500 sm:max-w-sm"
              >
                {baseCategories.length === 0 && (
                  <option value="">Nenhuma categoria ativa</option>
                )}
                {baseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-orange-900">
                {getPizzaModelLabel(sizes)}
              </p>
              <p className="mt-0.5 text-xs text-orange-700">
                Preço de pizza com vários sabores: maior preço selecionado.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canCreateBaseProduct}
                onClick={() => add("round")}
              >
                <CirclePlus className="h-4 w-4" />
                Tamanho redondo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canCreateBaseProduct}
                onClick={() => add("square")}
              >
                <CirclePlus className="h-4 w-4" />
                Tamanho quadrado
              </Button>
            </div>
          </div>

          {activeSizes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
              <p className="font-black text-slate-800">
                Nenhum tamanho ativo
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Adicione o primeiro tamanho para liberar preços dos sabores.
              </p>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {activeSizes.map((size) => (
                <PizzaSizeCard
                  key={size.id}
                  size={size}
                  onChange={(patch) => onUpdate(size.id, patch)}
                  onRemove={() => onRemove(size.id)}
                />
              ))}
            </div>
          )}

          {inactiveSizes.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setInactiveOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                aria-expanded={inactiveOpen}
              >
                <span>
                  <span className="block text-sm font-black text-slate-800">
                    Tamanhos inativos ({inactiveSizes.length})
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                    Precos e regras ficam preservados para reativacao.
                  </span>
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-400 transition ${
                    inactiveOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {inactiveOpen && (
                <div className="border-t border-slate-100 bg-slate-50 p-4">
                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {inactiveSizes.map((size) => (
                      <PizzaSizeCard
                        key={size.id}
                        size={size}
                        inactiveMode
                        onChange={(patch) => onUpdate(size.id, patch)}
                        onRemove={() => onRemove(size.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
