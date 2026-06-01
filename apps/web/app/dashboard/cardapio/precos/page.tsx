'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api'

import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'

import {
  FlavorPriceForm,
  type FlavorPriceFormInput,
} from '@/components/dashboard/cardapio/flavor-price-form'

import {
  FlavorPriceTable,
  type FlavorPrice,
} from '@/components/dashboard/cardapio/flavor-price-table'

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

export default function PrecosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [sizes, setSizes] = useState<PizzaSize[]>([])
  const [flavors, setFlavors] = useState<PizzaFlavor[]>([])
  const [prices, setPrices] = useState<FlavorPrice[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [
        productsData,
        sizesData,
        flavorsData,
        pricesData,
      ] = await Promise.all([
        apiFetch<Product[]>('/products'),
        apiFetch<PizzaSize[]>('/pizza-sizes'),
        apiFetch<PizzaFlavor[]>('/pizza-flavors'),
        apiFetch<FlavorPrice[]>('/flavor-prices'),
      ])

      setProducts(productsData)
      setSizes(sizesData)
      setFlavors(flavorsData)
      setPrices(pricesData)
    } catch (err: any) {
      setError(
        err.message ||
          'Erro ao carregar preços.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePrice(
    input: FlavorPriceFormInput,
  ) {
    await apiFetch('/flavor-prices', {
      method: 'POST',

      body: JSON.stringify(input),
    })

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title="Preços por sabor"
        description="Configure os preços de cada sabor por tamanho."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <FlavorPriceForm
          products={products}
          sizes={sizes}
          flavors={flavors}
          onSubmit={handleCreatePrice}
        />

        <FlavorPriceTable
          prices={prices}
          loading={loading}
        />
      </div>
    </PageContainer>
  )
}
