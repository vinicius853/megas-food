import type { TenantSegment } from './segment-types'

export type SegmentAdapter<T> = {
  segment: TenantSegment
  value: T
}

export function resolveSegmentAdapter<T>(
  enabledSegments: TenantSegment[],
  adapters: Partial<Record<TenantSegment, T>>,
): SegmentAdapter<T> | null {
  for (const segment of enabledSegments) {
    const value = adapters[segment]

    if (value !== undefined) {
      return { segment, value }
    }
  }

  return null
}
