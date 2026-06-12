import { TenantSegment } from '@prisma/client'

export const DEFAULT_TENANT_SEGMENTS: TenantSegment[] = [
  TenantSegment.PIZZARIA,
]

export function normalizeTenantSegments(
  segments?: TenantSegment[],
): TenantSegment[] {
  return segments?.length
    ? Array.from(new Set(segments))
    : DEFAULT_TENANT_SEGMENTS
}
