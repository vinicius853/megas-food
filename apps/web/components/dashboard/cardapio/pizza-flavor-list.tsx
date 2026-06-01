'use client'

import { Tags } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

export type PizzaFlavor = {
  id: string
  name: string
  description?: string | null
  isActive: boolean
}

type PizzaFlavorListProps = {
  flavors: PizzaFlavor[]
  loading?: boolean
}

export function PizzaFlavorList({
  flavors,
  loading,
}: PizzaFlavorListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Carregando sabores...
        </CardContent>
      </Card>
    )
  }

  if (flavors.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Nenhum sabor cadastrado ainda.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {flavors.map((flavor) => (
        <Card
          key={flavor.id}
          className="transition-shadow hover:shadow-md"
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Tags className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle>{flavor.name}</CardTitle>

                  <CardDescription className="pt-1">
                    Sabor da pizza
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant={
                  flavor.isActive
                    ? 'primary'
                    : 'outline'
                }
              >
                {flavor.isActive
                  ? 'Ativo'
                  : 'Inativo'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-slate-500">
              {flavor.description ||
                'Sem descrição.'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
