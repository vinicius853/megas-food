import { formatMoney } from './pizza-configurator-helpers'
import { capitalizePublicDisplayName } from './public-menu-display-text'

type PizzaConfiguratorSummaryProps = {
  productName: string
  sizeOptionLabel?: string
  flavorOptionLabels: string[]
  borderOptionLabel?: string
  additionalNames: string[]
  isMulti: boolean
  notes: string
  onNotesChange: (value: string) => void
  totalPrice: number
}

export function PizzaConfiguratorSummary({
  productName,
  sizeOptionLabel,
  flavorOptionLabels,
  borderOptionLabel,
  additionalNames,
  isMulti,
  notes,
  onNotesChange,
  totalPrice,
}: PizzaConfiguratorSummaryProps) {
  const displayProductName = capitalizePublicDisplayName(productName)
  const displaySizeLabel = capitalizePublicDisplayName(sizeOptionLabel)
  const displayFlavorLabels = flavorOptionLabels.map((label) =>
    capitalizePublicDisplayName(label),
  )
  const displayBorderLabel = capitalizePublicDisplayName(borderOptionLabel)
  const displayAdditionalNames = additionalNames.map((name) =>
    capitalizePublicDisplayName(name),
  )

  return (
    <section>
      <h3 className="mb-4 text-lg font-black text-slate-950">
        Revise seu pedido
      </h3>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
        <p>Produto: <span className="text-slate-950">{displayProductName}</span></p>
        <p>Tamanho: <span className="text-slate-950">{displaySizeLabel}</span></p>
        <p>
          Sabores:{' '}
          <span className="text-slate-950">
            {displayFlavorLabels.filter(Boolean).join(' / ')}
          </span>
        </p>
        {borderOptionLabel && (
          <p>Borda: <span className="text-slate-950">{displayBorderLabel}</span></p>
        )}
        {additionalNames.length > 0 && (
          <p>
            Adicionais:{' '}
            <span className="text-slate-950">
              {displayAdditionalNames.join(', ')}
            </span>
          </p>
        )}
        {isMulti && (
          <p className="text-xs text-slate-500">
            Pizzas com multiplos sabores cobram o maior preco entre os sabores.
          </p>
        )}
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Observacao do item"
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none"
        />
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <span>Total</span>
          <strong className="text-xl text-red-700">
            {formatMoney(totalPrice)}
          </strong>
        </div>
      </div>
    </section>
  )
}
