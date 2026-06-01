'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api'
import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'

import {
  PizzaFlavorForm,
  type PizzaFlavorFormInput,
} from '@/components/dashboard/cardapio/pizza-flavor-form'

import {
  PizzaFlavorList,
  type PizzaFlavor,
} from '@/components/dashboard/cardapio/pizza-flavor-list'

export default function SaboresPage() {
  const [flavors, setFlavors] = useState<PizzaFlavor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadFlavors() {
    try {
      setLoading(true)
      setError('')

      const data = await apiFetch<PizzaFlavor[]>('/pizza-flavors')

      setFlavors(data)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar sabores.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateFlavor(input: PizzaFlavorFormInput) {
    await apiFetch('/pizza-flavors', {
      method: 'POST',
      body: JSON.stringify(input),
    })

    await loadFlavors()
  }

  useEffect(() => {
    loadFlavors()
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title="Sabores"
        description="Cadastre sabores reutilizáveis para montar pizzas e preços por tamanho."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <PizzaFlavorForm onSubmit={handleCreateFlavor} />

        <PizzaFlavorList
          flavors={flavors}
          loading={loading}
        />
      </div>
    </PageContainer>
  )
}
