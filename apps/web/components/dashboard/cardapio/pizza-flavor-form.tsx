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

export type PizzaFlavorFormInput = {
  name: string
  description?: string
}

type PizzaFlavorFormProps = {
  onSubmit: (
    input: PizzaFlavorFormInput,
  ) => Promise<void>
}

export function PizzaFlavorForm({
  onSubmit,
}: PizzaFlavorFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] =
    useState('')

  const [saving, setSaving] =
    useState(false)

  const [error, setError] = useState('')

  async function handleSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault()

    if (!name.trim()) {
      setError('Digite o nome do sabor.')
      return
    }

    try {
      setSaving(true)
      setError('')

      await onSubmit({
        name: name.trim(),
        description:
          description.trim() || undefined,
      })

      setName('')
      setDescription('')
    } catch (err: any) {
      setError(
        err.message ||
          'Erro ao criar sabor.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Novo sabor
        </CardTitle>

        <CardDescription>
          Cadastre sabores reutilizáveis
          para pizzas.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome do sabor
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
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
              onChange={(e) =>
                setDescription(
                  e.target.value,
                )
              }
              placeholder="Ex: Molho, mussarela e calabresa"
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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

            {saving
              ? 'Salvando...'
              : 'Criar sabor'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
