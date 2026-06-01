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

export type ProductType = 'PIZZA_ROUND' | 'PIZZA_SQUARE' | 'DRINK' | 'OTHER'

export type ProductFormCategory = {
  id: string
  name: string
  isActive: boolean
}

export type ProductFormInput = {
  categoryId: string
  name: string
  description?: string
  type: ProductType
  isActive: boolean
}

type ProductFormProps = {
  categories: ProductFormCategory[]
  onSubmit: (input: ProductFormInput) => Promise<void>
}

export function ProductForm({ categories, onSubmit }: ProductFormProps) {
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ProductType>('PIZZA_ROUND')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const activeCategories = categories.filter((category) => category.isActive)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!categoryId) {
      setError('Selecione uma categoria.')
      return
    }

    if (!name.trim()) {
      setError('Digite o nome do produto.')
      return
    }

    try {
      setSaving(true)
      setError('')

      await onSubmit({
        categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        isActive,
      })

      setName('')
      setDescription('')
      setType('PIZZA_ROUND')
      setIsActive(true)
    } catch (err: any) {
      setError(err.message || 'Erro ao criar produto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo produto</CardTitle>
        <CardDescription>
          Cadastre pizzas, bebidas, sobremesas e outros itens do cardápio.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Categoria
            </label>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Selecione uma categoria</option>

              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome do produto
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Calabresa"
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Descrição
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Molho, mussarela e calabresa"
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tipo
            </label>

            <select
              value={type}
              onChange={(e) => setType(e.target.value as ProductType)}
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="PIZZA_ROUND">Pizza redonda</option>
              <option value="PIZZA_SQUARE">Pizza quadrada</option>
              <option value="DRINK">Bebida</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Produto ativo ao criar
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={saving || activeCategories.length === 0}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Criar produto'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
