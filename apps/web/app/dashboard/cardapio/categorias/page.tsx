'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api'

import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'

import { CategoryForm } from '@/components/dashboard/cardapio/category-form'

import {
  Category,
  CategoryList,
} from '@/components/dashboard/cardapio/category-list'

export default function CategoriasPage() {
  const [categories, setCategories] =
    useState<Category[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] = useState('')

  async function loadCategories() {
    try {
      setLoading(true)
      setError('')

      const data = await apiFetch<
        Category[]
      >('/categories')

      setCategories(data)
    } catch (err: any) {
      setError(
        err.message ||
          'Erro ao carregar categorias.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCategory(
    input: {
      name: string
      slug?: string
    },
  ) {
    await apiFetch('/categories', {
      method: 'POST',

      body: JSON.stringify({
        name: input.name,
        slug: input.slug,
      }),
    })

    await loadCategories()
  }

  useEffect(() => {
    loadCategories()
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title="Categorias"
        description="Gerencie as categorias do cardápio."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <CategoryForm
          onSubmit={handleCreateCategory}
        />

        <CategoryList
          categories={categories}
          loading={loading}
        />
      </div>
    </PageContainer>
  )
}
