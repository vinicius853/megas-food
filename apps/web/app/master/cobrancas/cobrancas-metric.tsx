import type { ElementType } from 'react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type BillingMetricProps = {
  title: string
  value: string
  icon: ElementType
}

export function BillingMetric({ title, value, icon: Icon }: BillingMetricProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 pb-3">
        <CardTitle className="text-sm text-slate-500">{title}</CardTitle>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-black text-slate-950">{value}</p>
      </CardContent>
    </Card>
  )
}
