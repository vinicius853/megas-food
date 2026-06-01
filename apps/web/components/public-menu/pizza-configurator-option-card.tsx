import { Check } from 'lucide-react'

import { formatMoney } from './pizza-configurator-helpers'

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
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        {description && (
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {description}
          </p>
        )}
      </div>

      {typeof price === 'number' && (
        <span className="text-sm font-black text-red-700">
          {formatMoney(price)}
        </span>
      )}

      {selected && <Check className="h-5 w-5 text-red-700" />}
    </button>
  )
}
