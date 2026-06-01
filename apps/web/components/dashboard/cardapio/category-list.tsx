'use client'

import { Pizza } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

export type Category = {
  id: string
  tenantId: string
  name: string
  slug: string
  sortOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

type CategoryListProps = {
  categories: Category[]
  loading?: boolean
}

export function CategoryList({
  categories,
  loading,
}: CategoryListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Carregando categorias...
        </CardContent>
      </Card>
    )
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Nenhuma categoria cadastrada ainda.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <Card
          key={category.id}
          className="transition-shadow hover:shadow-md"
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Pizza className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle>{category.name}</CardTitle>

                  <CardDescription className="pt-1">
                    /{category.slug}
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant={
                  category.isActive
                    ? 'primary'
                    : 'outline'
                }
              >
                {category.isActive
                  ? 'Ativa'
                  : 'Inativa'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Ordem</span>

              <span>{category.sortOrder}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
