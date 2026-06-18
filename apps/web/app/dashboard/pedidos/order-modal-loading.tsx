import { Loader2, X } from 'lucide-react'

type OrderModalLoadingProps = {
  onClose: () => void
}

export function OrderModalLoading({ onClose }: OrderModalLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-4 md:items-center">
      <div className="flex min-h-56 w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="text-lg font-bold text-slate-900">
            Detalhes do pedido
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center gap-3 p-10 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando pedido completo...
        </div>
      </div>
    </div>
  )
}
