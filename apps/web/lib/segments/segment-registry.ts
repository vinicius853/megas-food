import type { SegmentConfig, TenantSegment } from './segment-types'
import { TENANT_SEGMENTS } from './segment-types'

export const DEFAULT_TENANT_SEGMENTS: TenantSegment[] = ['PIZZARIA']

export const SEGMENT_REGISTRY: Record<TenantSegment, SegmentConfig> = {
  PIZZARIA: {
    id: 'PIZZARIA',
    label: 'Pizzaria',
    description: 'Pizzas, sabores, tamanhos, bordas e adicionais.',
    dashboardLabel: 'Pizzaria',
    available: true,
  },
  HAMBURGUERIA: {
    id: 'HAMBURGUERIA',
    label: 'Hamburgueria',
    description: 'Hamburgueres, pontos, adicionais e combos.',
    dashboardLabel: 'Hamburgueria',
    available: false,
  },
  ACAITERIA: {
    id: 'ACAITERIA',
    label: 'Acaiteria',
    description: 'Tamanhos, complementos, frutas e coberturas.',
    dashboardLabel: 'Acaiteria',
    available: false,
  },
  PASTELARIA: {
    id: 'PASTELARIA',
    label: 'Pastelaria',
    description: 'Pasteis, recheios, adicionais e bebidas.',
    dashboardLabel: 'Pastelaria',
    available: false,
  },
}

export const SEGMENT_OPTIONS = TENANT_SEGMENTS.map(
  (segment) => SEGMENT_REGISTRY[segment],
)

export function normalizeTenantSegments(
  segments?: string[] | null,
): TenantSegment[] {
  const validSegments = (segments || []).filter(
    (segment): segment is TenantSegment =>
      TENANT_SEGMENTS.includes(segment as TenantSegment),
  )

  return validSegments.length
    ? Array.from(new Set(validSegments))
    : DEFAULT_TENANT_SEGMENTS
}

export function getAvailableTenantSegment(segments?: string[] | null) {
  return normalizeTenantSegments(segments).find(
    (segment) => SEGMENT_REGISTRY[segment].available,
  )
}

export function getDashboardSegmentLabel(segments?: string[] | null) {
  const availableSegment = getAvailableTenantSegment(segments)

  return availableSegment
    ? SEGMENT_REGISTRY[availableSegment].dashboardLabel
    : 'Operacao'
}
