import { Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  type Category,
  type FlavorPrice,
  type FlavorOptionMatrixRow,
  type PizzaMode,
  type SizeOptionMatrixRow,
  findFlavorPrice,
} from "../types/menu-management";

import { MiniStat } from "./mini-stat";
import { ImageUploadField } from "./image-upload-field";
import { MoneyInput } from "./money-input";
import { isNewFlavorDraft } from "../hooks/menu-management-drafts";

export function PizzaPriceMatrix({
  pizzaMode,
  search,
  flavors,
  flavorPrices,
  flavorGroups,
  visibleSizes,
  onAddFlavor,
  onRemoveFlavor,
  onSearchChange,
  onUpdateFlavorCategory,
  onUpdateFlavorDescription,
  onUpdateFlavorImage,
  onUpdateFlavorName,
  onUpdateFlavorActive,
  onUpdatePizzaPrice,
}: {
  pizzaMode: PizzaMode;
  search: string;
  flavors: FlavorOptionMatrixRow[];
  flavorPrices: FlavorPrice[];
  flavorGroups: Category[];
  visibleSizes: SizeOptionMatrixRow[];
  onAddFlavor: () => void;
  onRemoveFlavor: (id: string) => void;
  onSearchChange: (value: string) => void;
  onUpdateFlavorCategory: (id: string, categoryId: string) => void;
  onUpdateFlavorDescription: (id: string, value: string) => void;
  onUpdateFlavorImage: (id: string, value: string | null) => void;
  onUpdateFlavorName: (id: string, value: string) => void;
  onUpdateFlavorActive: (id: string, isActive: boolean) => void;
  onUpdatePizzaPrice: (
    productId: string,
    flavorId: string,
    sizeId: string,
    value: string,
  ) => void;
}) {
  return (
    <>
      <div className="mb-5 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row">
          <div className="relative min-w-0 max-w-md flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar sabor..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddFlavor}
            className="h-12"
          >
            <Plus className="h-4 w-4" />
            Novo sabor
          </Button>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 lg:w-auto">
          <MiniStat label="Sabores" value={String(flavors.length)} />

          <MiniStat
            label="Tamanhos ativos"
            value={String(visibleSizes.length)}
          />

          <MiniStat
            label="Modelo"
            value={
              pizzaMode === "round"
                ? "Redonda"
                : pizzaMode === "square"
                  ? "Quadrada"
                  : "Misto"
            }
          />
        </div>
      </div>

      {visibleSizes.length === 0 ? (
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-center">
          <h3 className="text-lg font-black text-orange-900">
            Nenhum tamanho ativo para este modelo
          </h3>

          <p className="mt-2 text-sm text-orange-700">
            Cadastre ou ative pelo menos um tamanho no painel lateral.
          </p>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto rounded-3xl border border-slate-200">
          <table
            className="w-full border-collapse bg-white"
            style={{
              minWidth: `${620 + visibleSizes.length * 116}px`,
            }}
          >
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-[420px] px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  Sabor
                </th>

                {visibleSizes.map((size) => (
                  <th
                    key={size.id}
                    className="w-[116px] min-w-[116px] px-2 py-4 text-center text-xs font-black uppercase tracking-wide text-slate-500"
                  >
                    {size.name}
                  </th>
                ))}

                <th className="sticky right-0 z-10 w-[200px] min-w-[200px] bg-slate-50 px-2 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500 shadow-[-10px_0_18px_rgba(15,23,42,0.04)]">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {flavors.map((flavor) => (
                <tr
                  key={flavor.id}
                  className={`border-b border-slate-100 transition hover:bg-orange-50/40 ${
                    flavor.isActive ? "" : "bg-slate-50 opacity-60"
                  }`}
                >
                  <td className="px-5 py-4 align-top">
                    <input
                      autoFocus={isNewFlavorDraft(flavor)}
                      value={flavor.name}
                      onChange={(event) =>
                        onUpdateFlavorName(flavor.id, event.target.value)
                      }
                      placeholder="Nome do sabor"
                      className="w-full bg-transparent text-sm font-black text-slate-950 outline-none placeholder:text-slate-400"
                    />

                    <div className="mt-3 grid gap-3 md:grid-cols-[158px_minmax(220px,1fr)]">
                      <ImageUploadField
                        imageUrl={flavor.imageUrl}
                        label={flavor.name || "sabor"}
                        compact
                        onChange={(value) =>
                          onUpdateFlavorImage(flavor.id, value)
                        }
                      />

                      <div className="grid gap-2">
                        <select
                          value={flavor.categoryId ?? ""}
                          onChange={(event) =>
                            onUpdateFlavorCategory(
                              flavor.id,
                              event.target.value,
                            )
                          }
                          className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                        >
                          <option value="">Sem grupo</option>

                          {flavorGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>

                        <textarea
                          value={flavor.description ?? ""}
                          onChange={(event) =>
                            onUpdateFlavorDescription(
                              flavor.id,
                              event.target.value,
                            )
                          }
                          placeholder="Ingredientes da pizza..."
                          rows={3}
                          className="min-h-[86px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/15"
                        />
                      </div>
                    </div>
                  </td>

                  {visibleSizes.map((size) => (
                    <td
                      key={size.id}
                      className="w-[116px] min-w-[116px] px-2 py-4 align-top"
                    >
                      <MoneyInput
                        value={findFlavorPrice(
                          flavorPrices,
                          size.productId,
                          size.id,
                          flavor.id,
                        )}
                        onChange={(value) =>
                          onUpdatePizzaPrice(
                            size.productId,
                            flavor.id,
                            size.id,
                            value,
                          )
                        }
                      />
                    </td>
                  ))}

                  <td className="sticky right-0 z-10 bg-white px-2 py-4 text-right align-top shadow-[-10px_0_18px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-end gap-2">
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={flavor.isActive}
                          onChange={(event) =>
                            onUpdateFlavorActive(
                              flavor.id,
                              event.target.checked,
                            )
                          }
                        />
                        {flavor.isActive ? "Ativo" : "Inativo"}
                      </label>

                      <button
                        type="button"
                        title="Excluir sabor"
                        onClick={() => onRemoveFlavor(flavor.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
