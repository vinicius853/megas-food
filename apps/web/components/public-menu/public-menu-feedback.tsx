import { ArrowRight, CheckCircle2, ShoppingBasket } from 'lucide-react'

import { formatMoney } from './public-menu-formatters'
import type { MenuPalette } from './public-menu.types'

type BottomCartBarProps = {
  cartPulseKey: number
  totalItems: number
  totalPrice: number
  palette: MenuPalette
  onOpenCart: () => void
}

export function BottomCartBar({
  cartPulseKey,
  totalItems,
  totalPrice,
  palette,
  onOpenCart,
}: BottomCartBarProps) {
  if (totalItems <= 0) return null

  return (
    <div
      key={cartPulseKey}
      className="cart-bump fixed bottom-0 left-1/2 z-40 flex w-full max-w-[860px] -translate-x-1/2 items-center justify-between gap-3 rounded-t-2xl px-4 py-3 text-white shadow-2xl shadow-red-900/30 transition duration-300"
      style={{ backgroundColor: palette.primary }}
    >
      <button
        type="button"
        onClick={onOpenCart}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
          <ShoppingBasket className="h-6 w-6" />
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black"
            style={{
              backgroundColor: palette.accent,
              color: palette.primary,
            }}
          >
            {totalItems}
          </span>
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-black">
            {totalItems} {totalItems === 1 ? 'item' : 'itens'} no pedido
          </span>
          <span className="block truncate text-xs font-bold text-white/80">
            Subtotal: {formatMoney(totalPrice)}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onOpenCart}
        className="flex h-12 shrink-0 items-center gap-3 rounded-xl bg-white px-5 text-sm font-black shadow-lg"
        style={{ color: palette.primary }}
      >
        Ver pedido
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

type AddedFeedbackItem = {
  name: string
  imageUrl?: string
}

type AddedToCartToastProps = {
  item: AddedFeedbackItem | null
  palette: MenuPalette
}

export function AddedToCartToast({ item, palette }: AddedToCartToastProps) {
  if (!item) return null

  return (
    <div
      className="cart-added-toast fixed bottom-24 left-4 right-4 z-[55] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border bg-white p-3 shadow-2xl shadow-slate-950/20"
      style={{ borderColor: palette.soft }}
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
        style={{ backgroundColor: palette.soft }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <CheckCircle2
            className="h-7 w-7"
            style={{ color: palette.primary }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-black uppercase tracking-[0.12em]"
          style={{ color: palette.primary }}
        >
          Adicionado ao carrinho
        </p>
        <p className="mt-1 truncate text-sm font-black text-slate-950">
          {item.name}
        </p>
      </div>

      <CheckCircle2
        className="h-6 w-6 shrink-0"
        style={{ color: palette.primary }}
      />
    </div>
  )
}
