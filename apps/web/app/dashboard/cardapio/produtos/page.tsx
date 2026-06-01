'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api'
import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'

import {
  ProductForm,
  type ProductFormCategory,
  type ProductFormInput,
} from '@/components/dashboard/cardapio/product-form'

import {
  ProductList,
  type Product,
} from '@/components/dashboard/cardapio/product-list'

export default function ProdutosPage() {
  const [categories, setCategories] = useState<ProductFormCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [categoriesData, productsData] = await Promise.all([
        apiFetch<ProductFormCategory[]>('/categories'),
        apiFetch<Product[]>('/products'),
      ])

      setCategories(categoriesData)
      setProducts(productsData)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProduct(input: ProductFormInput) {
    await apiFetch('/products', {
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
        title="Produtos"
        description="Cadastre e gerencie os produtos do cardápio."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <ProductForm
          categories={categories}
          onSubmit={handleCreateProduct}
        />

        <ProductList
          products={products}
          loading={loading}
        />
      </div>
    </PageContainer>
  )
}
