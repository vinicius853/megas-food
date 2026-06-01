'use client'

import { CircleDollarSign } from 'lucide-react'

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

type PizzaSize = {
  id: string
  name: string
}

type PizzaFlavor = {
  id: string
  name: string
}

export type FlavorPrice = {
  id: string
  productId: string
  sizeId: string
  flavorId: string
  price: string | number
  product?: Product
  size?: PizzaSize
  flavor?: PizzaFlavor
}

type FlavorPriceTableProps = {
  prices: FlavorPrice[]
  loading?: boolean
}

function formatPrice(value: string | number) {
  const numberValue = Number(value)

  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function FlavorPriceTable({
  prices,
  loading,
}: FlavorPriceTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Carregando preços...
        </CardContent>
      </Card>
    )
  }

  if (prices.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Nenhum preço por sabor cadastrado ainda.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preços cadastrados</CardTitle>
        <CardDescription>
          Relação entre pizza, tamanho, sabor e valor.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {prices.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <CircleDollarSign className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {item.flavor?.name ?? 'Sabor não informado'}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {item.product?.name ?? 'Produto não informado'} •{' '}
                    {item.size?.name ?? 'Tamanho não informado'}
                  </p>
                </div>
              </div>

              <Badge variant="primary">
                {formatPrice(item.price)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
