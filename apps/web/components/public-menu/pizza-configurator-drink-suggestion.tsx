import { CupSoda } from 'lucide-react'

type PizzaConfiguratorDrinkSuggestionProps = {
  onViewDrinks: () => void
  onOpenCart: () => void
}

export function PizzaConfiguratorDrinkSuggestion() {
  return (
    <section>
      <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-red-700 shadow-sm">
          <CupSoda className="h-8 w-8" />
        </div>

        <h3 className="mt-4 text-xl font-black uppercase leading-tight text-slate-950">
          Deseja adicionar uma bebida?
        </h3>

        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600">
          Sua pizza ja foi adicionada ao carrinho. Voce pode completar o pedido com uma bebida agora.
        </p>
      </div>
    </section>
  )
}

export function PizzaConfiguratorDrinkSuggestionFooter({
  onViewDrinks,
  onOpenCart,
}: PizzaConfiguratorDrinkSuggestionProps) {
  return (
    <footer className="space-y-3 border-t border-slate-200 bg-white p-4">
      <button
        type="button"
        onClick={onViewDrinks}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-red-700 text-base font-black uppercase text-white shadow-lg"
      >
        Sim, ver bebidas
      </button>

      <button
        type="button"
        onClick={onOpenCart}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-slate-100 text-base font-black text-slate-700"
      >
        Nao, ir para o carrinho
      </button>
    </footer>
  )
}
