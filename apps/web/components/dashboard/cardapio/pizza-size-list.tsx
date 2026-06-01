'use client'

import { Ruler } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

type Product = {
  id: string
  name: string
}

export type PizzaSize = {
  id: string
  productId?: string
  name: string
  subtitle?: string | null
  type: 'CM' | 'SLICES' | 'CUSTOM'
  value?: number | null
  maxFlavors: number
  allowBorder: boolean
  isActive: boolean
  product?: Product
}

type PizzaSizeListProps = {
  sizes: PizzaSize[]
  loading?: boolean
}

const typeLabels = {
  CM: 'Centímetros',
  SLICES: 'Fatias',
  CUSTOM: 'Personalizado',
}

export function PizzaSizeList({
  sizes,
  loading,
}: PizzaSizeListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Carregando tamanhos...
        </CardContent>
      </Card>
    )
  }

  if (sizes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Nenhum tamanho cadastrado ainda.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sizes.map((size) => (
        <Card
          key={size.id}
          className="transition-shadow hover:shadow-md"
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Ruler className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle>{size.name}</CardTitle>

                  <CardDescription className="pt-1">
                    {size.subtitle ||
                      size.product?.name ||
                      'Sem produto'}
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant={
                  size.isActive
                    ? 'primary'
                    : 'outline'
                }
              >
                {size.isActive
                  ? 'Ativo'
                  : 'Inativo'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {typeLabels[size.type]}
              </Badge>

              <Badge variant="outline">
                {size.maxFlavors} sabores
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-slate-500">
              <div className="flex items-center justify-between">
                <span>Valor</span>

                <span>
                  {size.value ?? '-'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Borda</span>

                <span>
                  {size.allowBorder
                    ? 'Permitida'
                    : 'Bloqueada'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
