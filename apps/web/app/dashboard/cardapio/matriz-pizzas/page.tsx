'use client'

import { useState } from 'react'

import {
  Plus,
  Save,
  Search,
} from 'lucide-react'

import {
  PageContainer,
  PageHeader,
} from '../../../../components/layout/page-container'

import {
  Card,
  CardContent,
} from '../../../../components/ui/card'

import { Button } from '../../../../components/ui/button'

const sizes = ['30cm', '35cm', '40cm']

const initialRows = [
  {
    id: 1,
    flavor: 'Calabresa',
    prices: {
      '30cm': '35,00',
      '35cm': '45,00',
      '40cm': '55,00',
    },
  },
  {
    id: 2,
    flavor: 'Mussarela',
    prices: {
      '30cm': '34,00',
      '35cm': '44,00',
      '40cm': '54,00',
    },
  },
  {
    id: 3,
    flavor: 'Frango Catupiry',
    prices: {
      '30cm': '38,00',
      '35cm': '48,00',
      '40cm': '58,00',
    },
  },
]

export default function MatrizPizzasPage() {
  const [rows, setRows] = useState(initialRows)
  const [search, setSearch] = useState('')

  function updatePrice(
    rowId: number,
    size: string,
    value: string,
  ) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              prices: {
                ...row.prices,
                [size]: value,
              },
            }
          : row,
      ),
    )
  }

  const filteredRows = rows.filter((row) =>
    row.flavor.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <PageContainer>
      <PageHeader
        title="Matriz de pizzas"
        description="Configure sabores e preços em formato de planilha."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              Novo sabor
            </Button>

            <Button variant="primary" size="sm">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        }
      />

      <Card className="mb-5 border-orange-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4">
            <Search className="h-4 w-4 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar sabor..."
              className="h-12 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-orange-100">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-orange-600 text-white">
              <tr>
                <th className="min-w-[240px] px-5 py-4 text-left text-sm font-black uppercase tracking-wide">
                  Sabor
                </th>

                {sizes.map((size) => (
                  <th
                    key={size}
                    className="min-w-[160px] px-4 py-4 text-center text-sm font-black uppercase tracking-wide"
                  >
                    {size}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 bg-white"
                >
                  <td className="px-5 py-4">
                    <strong className="text-base text-slate-900">
                      {row.flavor}
                    </strong>

                    <p className="mt-1 text-xs text-slate-400">
                      Pizza tradicional
                    </p>
                  </td>

                  {sizes.map((size) => (
                    <td key={size} className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <div className="flex w-full max-w-[120px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-3">
                          <span className="text-sm font-bold text-slate-500">
                            R$
                          </span>

                          <input
                            value={
                              row.prices[
                                size as keyof typeof row.prices
                              ]
                            }
                            onChange={(event) =>
                              updatePrice(
                                row.id,
                                size,
                                event.target.value,
                              )
                            }
                            className="h-12 w-full bg-transparent px-2 text-center text-base font-bold text-slate-900 outline-none"
                          />
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  )
}
