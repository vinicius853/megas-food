'use client'

import {
  ArrowLeft,
  Plus,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useCart } from './cart-context'
import {
  PizzaConfiguratorDrinkSuggestion,
  PizzaConfiguratorDrinkSuggestionFooter,
} from './pizza-configurator-drink-suggestion'
import {
  getFlavorLimitLabel,
  getSizeFlavorDescription,
  normalizeMaxFlavors,
  toNumber,
} from './pizza-configurator-helpers'
import { OptionCard } from './pizza-configurator-option-card'
import { PizzaConfiguratorSummary } from './pizza-configurator-summary'
import type {
  PizzaConfiguratorFlowProps,
  PizzaFlavor,
  SelectionMode,
  Step,
} from './pizza-configurator.types'

export function PizzaConfiguratorFlow({
  open,
  product,
  initialFlavorId,
  sizes,
  flavors,
  flavorPrices,
  borders,
  borderPrices,
  additionalProducts = [],
  onClose,
  shouldOfferDrinkSuggestion = false,
  onDrinkSuggestionShown,
  onViewDrinks,
  onOpenCart,
  onItemAdded,
}: PizzaConfiguratorFlowProps) {
  const { addItem } = useCart()

  const [step, setStep] = useState<Step>('size')
  const [selectedSizeId, setSelectedSizeId] = useState('')
  const [mode, setMode] = useState<SelectionMode>('whole')
  const [firstFlavorId, setFirstFlavorId] = useState('')
  const [extraFlavorIds, setExtraFlavorIds] = useState<string[]>([])
  const [selectedBorderId, setSelectedBorderId] = useState('')
  const [selectedAdditionalIds, setSelectedAdditionalIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return

    setStep('size')
    setSelectedSizeId('')
    setMode('whole')
    setFirstFlavorId(initialFlavorId ?? '')
    setExtraFlavorIds([])
    setSelectedBorderId('')
    setSelectedAdditionalIds([])
    setNotes('')
  }, [initialFlavorId, open])

  const productSizes = useMemo(() => {
    if (!product) return []

    return sizes
      .filter((size) => {
        if (size.productId !== product.id) return false

        if (!firstFlavorId) return true

        return flavorPrices.some(
          (price) =>
            price.productId === product.id &&
            price.sizeId === size.id &&
            price.flavorId === firstFlavorId &&
            toNumber(price.price) > 0,
        )
      })
      .map((size) => ({
        ...size,
        maxFlavors: normalizeMaxFlavors(size.maxFlavors),
      }))
      .slice(0, 4)
  }, [firstFlavorId, flavorPrices, product, sizes])

  const selectedSize = productSizes.find(
    (size) => size.id === selectedSizeId,
  )

  const firstFlavor =
    flavors.find((flavor) => flavor.id === firstFlavorId) ?? null

  const extraFlavors = extraFlavorIds
    .map((flavorId) => flavors.find((flavor) => flavor.id === flavorId))
    .filter(Boolean) as PizzaFlavor[]

  const availablePrices = useMemo(() => {
    if (!product || !selectedSize) return []

    return flavorPrices.filter(
      (price) =>
        price.productId === product.id &&
        price.sizeId === selectedSize.id &&
        toNumber(price.price) > 0,
    )
  }, [flavorPrices, product, selectedSize])

  const availableFlavorIds = new Set(
    availablePrices.map((price) => price.flavorId),
  )

  const availableFlavors = flavors.filter((flavor) =>
    availableFlavorIds.has(flavor.id),
  )

  function getFlavorPrice(flavorId: string) {
    return toNumber(
      availablePrices.find((price) => price.flavorId === flavorId)
        ?.price,
    )
  }

  const selectedFlavorIds = [
    firstFlavorId,
    ...(mode === 'multi' ? extraFlavorIds : []),
  ].filter(Boolean)

  const unitPrice =
    selectedFlavorIds.length > 0
      ? Math.max(...selectedFlavorIds.map(getFlavorPrice))
      : 0

  const selectedBorder =
    borders.find((border) => border.id === selectedBorderId) ?? null

  const selectedBorderPrice =
    product && selectedSize && selectedBorder
      ? toNumber(
          borderPrices.find(
            (price) =>
              price.productId === product.id &&
              price.sizeId === selectedSize.id &&
              price.borderId === selectedBorder.id,
          )?.price,
        )
      : 0

  const availableAdditionalProducts = additionalProducts.filter(
    (additional) => toNumber(additional.price) > 0,
  )

  const selectedAdditionalItems = availableAdditionalProducts.filter(
    (additional) => selectedAdditionalIds.includes(additional.id),
  )

  const selectedAdditionalTotal = selectedAdditionalItems.reduce(
    (total, additional) => total + toNumber(additional.price),
    0,
  )

  const totalPrice = unitPrice + selectedBorderPrice + selectedAdditionalTotal

  const hasAdditionalProducts = availableAdditionalProducts.length > 0

  function nextAfterFlavorChoice(size = selectedSize) {
    return size?.allowBorder
      ? 'borderQuestion'
      : hasAdditionalProducts
        ? 'additionalQuestion'
        : 'summary'
  }

  function nextAfterBorderChoice() {
    return hasAdditionalProducts ? 'additionalQuestion' : 'summary'
  }

  function goBack() {
    if (step === 'size') {
      onClose()
      return
    }

    if (step === 'mode') setStep('size')
    if (step === 'secondFlavor') setStep('mode')
    if (step === 'borderQuestion') {
      setStep(mode === 'multi' ? 'secondFlavor' : 'mode')
    }
    if (step === 'borderSelect') setStep('borderQuestion')
    if (step === 'additionalQuestion') {
      setStep(selectedSize?.allowBorder ? 'borderQuestion' : mode === 'multi' ? 'secondFlavor' : 'mode')
    }
    if (step === 'additionalSelect') setStep('additionalQuestion')
    if (step === 'summary') {
      setStep(hasAdditionalProducts ? 'additionalQuestion' : selectedSize?.allowBorder ? 'borderQuestion' : mode === 'multi' ? 'secondFlavor' : 'mode')
    }
    if (step === 'drinkSuggestion') onClose()
  }

  function toggleExtraFlavor(flavorId: string) {
    const maxExtras = Math.max((selectedSize?.maxFlavors ?? 1) - 1, 0)

    setExtraFlavorIds((current) => {
      if (current.includes(flavorId)) {
        return current.filter((id) => id !== flavorId)
      }

      if (current.length >= maxExtras) {
        return current
      }

      return [...current, flavorId]
    })
  }

  function toggleAdditional(additionalId: string) {
    setSelectedAdditionalIds((current) =>
      current.includes(additionalId)
        ? current.filter((id) => id !== additionalId)
        : [...current, additionalId],
    )
  }

  function addPizzaToCart() {
    if (!product || !selectedSize || !firstFlavor || totalPrice <= 0) return false

    const flavorNames = [
      firstFlavor.name,
      ...(mode === 'multi' ? extraFlavors.map((flavor) => flavor.name) : []),
    ]

    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      imageUrl: heroImage,
      sizeId: selectedSize.id,
      sizeName: selectedSize.name,
      flavorIds: selectedFlavorIds,
      flavors: flavorNames,
      borderId: selectedBorder?.id,
      borderName: selectedBorder?.name,
      borderPrice: selectedBorderPrice,
      additionalItems: selectedAdditionalItems.map((additional) => ({
        productId: additional.id,
        name: additional.name,
        price: toNumber(additional.price),
      })),
      quantity: 1,
      unitPrice,
      totalPrice,
      notes: notes.trim() || undefined,
    })

    return true
  }

  function handleFinish() {
    const added = addPizzaToCart()

    if (added) {
      onItemAdded?.({
        name: firstFlavor?.name || product?.name || 'Item',
        imageUrl: heroImage,
      })

      if (shouldOfferDrinkSuggestion) {
        onDrinkSuggestionShown?.()
        setStep('drinkSuggestion')
        return
      }
    }

    onClose()
  }

  if (!open || !product) return null

  const heroImage =
    firstFlavor?.imageUrl ||
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=90'

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 font-sans md:items-center">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl md:max-h-[calc(100vh-3rem)] md:rounded-[28px]">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 px-3 text-center">
            <h2 className="truncate text-sm font-black text-slate-950">
              {firstFlavor?.name || product.name}
              {selectedSize ? ` · ${selectedSize.name}` : ''}
            </h2>
            <p className="truncate text-xs font-semibold text-slate-500">
              {firstFlavor?.description || product.description || 'Monte seu pedido'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto px-4 py-5">
          <div className="mb-5 flex items-center gap-3">
            <img
              src={heroImage}
              alt={firstFlavor?.name || product.name}
              className="h-20 w-20 rounded-2xl object-cover shadow-sm"
            />
            <div>
              <p className="text-lg font-black text-slate-950">
                {firstFlavor?.name || product.name}
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">
                {firstFlavor?.description || product.description}
              </p>
            </div>
          </div>

          {step === 'size' && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Qual tamanho deseja?
              </h3>
              {productSizes.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  Este sabor ainda nao tem preco cadastrado em nenhum tamanho.
                </div>
              ) : (
                <div className="grid gap-3">
                  {productSizes.map((size) => {
                    const price = firstFlavorId
                      ? toNumber(
                          flavorPrices.find(
                            (item) =>
                              item.productId === product.id &&
                              item.sizeId === size.id &&
                              item.flavorId === firstFlavorId,
                          )?.price,
                        )
                      : 0

                    return (
                      <OptionCard
                        key={size.id}
                        title={size.name}
                        description={getSizeFlavorDescription(size.maxFlavors)}
                        price={price}
                        selected={selectedSizeId === size.id}
                        onClick={() => {
                          setSelectedSizeId(size.id)
                          setExtraFlavorIds([])
                          setSelectedBorderId('')
                          setStep('mode')
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {step === 'mode' && selectedSize && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                {selectedSize.maxFlavors > 1
                  ? 'Como deseja montar?'
                  : 'Pizza inteira'}
              </h3>
              <div className={`grid gap-3 ${selectedSize.maxFlavors > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <OptionCard
                  title="Inteira"
                  description="1 sabor"
                  selected={mode === 'whole'}
                  onClick={() => {
                    setMode('whole')
                    setExtraFlavorIds([])
                    setStep(nextAfterFlavorChoice(selectedSize))
                  }}
                />

                {selectedSize.maxFlavors > 1 && (
                  <OptionCard
                    title={getFlavorLimitLabel(selectedSize.maxFlavors)}
                    description={`Escolha ate ${selectedSize.maxFlavors} sabores`}
                    selected={mode === 'multi'}
                    onClick={() => {
                      setMode('multi')
                      setStep('secondFlavor')
                    }}
                  />
                )}
              </div>
            </section>
          )}

          {step === 'secondFlavor' && selectedSize && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Escolha os sabores
              </h3>
              <p className="mb-4 text-sm font-semibold text-slate-500">
                Voce pode escolher mais {selectedSize.maxFlavors - 1} sabor(es). Total selecionado: {selectedFlavorIds.length}/{selectedSize.maxFlavors}.
              </p>
              <div className="grid gap-3">
                {availableFlavors
                  .filter((flavor) => flavor.id !== firstFlavorId)
                  .map((flavor) => (
                    <OptionCard
                      key={flavor.id}
                      title={flavor.name}
                      description={flavor.description ?? undefined}
                      price={getFlavorPrice(flavor.id)}
                      selected={extraFlavorIds.includes(flavor.id)}
                      onClick={() => {
                        toggleExtraFlavor(flavor.id)
                      }}
                    />
                  ))}
              </div>
              <button
                type="button"
                disabled={extraFlavorIds.length === 0}
                onClick={() => setStep(nextAfterFlavorChoice(selectedSize))}
                className="mt-4 h-12 w-full rounded-2xl bg-red-700 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                Continuar
              </button>
            </section>
          )}

          {step === 'borderQuestion' && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Deseja borda recheada?
              </h3>
              <div className="grid gap-3">
                <OptionCard
                  title="Sim, quero borda"
                  description="Escolher sabor da borda"
                  onClick={() => setStep('borderSelect')}
                />
                <OptionCard
                  title="Nao, obrigado"
                  description="Prefiro sem borda"
                  onClick={() => {
                    setSelectedBorderId('')
                    setStep(nextAfterBorderChoice())
                  }}
                />
              </div>
            </section>
          )}

          {step === 'borderSelect' && selectedSize && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Escolha sua borda recheada
              </h3>
              <div className="grid gap-3">
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
                    <OptionCard
                      key={border.id}
                      title={border.name}
                      price={price}
                      selected={selectedBorderId === border.id}
                      onClick={() => {
                        setSelectedBorderId(border.id)
                        setStep(nextAfterBorderChoice())
                      }}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {step === 'additionalQuestion' && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Deseja adicionar algum extra?
              </h3>
              <div className="grid gap-3">
                <OptionCard
                  title="Sim, quero adicionais"
                  description="Escolher bacon, cheddar e outros extras"
                  onClick={() => setStep('additionalSelect')}
                />
                <OptionCard
                  title="Nao, obrigado"
                  description="Continuar sem adicionais"
                  onClick={() => {
                    setSelectedAdditionalIds([])
                    setStep('summary')
                  }}
                />
              </div>
            </section>
          )}

          {step === 'additionalSelect' && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Escolha seus adicionais
              </h3>
              <div className="grid gap-3">
                {availableAdditionalProducts.map((additional) => (
                  <OptionCard
                    key={additional.id}
                    title={additional.name}
                    description={additional.description ?? undefined}
                    price={toNumber(additional.price)}
                    selected={selectedAdditionalIds.includes(additional.id)}
                    onClick={() => toggleAdditional(additional.id)}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep('summary')}
                className="mt-4 h-12 w-full rounded-2xl bg-red-700 text-sm font-black text-white shadow-lg"
              >
                Continuar
              </button>
            </section>
          )}

          {step === 'summary' && (
            <PizzaConfiguratorSummary
              productName={product.name}
              sizeName={selectedSize?.name}
              flavorNames={[
                firstFlavor?.name ?? '',
                ...extraFlavors.map((flavor) => flavor.name),
              ]}
              borderName={selectedBorder?.name}
              additionalNames={selectedAdditionalItems.map(
                (additional) => additional.name,
              )}
              isMulti={mode === 'multi'}
              notes={notes}
              onNotesChange={setNotes}
              totalPrice={totalPrice}
            />
          )}

          {step === 'drinkSuggestion' && (
            <PizzaConfiguratorDrinkSuggestion />
          )}
        </div>

        {step === 'summary' && (
          <footer className="border-t border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={handleFinish}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-700 text-base font-black text-white shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Adicionar ao carrinho
            </button>
          </footer>
        )}

        {step === 'drinkSuggestion' && (
          <PizzaConfiguratorDrinkSuggestionFooter
            onViewDrinks={() => {
              onClose()
              onViewDrinks()
            }}
            onOpenCart={() => {
              onClose()
              onOpenCart()
            }}
          />
        )}

      </div>
    </div>
  )
}
