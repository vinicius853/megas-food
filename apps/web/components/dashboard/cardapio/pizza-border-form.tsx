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

export type PizzaBorderFormInput = {
  name: string
}

type PizzaBorderFormProps = {
  onSubmit: (input: PizzaBorderFormInput) => Promise<void>
}

export function PizzaBorderForm({ onSubmit }: PizzaBorderFormProps) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setError('Digite o nome da borda.')
      return
    }

    try {
      setSaving(true)
      setError('')

      await onSubmit({
        name: name.trim(),
      })

      setName('')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar borda.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova borda</CardTitle>
        <CardDescription>
          Cadastre bordas recheadas para usar nas pizzas.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome da borda
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Catupiry"
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
            {saving ? 'Salvando...' : 'Criar borda'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
