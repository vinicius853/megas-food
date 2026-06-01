import {
  Plus,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

import {
  type BorderPrice,
  type PizzaBorder,
  type PizzaSizeConfig,
  findBorderPrice,
} from '../types/menu-management'

import { MoneyInput } from './money-input'

export function BorderPriceMatrix({
  borders,
  sizes,
  borderPrices,
  onAddBorder,
  onRemoveBorder,
  onUpdateBorderName,
  onUpdateBorderPrice,
}: {
  borders: PizzaBorder[]
  sizes: PizzaSizeConfig[]
  borderPrices: BorderPrice[]
  onAddBorder: () => void
  onRemoveBorder: (id: string) => void
  onUpdateBorderName: (id: string, value: string) => void
  onUpdateBorderPrice: (
    borderId: string,
    size: PizzaSizeConfig,
    value: string,
  ) => void
}) {
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

        <Button
          variant="outline"
          size="sm"
          onClick={onAddBorder}
        >
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
            Ative a opção “Aceita borda” nos tamanhos da pizza para montar esta matriz.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200">
          <table className="w-full min-w-[860px] border-collapse bg-white">
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

                <th className="w-[80px] px-4 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {borders.map((border) => (
                <tr
                  key={border.id}
                  className="border-b border-slate-100 transition hover:bg-orange-50/40"
                >
                  <td className="px-5 py-4">
                    <input
                      value={border.name}
                      onChange={(event) =>
                        onUpdateBorderName(
                          border.id,
                          event.target.value,
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                    />
                  </td>

                  {sizes.map((size) => (
                    <td
                      key={size.id}
                      className="px-4 py-4"
                    >
                      <MoneyInput
                        value={findBorderPrice(
                          borderPrices,
                          size.productId,
                          size.id,
                          border.id,
                        )}
                        onChange={(value) =>
                          onUpdateBorderPrice(
                            border.id,
                            size,
                            value,
                          )
                        }
                      />
                    </td>
                  ))}

                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveBorder(border.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

