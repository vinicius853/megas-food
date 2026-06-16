import { Check } from 'lucide-react'

import { formatMoney } from './pizza-configurator-helpers'
import { capitalizePublicDisplayName } from './public-menu-display-text'

type OptionCardProps = {
  title: string
  description?: string
  price?: number
  selected?: boolean
  onClick: () => void
}

export function OptionCard({
  title,
  description,
  price,
  selected,
  onClick,
}: OptionCardProps) {
  const displayTitle = capitalizePublicDisplayName(title)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
        selected
          ? 'border-red-600 bg-red-50'
          : 'border-slate-200 bg-white hover:border-red-200'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-950">{displayTitle}</p>
        {description && (
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3">
        {typeof price === 'number' && (
          <span className="min-w-24 whitespace-nowrap text-right text-sm font-black text-red-700">
            {formatMoney(price)}
          </span>
        )}

        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          {selected && <Check className="h-5 w-5 text-red-700" />}
        </span>
      </div>
    </button>
  )
}
