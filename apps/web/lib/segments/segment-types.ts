export const TENANT_SEGMENTS = [
  'PIZZARIA',
  'HAMBURGUERIA',
  'ACAITERIA',
  'PASTELARIA',
] as const

export type TenantSegment = (typeof TENANT_SEGMENTS)[number]

export type SegmentConfig = {
  id: TenantSegment
  label: string
  description: string
  dashboardLabel: string
  available: boolean
}
