'use client'

import { useEffect, useState } from 'react'
import {
  Minus,
  Plus,
  ReceiptText,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { useCart } from './cart-context'
import { CheckoutModal } from './checkout-modal'

type CartDrawerProps = {
  open: boolean
  onClose: () => void
  onOrderFinished?: () => void
  tenantName: string
  tenantSlug: string
  whatsapp?: string | null
  palette?: MenuPalette
  delivery?: DeliverySettings
  ordersEnabled?: boolean
  closedMessage?: string
}

type MenuPalette = {
  primary: string
  secondary: string
  accent: string
  soft: string
  textOnPrimary: string
}

type DeliveryZone = {
  id: string
  name: string
  fee: number
  eta: string
  isActive: boolean
}

type DeliverySettings = {
  isDeliveryOpen?: boolean
  city?: string
  state?: string
  storeCep?: string
  storeAddress?: string
  whatsapp?: string
  zones?: DeliveryZone[]
}

type AppliedCoupon = {
  code: string
  discountAmount: number
  subtotal: number
}

function toNumber(value: unknown) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

function formatMoney(value: unknown) {
  return toNumber(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function itemSubtitle(item: {
  sizeName?: string
  flavors: string[]
}) {
  const details = [
    item.sizeName,
    item.flavors.length > 0 ? item.flavors.join(' / ') : '',
  ].filter(Boolean)

  return details.join(' · ')
}

export function CartDrawer({
  open,
  onClose,
  onOrderFinished,
  tenantName,
  tenantSlug,
  whatsapp,
  palette,
  delivery,
  ordersEnabled = true,
  closedMessage,
}: CartDrawerProps) {
  const {
    items,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    removeFlavor,
    removeBorder,
    removeAdditionalItem,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart()

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [couponOpen, setCouponOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const theme = palette ?? {
    primary: '#C40012',
    secondary: '#FF4A00',
    accent: '#FFD166',
    soft: '#FFF1F2',
    textOnPrimary: '#FFFFFF',
  }
  const discountedSubtotal = Math.max(
    totalPrice - (appliedCoupon?.discountAmount ?? 0),
    0,
  )

  async function applyCoupon() {
    try {
      setCouponLoading(true)
      setCouponError('')

      const response = await apiFetch<AppliedCoupon>(
        `/public-coupons/${tenantSlug}/validate`,
        {
          method: 'POST',
          body: JSON.stringify({
            code: couponCode.trim(),
            subtotal: totalPrice,
          }),
        },
      )

      setAppliedCoupon({
        code: response.code,
        discountAmount: response.discountAmount,
        subtotal: response.subtotal ?? totalPrice,
      })
      setCouponCode(response.code)
      setCouponOpen(false)
    } catch (error) {
      setAppliedCoupon(null)
      setCouponError(
        error instanceof Error ? error.message : 'Cupom invalido.',
      )
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  function handleOrderFinished() {
    clearCart()
    removeCoupon()
    setCouponOpen(false)
    setCheckoutOpen(false)
    onClose()
    onOrderFinished?.()
  }

  useEffect(() => {
    if (!appliedCoupon) return

    if (totalPrice <= 0) {
      removeCoupon()
      return
    }

    if (appliedCoupon.subtotal === totalPrice) return

    let cancelled = false

    async function revalidateCoupon() {
      try {
        const response = await apiFetch<AppliedCoupon>(
          `/public-coupons/${tenantSlug}/validate`,
          {
            method: 'POST',
            body: JSON.stringify({
              code: appliedCoupon?.code,
              subtotal: totalPrice,
            }),
          },
        )

        if (cancelled) return

        setAppliedCoupon({
          code: response.code,
          discountAmount: response.discountAmount,
          subtotal: response.subtotal ?? totalPrice,
        })
        setCouponError('')
      } catch {
        if (cancelled) return

        setAppliedCoupon(null)
        setCouponError('Cupom removido porque o carrinho mudou.')
      }
    }

    revalidateCoupon()

    return () => {
      cancelled = true
    }
  }, [appliedCoupon, tenantSlug, totalPrice])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/45 px-3 pb-4 pt-20 md:items-center md:p-6">
        <div className="flex max-h-[calc(100dvh-6rem)] min-h-0 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300 flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:max-h-[calc(100dvh-3rem)]">
          <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-950">
                Carrinho
              </h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'} no pedido
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-3">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.soft, color: theme.primary }}
                >
                  <ShoppingBag className="h-10 w-10" />
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-950">
                  Carrinho vazio
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                  Adicione produtos para acompanhar o valor e finalizar seu pedido.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="grid grid-cols-[52px_1fr] gap-3">
                      <div
                        className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border"
                        style={{
                          backgroundColor: theme.soft,
                          borderColor: theme.accent,
                        }}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{ color: theme.primary }}
                          >
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-black leading-tight text-slate-950">
                              {item.productName}
                            </h3>
                            {itemSubtitle(item) && (
                              <p className="mt-0.5 line-clamp-1 text-xs font-semibold leading-relaxed text-slate-500">
                                {itemSubtitle(item)}
                              </p>
                            )}
                          </div>

                          <strong
                            className="shrink-0 text-sm font-black"
                            style={{ color: theme.primary }}
                          >
                            {formatMoney(item.totalPrice * item.quantity)}
                          </strong>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => decreaseQuantity(item.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <span className="w-5 text-center text-sm font-black text-slate-950">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => increaseQuantity(item.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {item.flavors.length > 0 && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Sabores ({item.flavors.length})
                        </p>

                        <div className="space-y-1.5">
                          {item.flavors.map((flavor, index) => (
                            <div
                              key={`${item.id}-${flavor}-${index}`}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="flex items-center gap-2 font-semibold text-slate-700">
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: theme.primary }}
                                />
                                {flavor}
                              </span>

                              {item.flavors.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeFlavor(item.id, index)}
                                className="text-[11px] font-bold text-slate-500 hover:text-red-600"
                                >
                                  Remover
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.borderName && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Borda
                        </p>

                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div>
                            <p className="font-semibold text-slate-700">
                              {item.borderName}
                            </p>
                            <p
                              className="mt-1 text-xs font-bold"
                              style={{ color: theme.primary }}
                            >
                              + {formatMoney(item.borderPrice)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeBorder(item.id)}
                            className="text-[11px] font-bold text-slate-500 hover:text-red-600"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    )}

                    {(item.additionalItems?.length ?? 0) > 0 && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Adicionais
                        </p>

                        <div className="space-y-1.5">
                          {item.additionalItems?.map((additional, index) => (
                            <div
                              key={`${item.id}-${additional.productId}-${index}`}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <div>
                                <p className="font-semibold text-slate-700">
                                  {additional.name}
                                </p>
                                <p
                                  className="mt-1 text-xs font-bold"
                                  style={{ color: theme.primary }}
                                >
                                  + {formatMoney(additional.price)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeAdditionalItem(item.id, index)
                                }
                                className="text-[11px] font-bold text-slate-500 hover:text-red-600"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.notes && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Observacao
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {item.notes}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          <footer className="flex-shrink-0 border-t border-slate-200 bg-white p-3">
            <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3">
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-black text-slate-800">
                      <Tag className="h-4 w-4" />
                      Cupom {appliedCoupon.code}
                    </p>
                    <p
                      className="mt-1 text-xs font-bold"
                      style={{ color: theme.primary }}
                    >
                      - {formatMoney(appliedCoupon.discountAmount)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs font-black text-slate-500 hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
              ) : couponOpen ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(event) =>
                        setCouponCode(event.target.value.toUpperCase())
                      }
                      placeholder="CODIGO"
                      className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="rounded-xl px-4 text-xs font-black disabled:opacity-50"
                      style={{
                        backgroundColor: theme.primary,
                        color: theme.textOnPrimary,
                      }}
                    >
                      {couponLoading ? '...' : 'Aplicar'}
                    </button>
                  </div>

                  {couponError && (
                    <p className="text-xs font-bold text-red-600">{couponError}</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCouponOpen(true)}
                  className="flex h-8 w-full items-center justify-between text-sm font-bold text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Adicionar cupom de desconto
                  </span>
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mb-3 space-y-2">
              {appliedCoupon && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">Desconto</span>
                  <strong style={{ color: theme.primary }}>
                    - {formatMoney(appliedCoupon.discountAmount)}
                  </strong>
                </div>
              )}

              <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">Subtotal</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                  Taxa de entrega calculada no fechamento
                </p>
              </div>

              <strong
                className="text-2xl font-black"
                style={{ color: theme.primary }}
              >
                {formatMoney(discountedSubtotal)}
              </strong>
              </div>
            </div>

            {!ordersEnabled && (
              <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                {closedMessage ?? 'O estabelecimento esta fora do horario de atendimento.'}
              </div>
            )}

            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              disabled={items.length === 0 || !ordersEnabled}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-base font-black uppercase shadow-xl transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: theme.primary,
                color: theme.textOnPrimary,
                boxShadow: `0 20px 35px ${theme.primary}33`,
              }}
            >
              <ReceiptText className="h-5 w-5" />
              Finalizar pedido
            </button>
          </footer>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderFinished={handleOrderFinished}
        items={items}
        totalPrice={totalPrice}
        couponCode={appliedCoupon?.code}
        discountAmount={appliedCoupon?.discountAmount ?? 0}
        whatsapp={whatsapp}
        tenantName={tenantName}
        tenantSlug={tenantSlug}
        palette={theme}
        delivery={delivery}
        ordersEnabled={ordersEnabled}
        closedMessage={closedMessage}
      />
    </>
  )
}
