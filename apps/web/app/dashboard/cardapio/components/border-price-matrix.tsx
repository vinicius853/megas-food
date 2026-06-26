"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import {
  type BorderPrice,
  type BorderOptionMatrixRow,
  type SizeOptionMatrixRow,
  findBorderPrice,
} from "../types/menu-management";

import { MoneyInput } from "./money-input";
import { isNewBorderDraft } from "../hooks/menu-management-drafts";
import { useFocusEditableItem } from "../hooks/use-focus-editable-item";

export function BorderPriceMatrix({
  borders,
  sizes,
  borderPrices,
  onAddBorder,
  onRemoveBorder,
  onUpdateBorderActive,
  onUpdateBorderName,
  onUpdateBorderPrice,
}: {
  borders: BorderOptionMatrixRow[];
  sizes: SizeOptionMatrixRow[];
  borderPrices: BorderPrice[];
  onAddBorder: () => string | undefined | void;
  onRemoveBorder: (id: string) => void;
  onUpdateBorderActive: (id: string, isActive: boolean) => void;
  onUpdateBorderName: (id: string, value: string) => void;
  onUpdateBorderPrice: (
    borderId: string,
    size: SizeOptionMatrixRow,
    value: string,
  ) => void;
}) {
  const [borderToFocusId, setBorderToFocusId] = useState<string | null>(null);
  useFocusEditableItem(borderToFocusId, setBorderToFocusId, "border-name");

  function addBorder() {
    const borderId = onAddBorder();
    if (borderId) setBorderToFocusId(borderId);
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-950">
            Bordas recheadas
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Defina o preço de cada borda para cada tamanho que aceita borda.
          </p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={addBorder}>
          <Plus className="h-4 w-4" />
          Nova borda
        </Button>
      </div>

      {sizes.length === 0 ? (
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-center">
          <h3 className="text-lg font-black text-orange-900">
            Nenhum tamanho aceita borda
          </h3>

          <p className="mt-2 text-sm text-orange-700">
            Ative a opção “Aceita borda” nos tamanhos da pizza para montar esta
            matriz.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-3xl border border-slate-200">
          <table className="w-full min-w-[980px] border-collapse bg-white">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-[260px] px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  Borda
                </th>

                {sizes.map((size) => (
                  <th
                    key={size.id}
                    className="px-4 py-4 text-center text-xs font-black uppercase tracking-wide text-slate-500"
                  >
                    {size.name}
                  </th>
                ))}

                <th className="w-[200px] min-w-[200px] px-4 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {borders.map((border) => (
                <tr
                  key={border.id}
                  className={`border-b border-slate-100 transition hover:bg-orange-50/40 ${
                    border.isActive ? "" : "bg-slate-50 opacity-60"
                  }`}
                >
                  <td className="px-5 py-4">
                    <input
                      id={`border-name-${border.id}`}
                      autoFocus={isNewBorderDraft(border)}
                      value={border.name}
                      onChange={(event) =>
                        onUpdateBorderName(border.id, event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                    />
                  </td>

                  {sizes.map((size) => (
                    <td key={size.id} className="px-4 py-4">
                      <MoneyInput
                        value={findBorderPrice(
                          borderPrices,
                          size.productId,
                          size.id,
                          border.id,
                        )}
                        onChange={(value) =>
                          onUpdateBorderPrice(border.id, size, value)
                        }
                      />
                    </td>
                  ))}

                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={border.isActive}
                          onChange={(event) =>
                            onUpdateBorderActive(
                              border.id,
                              event.target.checked,
                            )
                          }
                        />
                        {border.isActive ? "Ativa" : "Inativa"}
                      </label>

                      <button
                        type="button"
                        title="Excluir borda"
                        onClick={() => onRemoveBorder(border.id)}
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

          <div className="mt-4 flex justify-center">
            <Button type="button" variant="outline" size="sm" onClick={addBorder}>
              <Plus className="h-4 w-4" />
              Adicionar borda
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
