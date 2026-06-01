'use client'

import { Wheat } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

export type PizzaBorder = {
  id: string
  name: string
  isActive: boolean
}

type PizzaBorderListProps = {
  borders: PizzaBorder[]
  loading?: boolean
}

export function PizzaBorderList({
  borders,
  loading,
}: PizzaBorderListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Carregando bordas...
        </CardContent>
      </Card>
    )
  }

  if (borders.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-slate-500">
          Nenhuma borda cadastrada ainda.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {borders.map((border) => (
        <Card
          key={border.id}
          className="transition-shadow hover:shadow-md"
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Wheat className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle>{border.name}</CardTitle>

                  <CardDescription className="pt-1">
                    Borda recheada
                  </CardDescription>
                </div>
              </div>

              <Badge variant={border.isActive ? 'primary' : 'outline'}>
                {border.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
