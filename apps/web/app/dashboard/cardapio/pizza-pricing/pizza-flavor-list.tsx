"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import type {
  Category,
  FlavorOptionMatrixRow,
  FlavorPrice,
  SizeOptionMatrixRow,
} from "../types/menu-management";
import {
  ALL_FLAVOR_CATEGORIES,
  buildFlavorCategoryOptions,
  matchesFlavorCategoryFilter,
} from "./pizza-pricing-helpers";
import { PizzaFlavorCard } from "./pizza-flavor-card";

type Props = {
  flavorGroups: Category[];
  flavorPrices: FlavorPrice[];
  flavors: FlavorOptionMatrixRow[];
  search: string;
  sizes: SizeOptionMatrixRow[];
  onAddFlavor: () => string;
  onRemoveFlavor: (id: string) => void;
  onSearchChange: (value: string) => void;
  onSetAvailability: (
    productId: string,
    flavorId: string,
    sizeId: string,
    enabled: boolean,
  ) => void;
  onUpdateActive: (id: string, value: boolean) => void;
  onUpdateCategory: (id: string, value: string) => void;
  onUpdateDescription: (id: string, value: string) => void;
  onUpdateImage: (id: string, value: string | null) => void;
  onUpdateName: (id: string, value: string) => void;
  onUpdatePrice: (
    productId: string,
    flavorId: string,
    sizeId: string,
    value: string,
  ) => void;
};

export function PizzaFlavorList(props: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [selectedCategory, setSelectedCategory] = useState(
    ALL_FLAVOR_CATEGORIES,
  );

  const categoryOptions = useMemo(
    () => buildFlavorCategoryOptions(props.flavors, props.flavorGroups),
    [props.flavors, props.flavorGroups],
  );
  const selectedCategoryFilter = categoryOptions.some(
    (option) => option.key === selectedCategory,
  )
    ? selectedCategory
    : ALL_FLAVOR_CATEGORIES;

  const visibleFlavors = useMemo(() => {
    const query = props.search.trim().toLocaleLowerCase("pt-BR");
    return props.flavors.filter((flavor) => {
      const matchesSearch =
        !query ||
        flavor.name.toLocaleLowerCase("pt-BR").includes(query) ||
        String(flavor.description ?? "")
          .toLocaleLowerCase("pt-BR")
          .includes(query);
      const matchesStatus =
        status === "all" ||
        (status === "active" && flavor.isActive) ||
        (status === "inactive" && !flavor.isActive);
      const matchesCategory = matchesFlavorCategoryFilter(
        flavor,
        props.flavorGroups,
        selectedCategoryFilter,
      );

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [
    props.flavors,
    props.flavorGroups,
    props.search,
    selectedCategoryFilter,
    status,
  ]);

  function addFlavor() {
    const id = props.onAddFlavor();
    setExpandedIds((current) => new Set(current).add(id));
  }

  function toggle(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-950">
            Sabores de pizza
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Defina disponibilidade e preço de cada sabor por tamanho.
          </p>
        </div>

        <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(13rem,1fr)_minmax(11rem,auto)_auto_auto] lg:min-w-[42rem]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={props.search}
              onChange={(event) => props.onSearchChange(event.target.value)}
              placeholder="Buscar sabor..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-medium outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={(event) => setSelectedCategory(event.target.value)}
            disabled={categoryOptions.length === 0}
            className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value={ALL_FLAVOR_CATEGORIES}>Todas as categorias</option>
            {categoryOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as typeof status)
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-500"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>

          <Button type="button" size="sm" onClick={addFlavor}>
            <Plus className="h-4 w-4" />
            Novo sabor
          </Button>
        </div>
      </header>

      <div className="space-y-2 bg-slate-50/60 p-3 sm:p-4">
        {visibleFlavors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <p className="font-black text-slate-800">
              Nenhum sabor encontrado
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre um sabor ou ajuste os filtros.
            </p>
          </div>
        ) : (
          visibleFlavors.map((flavor) => (
            <PizzaFlavorCard
              key={flavor.id}
              expanded={expandedIds.has(flavor.id)}
              flavor={flavor}
              flavorGroups={props.flavorGroups}
              prices={props.flavorPrices}
              sizes={props.sizes}
              onExpandedChange={() => toggle(flavor.id)}
              onRemove={() => props.onRemoveFlavor(flavor.id)}
              onSetAvailability={props.onSetAvailability}
              onUpdateActive={(value) =>
                props.onUpdateActive(flavor.id, value)
              }
              onUpdateCategory={(value) =>
                props.onUpdateCategory(flavor.id, value)
              }
              onUpdateDescription={(value) =>
                props.onUpdateDescription(flavor.id, value)
              }
              onUpdateImage={(value) =>
                props.onUpdateImage(flavor.id, value)
              }
              onUpdateName={(value) =>
                props.onUpdateName(flavor.id, value)
              }
              onUpdatePrice={props.onUpdatePrice}
            />
          ))
        )}

        <button
          type="button"
          onClick={addFlavor}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-white text-sm font-black text-orange-600 transition hover:bg-orange-50"
        >
          <Plus className="h-4 w-4" />
          Novo sabor
        </button>
      </div>
    </section>
  );
}
