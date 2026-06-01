'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { apiFetch } from '@/lib/api'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'

type ProductType =
  | 'PIZZA_ROUND'
  | 'PIZZA_SQUARE'
  | 'DRINK'
  | 'OTHER'

type Product = {
  id: string
  name: string
  type: ProductType
  isActive: boolean
}

type PizzaSizeType =
  | 'CM'
  | 'SLICES'
  | 'CUSTOM'

type PizzaSize = {
  id: string
  productId?: string
  subtitle?: string | null
}

interface PizzaSizeFormProps {
  products: Product[]
  sizes?: PizzaSize[]
  onCreated?: () => void
}

export function PizzaSizeForm({
  products,
  sizes = [],
  onCreated,
}: PizzaSizeFormProps) {
  const pizzaProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.isActive &&
          (product.type === 'PIZZA_ROUND' ||
            product.type ===
              'PIZZA_SQUARE'),
      ),
    [products],
  )

  const [productId, setProductId] =
    useState('')

  const [name, setName] = useState('')

  const [subtitle, setSubtitle] = useState('')

  const [type, setType] =
    useState<PizzaSizeType>('CM')

  const [value, setValue] = useState('')

  const [maxFlavors, setMaxFlavors] =
    useState('2')

  const [allowBorder, setAllowBorder] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] = useState('')

  async function handleSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault()

    if (!productId) {
      setError('Selecione um produto.')
      return
    }

    if (!name.trim()) {
      setError(
        'Digite o nome do tamanho.',
      )

      return
    }

    const productSizes = sizes.filter((size) => size.productId === productId)

    if (productSizes.length >= 4) {
      setError('Cada pizza pode ter no maximo 4 tamanhos.')
      return
    }

    try {
      setSaving(true)
      setError('')

      await apiFetch<PizzaSize>(
        '/pizza-sizes',
        {
          method: 'POST',

          body: JSON.stringify({
            productId,

            name: name.trim(),

            subtitle: subtitle.trim() || undefined,

            type,

            value: value
              ? Number(value)
              : undefined,

            maxFlavors:
              Math.min(Number(maxFlavors), 4),

            allowBorder,
          }),
        },
      )

      setName('')
      setSubtitle('')
      setValue('')
      setMaxFlavors('2')
      setAllowBorder(true)

      onCreated?.()
    } catch (err: any) {
      console.error(err)

      setError(
        err.message ||
          'Erro ao criar tamanho.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Tamanho da pizza
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <select
            value={productId}
            onChange={(e) =>
              setProductId(e.target.value)
            }
            className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">
              Selecione uma pizza
            </option>

            {pizzaProducts.map(
              (product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name}
                </option>
              ),
            )}
          </select>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Ex: 35cm"
            className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />

          <input
            type="text"
            value={subtitle}
            onChange={(e) =>
              setSubtitle(e.target.value)
            }
            placeholder="Texto abaixo do tamanho (ex: 8 fatias)"
            className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />

          <select
            value={type}
            onChange={(e) =>
              setType(
                e.target
                  .value as PizzaSizeType,
              )
            }
            className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="CM">
              Centímetros
            </option>

            <option value="SLICES">
              Fatias
            </option>

            <option value="CUSTOM">
              Personalizado
            </option>
          </select>

          <input
            type="number"
            value={value}
            onChange={(e) =>
              setValue(e.target.value)
            }
            placeholder="Valor do tamanho (35)"
            className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />

          <input
            type="number"
            min={1}
            max={4}
            value={maxFlavors}
            onChange={(e) =>
              setMaxFlavors(
                String(Math.min(Number(e.target.value || 1), 4)),
              )
            }
            placeholder="Máximo de sabores"
            className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={allowBorder}
              onChange={(e) =>
                setAllowBorder(
                  e.target.checked,
                )
              }
            />

            Permitir borda recheada
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={
              saving ||
              pizzaProducts.length === 0
            }
            className="w-full"
          >
            <Plus className="h-4 w-4" />

            {saving
              ? 'Salvando...'
              : 'Criar tamanho'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
