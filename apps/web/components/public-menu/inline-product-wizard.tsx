'use client'

import {
  Check,
  ChevronDown,
  Plus,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useCart } from './cart-context'

type ProductType = 'PIZZA_ROUND' | 'PIZZA_SQUARE' | 'DRINK' | 'OTHER'

type Product = {
  id: string
  name: string
  description?: string | null
  type?: ProductType
}

type PizzaSize = {
  id: string
  productId: string
  name: string
  maxFlavors: number
  allowBorder: boolean
}

type PizzaFlavor = {
  id: string
  name: string
  description?: string | null
}

type FlavorPrice = {
  productId: string
  sizeId: string
  flavorId: string
  price: string | number
}

type PizzaBorder = {
  id: string
  name: string
}

type BorderPrice = {
  productId: string
  sizeId: string
  borderId: string
  price: string | number
}

type SelectionMode = 'whole' | 'half'

type InlineProductWizardProps = {
  product: Product
  fixedProductPrice?: number
  initialFlavorId?: string | null
  sizes: PizzaSize[]
  flavors: PizzaFlavor[]
  flavorPrices: FlavorPrice[]
  borders: PizzaBorder[]
  borderPrices: BorderPrice[]
  onAddedToCart?: (product: Product) => void
  onCancel: () => void
}

function toNumber(value: unknown) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function isPizzaProduct(product: Product) {
  return product.type === 'PIZZA_ROUND' || product.type === 'PIZZA_SQUARE'
}

function Step({
  title,
  children,
  muted,
}: {
  title: string
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <section
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        muted ? 'border-slate-200' : 'border-orange-200'
      }`}
    >
      <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-900">
        {title}
      </h4>

      {children}
    </section>
  )
}

export function InlineProductWizard({
  product,
  fixedProductPrice = 0,
  initialFlavorId,
  sizes,
  flavors,
  flavorPrices,
  borders,
  borderPrices,
  onAddedToCart,
  onCancel,
}: InlineProductWizardProps) {
  const { addItem } = useCart()

  const rootRef = useRef<HTMLDivElement | null>(null)
  const nextStepRef = useRef<HTMLDivElement | null>(null)

  const pizza = isPizzaProduct(product)

  const productSizes = useMemo(
    () => sizes.filter((size) => size.productId === product.id),
    [product.id, sizes],
  )

  const [selectedSizeId, setSelectedSizeId] = useState('')
  const [selectionMode, setSelectionMode] =
    useState<SelectionMode>('whole')
  const [firstFlavorId, setFirstFlavorId] = useState(
    initialFlavorId ?? '',
  )
  const [secondFlavorId, setSecondFlavorId] = useState('')
  const [selectedBorderId, setSelectedBorderId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setSelectedSizeId('')
    setSelectionMode('whole')
    setFirstFlavorId(initialFlavorId ?? '')
    setSecondFlavorId('')
    setSelectedBorderId('')
    setNotes('')

    window.requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }, [initialFlavorId, product.id])

  const selectedSize = productSizes.find(
    (size) => size.id === selectedSizeId,
  )

  const availablePrices = useMemo(() => {
    if (!selectedSize) return []

    return flavorPrices.filter(
      (item) =>
        item.productId === product.id &&
        item.sizeId === selectedSize.id,
    )
  }, [flavorPrices, product.id, selectedSize])

  const availableFlavorIds = new Set(
    availablePrices.map((item) => item.flavorId),
  )

  const availableFlavors = flavors.filter((flavor) =>
    availableFlavorIds.has(flavor.id),
  )

  const firstFlavor =
    flavors.find((flavor) => flavor.id === firstFlavorId) ?? null

  const secondFlavor =
    flavors.find((flavor) => flavor.id === secondFlavorId) ?? null

  const canChooseHalf =
    Boolean(selectedSize && selectedSize.maxFlavors > 1)

  const selectedFlavorIds = [
    firstFlavorId,
    ...(selectionMode === 'half' ? [secondFlavorId] : []),
  ].filter(Boolean)

  const selectedFlavorPrices = selectedFlavorIds.map((flavorId) => {
    const price = availablePrices.find(
      (item) => item.flavorId === flavorId,
    )

    return toNumber(price?.price)
  })

  const unitPrice = pizza
    ? selectedFlavorPrices.length > 0
      ? Math.max(...selectedFlavorPrices)
      : 0
    : fixedProductPrice

  const selectedBorder =
    borders.find((border) => border.id === selectedBorderId) ?? null

  const selectedBorderPrice =
    pizza && selectedSize && selectedBorder
      ? toNumber(
          borderPrices.find(
            (item) =>
              item.productId === product.id &&
              item.sizeId === selectedSize.id &&
              item.borderId === selectedBorder.id,
          )?.price,
        )
      : 0

  const totalPrice = unitPrice + selectedBorderPrice

  const canShowModeStep = pizza && Boolean(selectedSize)
  const canShowSecondFlavorStep =
    pizza && selectionMode === 'half' && Boolean(selectedSize)
  const canShowOptionalStep =
    !pizza ||
    Boolean(
      selectedSize &&
        firstFlavorId &&
        (selectionMode === 'whole' || secondFlavorId),
    )
  const canAdd =
    !pizza ||
    Boolean(
      selectedSize &&
        firstFlavorId &&
        (selectionMode === 'whole' || secondFlavorId) &&
        unitPrice > 0,
    )

  useEffect(() => {
    if (selectedSizeId || selectionMode === 'half' || secondFlavorId) {
      nextStepRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [selectedSizeId, selectionMode, secondFlavorId])

  function handleSelectSize(sizeId: string) {
    setSelectedSizeId(sizeId)
    setSelectionMode('whole')
    setSecondFlavorId('')
    setSelectedBorderId('')
  }

  function handleModeChange(mode: SelectionMode) {
    setSelectionMode(mode)

    if (mode === 'whole') {
      setSecondFlavorId('')
    }
  }

  function handleAddToCart() {
    if (!canAdd) return

    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      sizeId: selectedSize?.id,
      sizeName: selectedSize?.name,
      flavorIds: selectedFlavorIds,
      flavors:
        selectedFlavorIds.length > 0
          ? [firstFlavor?.name, secondFlavor?.name].filter(Boolean) as string[]
          : [],
      borderId: selectedBorder?.id,
      borderName: selectedBorder?.name,
      borderPrice: selectedBorderPrice,
      quantity: 1,
      unitPrice,
      totalPrice,
      notes: notes.trim() || undefined,
    })

    onAddedToCart?.(product)
    onCancel()
  }

  return (
    <div
      ref={rootRef}
      className="mt-3 space-y-3 rounded-2xl border border-orange-200 bg-orange-50/50 p-3"
    >
      {pizza ? (
        <>
          <Step title="1. Escolha o tamanho">
            <div className="grid gap-2 sm:grid-cols-2">
              {productSizes.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => handleSelectSize(size.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-black transition ${
                    selectedSizeId === size.id
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  <span>{size.name}</span>
                  <span className="mt-1 block text-xs font-bold opacity-75">
                    Ate {size.maxFlavors} sabores
                  </span>
                </button>
              ))}
            </div>
          </Step>

          {canShowModeStep && (
            <div ref={nextStepRef}>
              <Step title="2. Como deseja a pizza?">
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange('whole')}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-black transition ${
                      selectionMode === 'whole'
                        ? 'border-orange-600 bg-orange-600 text-white'
                        : 'border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    Inteira
                  </button>

                  {canChooseHalf && (
                    <button
                      type="button"
                      onClick={() => handleModeChange('half')}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-black transition ${
                        selectionMode === 'half'
                          ? 'border-orange-600 bg-orange-600 text-white'
                          : 'border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      Meio a meio
                    </button>
                  )}
                </div>
              </Step>
            </div>
          )}

          {canShowSecondFlavorStep && (
            <Step title="3. Escolha o segundo sabor">
              <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {availableFlavors
                  .filter((flavor) => flavor.id !== firstFlavorId)
                  .map((flavor) => (
                    <button
                      key={flavor.id}
                      type="button"
                      onClick={() => setSecondFlavorId(flavor.id)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-black transition ${
                        secondFlavorId === flavor.id
                          ? 'border-orange-600 bg-orange-600 text-white'
                          : 'border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      {flavor.name}
                    </button>
                  ))}
              </div>
            </Step>
          )}

          {canShowOptionalStep && selectedSize?.allowBorder && (
            <Step title="Opcional: borda recheada" muted>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBorderId('')}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-black transition ${
                    selectedBorderId === ''
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  <span>Sem borda</span>
                  <span>{formatMoney(0)}</span>
                </button>

                {borders.map((border) => {
                  const price = toNumber(
                    borderPrices.find(
                      (item) =>
                        item.productId === product.id &&
                        item.sizeId === selectedSize.id &&
                        item.borderId === border.id,
                    )?.price,
                  )

                  return (
                    <button
                      key={border.id}
                      type="button"
                      onClick={() => setSelectedBorderId(border.id)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-black transition ${
                        selectedBorderId === border.id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      <span>{border.name}</span>
                      <span>+ {formatMoney(price)}</span>
                    </button>
                  )
                })}
              </div>
            </Step>
          )}
        </>
      ) : (
        <Step title="Confirmar produto">
          <p className="text-sm font-bold text-slate-700">
            {product.description || 'Produto selecionado.'}
          </p>
        </Step>
      )}

      {canShowOptionalStep && (
        <>
          <Step title="Opcional: observacao" muted>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex: tirar cebola, caprichar no molho..."
              rows={3}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
            />
          </Step>

          <Step title="Resumo">
            <div className="space-y-2 text-sm font-bold text-slate-700">
              <p>
                Produto:{' '}
                <span className="text-slate-950">{product.name}</span>
              </p>

              {selectedSize && (
                <p>
                  Tamanho:{' '}
                  <span className="text-slate-950">{selectedSize.name}</span>
                </p>
              )}

              {selectedFlavorIds.length > 0 && (
                <p>
                  Sabores:{' '}
                  <span className="text-slate-950">
                    {[firstFlavor?.name, secondFlavor?.name]
                      .filter(Boolean)
                      .join(' / ')}
                  </span>
                </p>
              )}

              {selectedBorder && (
                <p>
                  Borda:{' '}
                  <span className="text-slate-950">
                    {selectedBorder.name}
                  </span>
                </p>
              )}

              {notes.trim() && (
                <p>
                  Obs:{' '}
                  <span className="text-slate-950">{notes.trim()}</span>
                </p>
              )}

              {selectionMode === 'half' && (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Meio a meio cobra o maior preco entre os sabores escolhidos.
                </p>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span>Total</span>
                <strong className="text-xl text-orange-600">
                  {formatMoney(totalPrice)}
                </strong>
              </div>
            </div>
          </Step>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAdd}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-black text-white shadow-lg transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Adicionar ao carrinho
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <ChevronDown className="h-4 w-4" />
              Recolher
            </button>
          </div>
        </>
      )}
    </div>
  )
}
