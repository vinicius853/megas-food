'use client'

import * as React from 'react'

import { apiFetch } from '@/lib/api'
import {
  getAvailableTenantSegment,
  normalizeTenantSegments,
} from '@/lib/segments/segment-registry'
import type { TenantSegment } from '@/lib/segments/segment-types'

type TenantSegmentsResponse = {
  enabledSegments?: TenantSegment[]
}

export function useTenantSegments() {
  const [segments, setSegments] = React.useState<TenantSegment[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    const storedSegments = readStoredSegments()

    if (storedSegments.length) {
      setSegments(storedSegments)
    }

    apiFetch<TenantSegmentsResponse>('/tenants/me')
      .then((tenant) => {
        if (!active) return

        const nextSegments = normalizeTenantSegments(tenant.enabledSegments)
        setSegments(nextSegments)
        localStorage.setItem('tenantSegments', JSON.stringify(nextSegments))
      })
      .catch(() => {
        if (!active) return
        setSegments(
          storedSegments.length
            ? storedSegments
            : normalizeTenantSegments(),
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return {
    enabledSegments: segments,
    activeSegment: getAvailableTenantSegment(segments),
    loading,
  }
}

function readStoredSegments() {
  if (typeof window === 'undefined') return []

  try {
    const stored = JSON.parse(
      localStorage.getItem('tenantSegments') || '[]',
    ) as string[]

    return normalizeTenantSegments(stored)
  } catch {
    return []
  }
}
