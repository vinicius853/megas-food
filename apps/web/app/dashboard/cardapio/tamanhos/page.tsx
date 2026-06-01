'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api'
import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'

import { PizzaSizeForm } from '@/components/dashboard/cardapio/pizza-size-form'

import {
  PizzaSizeList,
  type PizzaSize,
} from '@/components/dashboard/cardapio/pizza-size-list'

type ProductType = 'PIZZA_ROUND' | 'PIZZA_SQUARE' | 'DRINK' | 'OTHER'

type Product = {
  id: string
  name: string
  type: ProductType
  isActive: boolean
}

export default function TamanhosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [sizes, setSizes] = useState<PizzaSize[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [productsData, sizesData] = await Promise.all([
        apiFetch<Product[]>('/products'),
        apiFetch<PizzaSize[]>('/pizza-sizes'),
      ])

      setProducts(productsData)
      setSizes(sizesData)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar tamanhos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title="Tamanhos"
        description="Configure tamanhos das pizzas, quantidade máxima de sabores e bordas."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <PizzaSizeForm products={products} sizes={sizes} onCreated={loadData} />

        <PizzaSizeList sizes={sizes} loading={loading} />
      </div>
    </PageContainer>
  )
}
