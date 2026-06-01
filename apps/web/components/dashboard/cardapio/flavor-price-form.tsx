'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Product = {
  id: string
  name: string
  type: string
  isActive: boolean
}

type PizzaSize = {
  id: string
  name: string
  productId: string
  isActive: boolean
}

type PizzaFlavor = {
  id: string
  name: string
  isActive: boolean
}

export type FlavorPriceFormInput = {
  productId: string
  sizeId: string
  flavorId: string
  price: number
}

type FlavorPriceFormProps = {
  products: Product[]
  sizes: PizzaSize[]
  flavors: PizzaFlavor[]
  onSubmit: (input: FlavorPriceFormInput) => Promise<void>
}

export function FlavorPriceForm({
  products,
  sizes,
  flavors,
  onSubmit,
}: FlavorPriceFormProps) {
  const [productId, setProductId] = useState('')
  const [sizeId, setSizeId] = useState('')
  const [flavorId, setFlavorId] = useState('')
  const [price, setPrice] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const pizzaProducts = products.filter(
    (product) =>
      product.isActive &&
      (product.type === 'PIZZA_ROUND' || product.type === 'PIZZA_SQUARE'),
  )

  const availableSizes = sizes.filter(
    (size) => size.isActive && size.productId === productId,
  )

  const activeFlavors = flavors.filter((flavor) => flavor.isActive)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!productId) {
      setError('Selecione uma pizza.')
      return
    }

    if (!sizeId) {
      setError('Selecione um tamanho.')
      return
    }

    if (!flavorId) {
      setError('Selecione um sabor.')
      return
    }

    if (!price || Number(price) <= 0) {
      setError('Digite um preço válido.')
      return
    }

    try {
      setSaving(true)
      setError('')

      await onSubmit({
        productId,
        sizeId,
        flavorId,
        price: Number(price),
      })

      setFlavorId('')
      setPrice('')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar preço.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo preço por sabor</CardTitle>
        <CardDescription>
          Defina quanto cada sabor custa em cada tamanho de pizza.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Pizza
            </label>

            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value)
                setSizeId('')
              }}
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Selecione uma pizza</option>

              {pizzaProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tamanho
            </label>

            <select
              value={sizeId}
              onChange={(e) => setSizeId(e.target.value)}
              disabled={!productId}
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
            >
              <option value="">Selecione um tamanho</option>

              {availableSizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Sabor
            </label>

            <select
              value={flavorId}
              onChange={(e) => setFlavorId(e.target.value)}
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Selecione um sabor</option>

              {activeFlavors.map((flavor) => (
                <option key={flavor.id} value={flavor.id}>
                  {flavor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Preço
            </label>

            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 52.90"
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Criar preço'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
