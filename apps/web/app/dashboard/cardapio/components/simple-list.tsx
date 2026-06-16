import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  type Category,
  type CategoryType,
  type CategoryUpdater,
  type Product,
  type ProductUpdater,
} from "../types/menu-management";

import { MoneyInput } from "./money-input";
import { ImageUploadField } from "./image-upload-field";
import {
  isNewCategoryDraft,
  isNewProductDraft,
} from "../hooks/menu-management-drafts";
import { getCategoryMoveAvailability } from "../hooks/category-order";

const protectedCategorySlugs = ["pizzas", "bebidas", "adicionais"];

function isProtectedCategory(category: Category) {
  return protectedCategorySlugs.includes(category.slug ?? "");
}

function getCategoryTypeLabel(type: CategoryType) {
  return type === "PIZZA_FLAVOR_GROUP"
    ? "Grupo de sabores de pizza"
    : "Seção de produtos";
}

export function SimpleProductList({
  title,
  items,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  items: Product[];
  onAdd: () => void;
  onUpdate: ProductUpdater;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-950">{title}</h3>

          <p className="mt-1 text-sm text-slate-500">
            Cadastre, edite ou remova itens desta seção.
          </p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto]"
          >
            <div className="grid gap-3 md:grid-cols-[240px_1fr]">
              <ImageUploadField
                imageUrl={item.imageUrl}
                label={item.name || title}
                onChange={(value) => onUpdate(item.id, "imageUrl", value)}
              />

              <div className="space-y-2">
                <input
                  autoFocus={isNewProductDraft(item)}
                  value={item.name}
                  onChange={(event) =>
                    onUpdate(item.id, "name", event.target.value)
                  }
                  placeholder="Nome do produto"
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-black outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                />

                <textarea
                  value={item.description ?? ""}
                  onChange={(event) =>
                    onUpdate(item.id, "description", event.target.value)
                  }
                  maxLength={220}
                  rows={2}
                  placeholder="Descricao opcional: ingredientes, preparo ou detalhes do item."
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold leading-relaxed text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <MoneyInput
                value={item.price ?? "0,00"}
                onChange={(value) => onUpdate(item.id, "price", value)}
              />

              <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-3 text-xs font-bold text-slate-500">
                <input
                  type="checkbox"
                  checked={item.isActive}
                  onChange={(event) =>
                    onUpdate(item.id, "isActive", event.target.checked)
                  }
                />
                Ativo
              </label>

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimpleCategoryList({
  categories,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
}: {
  categories: Category[];
  onAdd: (type?: CategoryType) => void;
  onUpdate: CategoryUpdater;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-950">Categorias</h3>

          <p className="mt-1 text-sm text-slate-500">
            Separe seções de produtos dos grupos de sabores de pizza.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAdd("PRODUCT_SECTION")}
          >
            <Plus className="h-4 w-4" />
            Seção de produtos
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAdd("PIZZA_FLAVOR_GROUP")}
          >
            <Plus className="h-4 w-4" />
            Grupo de sabores
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((category) => {
          const protectedCategory = isProtectedCategory(category);
          const { canMoveUp, canMoveDown } = getCategoryMoveAvailability(
            categories,
            category.id,
          );

          return (
            <div
              key={category.id}
              className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_260px_auto]"
            >
              <input
                autoFocus={isNewCategoryDraft(category)}
                value={category.name}
                onChange={(event) =>
                  onUpdate(category.id, "name", event.target.value)
                }
                disabled={protectedCategory}
                className={`h-11 rounded-2xl border border-slate-200 px-4 text-sm font-black outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 ${
                  protectedCategory
                    ? "bg-slate-50 text-slate-500"
                    : "bg-white text-slate-950"
                }`}
              />

              {protectedCategory ? (
                <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-500">
                  {getCategoryTypeLabel(category.type)}
                </div>
              ) : (
                <select
                  value={category.type}
                  onChange={(event) =>
                    onUpdate(
                      category.id,
                      "type",
                      event.target.value as CategoryType,
                    )
                  }
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                >
                  <option value="PRODUCT_SECTION">Seção de produtos</option>

                  <option value="PIZZA_FLAVOR_GROUP">
                    Grupo de sabores de pizza
                  </option>
                </select>
              )}

              <div className="flex flex-wrap gap-2">
                <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    title="Mover para cima"
                    aria-label={`Mover ${category.name || "categoria"} para cima`}
                    disabled={!canMoveUp}
                    onClick={() => onMove(category.id, "up")}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Mover para baixo"
                    aria-label={`Mover ${category.name || "categoria"} para baixo`}
                    disabled={!canMoveDown}
                    onClick={() => onMove(category.id, "down")}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>

                <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-3 text-xs font-bold text-slate-500">
                  <input
                    type="checkbox"
                    checked={category.isActive}
                    disabled={protectedCategory}
                    onChange={(event) =>
                      onUpdate(category.id, "isActive", event.target.checked)
                    }
                  />
                  Ativa
                </label>

                {!protectedCategory && (
                  <button
                    type="button"
                    onClick={() => onRemove(category.id)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
