'use client'

import { UtensilsCrossed } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

export type ProductType =
  | 'PIZZA_ROUND'
  | 'PIZZA_SQUARE'
  | 'DRINK'
  | 'OTHER'

export type ProductCategory = {
  id: string
  name: string
}

export type Product = {
  id: string
  tenantId: string
  categoryId: string
  name: string
  description?: string | null
  imageUrl?: string | null
  type: ProductType
  isActive: boolean
  category?: ProductCategory
}

type ProductListProps = {
  products: Product[]
  loading?: boolean
}

const productTypeLabels: Record<ProductType, string> = {
  PIZZA_ROUND: 'Pizza redonda',
  PIZZA_SQUARE: 'Pizza quadrada',
  DRINK: 'Bebida',
  OTHER: 'Outro',
}

export function ProductList({
  products,
  loading,
}: ProductListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Carregando produtos...
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Nenhum produto cadastrado ainda.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <Card
          key={product.id}
          className="transition-shadow hover:shadow-md"
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle>{product.name}</CardTitle>

                  <CardDescription className="pt-1">
                    {product.category?.name ??
                      'Sem categoria'}
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant={
                  product.isActive
                    ? 'primary'
                    : 'outline'
                }
              >
                {product.isActive
                  ? 'Ativo'
                  : 'Inativo'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="min-h-5 text-sm text-slate-500">
              {product.description ||
                'Sem descrição.'}
            </p>

            <Badge variant="outline">
              {
                productTypeLabels[
                  product.type
                ]
              }
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
