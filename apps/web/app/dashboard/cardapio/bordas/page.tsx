'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api'

import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'

import {
  PizzaBorderForm,
  type PizzaBorderFormInput,
} from '@/components/dashboard/cardapio/pizza-border-form'

import {
  PizzaBorderList,
  type PizzaBorder,
} from '@/components/dashboard/cardapio/pizza-border-list'

export default function BordasPage() {
  const [borders, setBorders] = useState<PizzaBorder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadBorders() {
    try {
      setLoading(true)
      setError('')

      const data = await apiFetch<PizzaBorder[]>(
        '/pizza-borders',
      )

      setBorders(data)
    } catch (err: any) {
      setError(
        err.message ||
          'Erro ao carregar bordas.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateBorder(
    input: PizzaBorderFormInput,
  ) {
    await apiFetch('/pizza-borders', {
      method: 'POST',

      body: JSON.stringify(input),
    })

    await loadBorders()
  }

  useEffect(() => {
    loadBorders()
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title="Bordas"
        description="Cadastre bordas recheadas para as pizzas."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <PizzaBorderForm
          onSubmit={handleCreateBorder}
        />

        <PizzaBorderList
          borders={borders}
          loading={loading}
        />
      </div>
    </PageContainer>
  )
}
