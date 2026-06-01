'use client'

import {
  Minus,
  Pizza,
  Plus,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useCart } from './cart-context'

type Product = {
  id: string
  name: string
  description?: string | null
  type?: 'PIZZA_ROUND' | 'PIZZA_SQUARE' | 'DRINK' | 'OTHER'
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
}

type FlavorPrice = {
  id: string
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
  id: string
  productId: string
  sizeId: string
  borderId: string
  price: string | number
}

type ProductModalProps = {
  open: boolean
  onClose: () => void
  onAddedToCart?: (product: Product) => void
  product: Product | null
  sizes: PizzaSize[]
  flavors: PizzaFlavor[]
  flavorPrices: FlavorPrice[]
  borders: PizzaBorder[]
  borderPrices: BorderPrice[]
  initialFlavorId?: string | null
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

export function ProductModal({
  open,
  onClose,
  onAddedToCart,
  product,
  sizes,
  flavors,
  flavorPrices,
  borders,
  borderPrices,
  initialFlavorId,
}: ProductModalProps) {
  const { addItem } = useCart()

  const [selectedSizeId, setSelectedSizeId] = useState('')
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [selectedBorderId, setSelectedBorderId] = useState('')

  useEffect(() => {
    if (!open) return

    setSelectedSizeId('')
    setSelectedFlavors(initialFlavorId ? [initialFlavorId] : [])
    setSelectedBorderId('')
  }, [initialFlavorId, open, product?.id])

  const productSizes = useMemo(() => {
    if (!product) return []

    return sizes.filter((size) => size.productId === product.id)
  }, [product, sizes])

  const selectedSize = useMemo(() => {
    return productSizes.find((size) => size.id === selectedSizeId)
  }, [productSizes, selectedSizeId])

  const availablePrices = useMemo(() => {
    if (!product || !selectedSizeId) return []

    return flavorPrices.filter(
      (item) =>
        item.productId === product.id &&
        item.sizeId === selectedSizeId,
    )
  }, [product, selectedSizeId, flavorPrices])

  const availableFlavorIds = useMemo(() => {
    return availablePrices.map((item) => item.flavorId)
  }, [availablePrices])

  const availableFlavors = useMemo(() => {
    return flavors.filter((flavor) =>
      availableFlavorIds.includes(flavor.id),
    )
  }, [flavors, availableFlavorIds])

  const selectedFlavorPrices = useMemo(() => {
    return availablePrices.filter((item) =>
      selectedFlavors.includes(item.flavorId),
    )
  }, [availablePrices, selectedFlavors])

  const unitPrice = useMemo(() => {
    if (!product || !selectedSize || selectedFlavors.length === 0) {
      return 0
    }

    const prices = selectedFlavorPrices.map((item) =>
      toNumber(item.price),
    )

    if (prices.length === 0) return 0

    return Math.max(...prices)
  }, [product, selectedSize, selectedFlavors, selectedFlavorPrices])

  const selectedBorder = useMemo(() => {
    if (!selectedBorderId) return null

    return borders.find((border) => border.id === selectedBorderId) ?? null
  }, [borders, selectedBorderId])

  const selectedBorderPrice = useMemo(() => {
    if (!product || !selectedSize || !selectedBorderId) return 0

    const borderPrice = borderPrices.find(
      (item) =>
        item.productId === product.id &&
        item.sizeId === selectedSize.id &&
        item.borderId === selectedBorderId,
    )

    return toNumber(borderPrice?.price)
  }, [product, selectedSize, selectedBorderId, borderPrices])

  const totalPrice = useMemo(() => {
    return unitPrice + selectedBorderPrice
  }, [unitPrice, selectedBorderPrice])

  function toggleFlavor(flavorId: string) {
    if (!selectedSize) return

    const alreadySelected = selectedFlavors.includes(flavorId)

    if (alreadySelected) {
      setSelectedFlavors((prev) =>
        prev.filter((id) => id !== flavorId),
      )
      return
    }

    if (selectedFlavors.length >= selectedSize.maxFlavors) {
      return
    }

    setSelectedFlavors((prev) => [...prev, flavorId])
  }

  function resetAndClose() {
    setSelectedSizeId('')
    setSelectedFlavors([])
    setSelectedBorderId('')
    onClose()
  }

  function handleAddToCart() {
    if (!product || !selectedSize || selectedFlavors.length === 0) {
      return
    }

    const selectedFlavorNames = availableFlavors
      .filter((flavor) => selectedFlavors.includes(flavor.id))
      .map((flavor) => flavor.name)

    addItem({
      id: crypto.randomUUID(),

      productId: product.id,
      productName: product.name,

      sizeId: selectedSize.id,
      sizeName: selectedSize.name,

      flavorIds: selectedFlavors,
      flavors: selectedFlavorNames,

      borderId: selectedBorderId || undefined,
      borderName: selectedBorder?.name,
      borderPrice: selectedBorderPrice,

      quantity: 1,

      unitPrice,
      totalPrice,
    })

    resetAndClose()
    onAddedToCart?.(product)
  }

  if (!open || !product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {product.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {product.description || 'Monte sua pizza'}
            </p>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Escolha o tamanho
              </h3>

              <div className="grid gap-2">
                {productSizes.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => {
                      setSelectedSizeId(size.id)
                      setSelectedFlavors(
                        initialFlavorId ? [initialFlavorId] : [],
                      )
                      setSelectedBorderId('')
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedSizeId === size.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {size.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Até {size.maxFlavors} sabores
                        </p>
                      </div>

                      <Pizza className="h-5 w-5 text-orange-500" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {selectedSize && (
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Escolha os sabores
                  </h3>

                  <span className="text-xs text-slate-400">
                    {selectedFlavors.length}/{selectedSize.maxFlavors}
                  </span>
                </div>

                <div className="grid gap-2">
                  {availableFlavors.map((flavor) => {
                    const selected = selectedFlavors.includes(flavor.id)

                    return (
                      <button
                        key={flavor.id}
                        type="button"
                        onClick={() => toggleFlavor(flavor.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {flavor.name}
                            </p>
                          </div>

                          {selected ? (
                            <Minus className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Plus className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {selectedSize?.allowBorder && (
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Borda recheada
                </h3>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBorderId('')}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedBorderId === ''
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Sem borda</span>
                      <span className="text-sm font-semibold text-slate-500">
                        R$ 0,00
                      </span>
                    </div>
                  </button>

                  {borders.map((border) => {
                    const borderPrice = borderPrices.find(
                      (item) =>
                        item.productId === product.id &&
                        item.sizeId === selectedSize.id &&
                        item.borderId === border.id,
                    )

                    const price = toNumber(borderPrice?.price)

                    return (
                      <button
                        key={border.id}
                        type="button"
                        onClick={() => setSelectedBorderId(border.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selectedBorderId === border.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{border.name}</span>

                          <span className="text-sm font-semibold text-orange-600">
                            + {formatMoney(price)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-5">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedSizeId || selectedFlavors.length === 0}
            className="flex w-full items-center justify-between rounded-2xl bg-orange-600 px-5 py-4 text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="font-semibold">Adicionar ao carrinho</span>

            <span className="text-lg font-bold">
              {formatMoney(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
