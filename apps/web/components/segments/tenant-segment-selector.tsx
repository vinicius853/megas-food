import { Check, Clock3 } from 'lucide-react'

import {
  SEGMENT_OPTIONS,
  normalizeTenantSegments,
} from '@/lib/segments/segment-registry'
import type { TenantSegment } from '@/lib/segments/segment-types'
import { cn } from '@/lib/utils'

type TenantSegmentSelectorProps = {
  value: TenantSegment[]
  onChange: (segments: TenantSegment[]) => void
  disabled?: boolean
}

export function TenantSegmentSelector({
  value,
  onChange,
  disabled = false,
}: TenantSegmentSelectorProps) {
  const selected = normalizeTenantSegments(value)

  function toggle(segment: TenantSegment) {
    const next = selected.includes(segment)
      ? selected.filter((current) => current !== segment)
      : [...selected, segment]

    onChange(normalizeTenantSegments(next))
  }

  return (
    <fieldset className="grid gap-3 sm:col-span-2">
      <div>
        <legend className="text-sm font-bold text-slate-700">
          Segmentos habilitados
        </legend>
        <p className="mt-1 text-xs font-medium text-slate-500">
          A pizzaria esta operacional. Os demais segmentos ficam preparados
          para liberacao futura.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {SEGMENT_OPTIONS.map((segment) => {
          const checked = selected.includes(segment.id)

          return (
            <label
              key={segment.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
                checked
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(segment.id)}
                className="sr-only"
              />
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                  checked
                    ? 'border-orange-600 bg-orange-600 text-white'
                    : 'border-slate-300 bg-white',
                )}
              >
                {checked ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-black text-slate-900">
                  {segment.label}
                  {!segment.available ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                      <Clock3 className="h-3 w-3" />
                      Em breve
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                  {segment.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
