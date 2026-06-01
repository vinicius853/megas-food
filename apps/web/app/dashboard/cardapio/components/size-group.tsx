import {
  type PizzaSizeConfig,
  type PizzaSizeSetter,
} from '../types/menu-management'

import { EditableSizeRule } from './editable-size-rule'

export function SizeGroup({
  title,
  description,
  sizes,
  setSizes,
  onAdd,
  onRemove,
}: {
  title: string
  description: string
  sizes: PizzaSizeConfig[]
  setSizes: PizzaSizeSetter
  onAdd: () => void
  onRemove: (sizeId: string) => void
}) {
  const reachedLimit = sizes.length >= 4

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-black text-slate-950">
            {title}
          </h4>

          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={reachedLimit}
          title={reachedLimit ? 'Limite de 4 tamanhos atingido' : undefined}
          className="shrink-0 rounded-2xl bg-orange-50 px-3 py-2 text-xs font-black text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          + Tamanho
        </button>
      </div>

      {reachedLimit ? (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          Limite de 4 tamanhos atingido para este modelo de pizza.
        </div>
      ) : null}

      <div className="space-y-3">
        {sizes.map((size) => (
          <EditableSizeRule
            key={size.id}
            size={size}
            setSizes={setSizes}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  )
}
