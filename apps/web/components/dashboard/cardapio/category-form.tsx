'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type CategoryFormInput = {
  name: string
  slug?: string
}

type CategoryFormProps = {
  onSubmit: (input: CategoryFormInput) => Promise<void>
}

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function CategoryForm({ onSubmit }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const slug = useMemo(() => generateSlug(name), [name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setError('Digite o nome da categoria.')
      return
    }

    try {
      setSaving(true)
      setError('')

      await onSubmit({
        name: name.trim(),
        slug,
      })

      setName('')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar categoria.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova categoria</CardTitle>
        <CardDescription>
          Cadastre grupos como pizzas tradicionais, bebidas, sobremesas e promoções.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome da categoria
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pizzas Tradicionais"
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            {slug && (
              <p className="mt-1 text-xs text-slate-500">
                Slug gerado: <span className="font-mono">/{slug}</span>
              </p>
            )}
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
            {saving ? 'Salvando...' : 'Criar categoria'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
