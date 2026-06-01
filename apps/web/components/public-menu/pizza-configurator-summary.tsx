import { formatMoney } from './pizza-configurator-helpers'

type PizzaConfiguratorSummaryProps = {
  productName: string
  sizeName?: string
  flavorNames: string[]
  borderName?: string
  additionalNames: string[]
  isMulti: boolean
  notes: string
  onNotesChange: (value: string) => void
  totalPrice: number
}

export function PizzaConfiguratorSummary({
  productName,
  sizeName,
  flavorNames,
  borderName,
  additionalNames,
  isMulti,
  notes,
  onNotesChange,
  totalPrice,
}: PizzaConfiguratorSummaryProps) {
  return (
    <section>
      <h3 className="mb-4 text-lg font-black text-slate-950">
        Revise seu pedido
      </h3>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
        <p>Produto: <span className="text-slate-950">{productName}</span></p>
        <p>Tamanho: <span className="text-slate-950">{sizeName}</span></p>
        <p>
          Sabores:{' '}
          <span className="text-slate-950">
            {flavorNames.filter(Boolean).join(' / ')}
          </span>
        </p>
        {borderName && (
          <p>Borda: <span className="text-slate-950">{borderName}</span></p>
        )}
        {additionalNames.length > 0 && (
          <p>
            Adicionais:{' '}
            <span className="text-slate-950">
              {additionalNames.join(', ')}
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
