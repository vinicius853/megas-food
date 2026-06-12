'use client'

import { Clock3, Layers3 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { useTenantSegments } from '@/hooks/use-tenant-segments'
import { resolveSegmentAdapter } from '@/lib/segments/segment-adapter'
import { SEGMENT_REGISTRY } from '@/lib/segments/segment-registry'
import type { TenantSegment } from '@/lib/segments/segment-types'

type SegmentConfiguratorGateProps = {
  adapters: Partial<Record<TenantSegment, React.ReactNode>>
}

export function SegmentConfiguratorGate({
  adapters,
}: SegmentConfiguratorGateProps) {
  const { enabledSegments, loading } = useTenantSegments()
  const adapter = resolveSegmentAdapter(enabledSegments, adapters)

  if (loading) {
    return (
      <div className="p-6 text-sm font-semibold text-slate-500">
        Carregando configurador do segmento...
      </div>
    )
  }

  if (adapter) {
    return <>{adapter.value}</>
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Layers3 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Configurador em preparacao
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Este tenant possui segmentos habilitados que ainda nao foram
            liberados para operacao.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {enabledSegments.map((segment) => (
              <span
                key={segment}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
              >
                <Clock3 className="h-3.5 w-3.5" />
                {SEGMENT_REGISTRY[segment].label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
