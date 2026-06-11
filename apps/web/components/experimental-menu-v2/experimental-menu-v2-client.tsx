'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { apiFetch } from '@/lib/api'

import {
  buildOptionNameMap,
  buildPriceEngineModifiers,
  buildPublicOrderV2Payload,
  formatMoney,
  getContextualPriceSummary,
  getGroupStatus,
  getProductBasePrice,
  hasAnySelection,
  toggleOption,
} from './experimental-menu-v2.helpers'
import type {
  ExperimentalMenuV2Selections,
  PublicMenuV2ModifierGroup,
  PublicMenuV2Product,
  PublicMenuV2PriceResult,
  PublicMenuV2Response,
  PublicOrderV2Response,
} from './experimental-menu-v2.types'

export function ExperimentalMenuV2Client({ slug }: { slug: string }) {
  const [menu, setMenu] = useState<PublicMenuV2Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  )
  const [selections, setSelections] = useState<ExperimentalMenuV2Selections>({})
  const [priceResult, setPriceResult] =
    useState<PublicMenuV2PriceResult | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('Cliente V2')
  const [customerPhone, setCustomerPhone] = useState('11999999999')
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [createdOrder, setCreatedOrder] =
    useState<PublicOrderV2Response | null>(null)

  useEffect(() => {
    let active = true

    async function loadMenu() {
      try {
        setLoading(true)
        setError('')

        const response = await apiFetch<PublicMenuV2Response>(
          `/public-menu-v2/${slug}`,
        )

        if (!active) return

        setMenu(response)

        const firstProduct = response.categories
          .flatMap((category) => category.products)
          .find(Boolean)

        setSelectedProductId(firstProduct?.id ?? null)
      } catch (err) {
        if (!active) return

        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao carregar cardapio experimental.',
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadMenu()

    return () => {
      active = false
    }
  }, [slug])

  const products = useMemo(
    () => menu?.categories.flatMap((category) => category.products) ?? [],
    [menu],
  )
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ??
    products[0] ??
    null

  useEffect(() => {
    let active = true

    async function calculatePrice() {
      if (!selectedProduct || !hasAnySelection(selections)) {
        setPriceResult(null)
        setPriceError('')
        return
      }

      try {
        setPriceLoading(true)
        setPriceError('')

        const response = await apiFetch<PublicMenuV2PriceResult>(
          `/public-menu-v2/${slug}/price`,
          {
            method: 'POST',
            body: JSON.stringify({
              productId: selectedProduct.id,
              quantity,
              selectedModifiers: buildPriceEngineModifiers(
                selectedProduct,
                selections,
              ),
            }),
          },
        )

        if (!active) return

        setPriceResult(response)
        setOrderError('')
      } catch (err) {
        if (!active) return

        setPriceError(
          err instanceof Error
            ? err.message
            : 'Erro ao calcular preco experimental.',
        )
      } finally {
        if (active) {
          setPriceLoading(false)
        }
      }
    }

    calculatePrice()

    return () => {
      active = false
    }
  }, [selectedProduct, selections, slug, quantity])

  async function createExperimentalOrder() {
    if (!selectedProduct) return

    try {
      setOrderLoading(true)
      setOrderError('')
      setCreatedOrder(null)

      const response = await apiFetch<PublicOrderV2Response>(
        `/public-orders-v2/${slug}`,
        {
          method: 'POST',
          body: JSON.stringify(
            buildPublicOrderV2Payload({
              customer: {
                name: customerName,
                phone: customerPhone,
              },
              product: selectedProduct,
              quantity,
              selections,
            }),
          ),
        },
      )

      setCreatedOrder(response)
    } catch (err) {
      setOrderError(getFriendlyApiError(err))
    } finally {
      setOrderLoading(false)
    }
  }

  if (loading) {
    return <Shell title="Carregando cardapio V2..." />
  }

  if (error || !menu) {
    return (
      <Shell title="Cardapio V2">
        <div className="mx-auto max-w-2xl rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || 'Cardapio experimental indisponivel.'}
        </div>
      </Shell>
    )
  }

  return (
    <Shell title={menu.tenant.name}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:grid lg:grid-cols-[320px_1fr]">
        <aside className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Experimental V2
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">
              {menu.tenant.name}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Renderizacao generica de produtos, grupos, opcoes e precos
              contextuais.
            </p>
          </div>

          <div className="max-h-[72vh] overflow-auto p-3">
            {menu.categories.map((category) => (
              <section key={category.id} className="mb-5">
                <h2 className="px-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {category.name}
                </h2>
                <div className="mt-2 space-y-2">
                  {category.products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSelectedProductId(product.id)
                        setSelections({})
                        setPriceResult(null)
                        setCreatedOrder(null)
                        setOrderError('')
                      }}
                      className={[
                        'w-full rounded-md border p-3 text-left transition',
                        selectedProduct?.id === product.id
                          ? 'border-red-500 bg-red-50 text-red-950'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300',
                      ].join(' ')}
                    >
                      <span className="block text-sm font-semibold">
                        {product.name}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {product.modifierGroups.length} grupos genericos
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </aside>

        <main>
          {selectedProduct ? (
            <ProductDetail
              product={selectedProduct}
              selections={selections}
              priceResult={priceResult}
              priceLoading={priceLoading}
              priceError={priceError}
              quantity={quantity}
              customerName={customerName}
              customerPhone={customerPhone}
              orderLoading={orderLoading}
              orderError={orderError}
              createdOrder={createdOrder}
              onQuantityChange={setQuantity}
              onCustomerNameChange={setCustomerName}
              onCustomerPhoneChange={setCustomerPhone}
              onCreateOrder={createExperimentalOrder}
              onToggle={(group, optionId) =>
                setSelections((current) => {
                  setCreatedOrder(null)
                  setOrderError('')
                  return toggleOption(current, group, optionId)
                })
              }
            />
          ) : (
            <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-slate-600">
              Nenhum produto ativo retornado pelo endpoint V2.
            </div>
          )}
        </main>
      </div>
    </Shell>
  )
}

function ProductDetail({
  product,
  selections,
  priceResult,
  priceLoading,
  priceError,
  quantity,
  customerName,
  customerPhone,
  orderLoading,
  orderError,
  createdOrder,
  onQuantityChange,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onCreateOrder,
  onToggle,
}: {
  product: PublicMenuV2Product
  selections: ExperimentalMenuV2Selections
  priceResult: PublicMenuV2PriceResult | null
  priceLoading: boolean
  priceError: string
  quantity: number
  customerName: string
  customerPhone: string
  orderLoading: boolean
  orderError: string
  createdOrder: PublicOrderV2Response | null
  onQuantityChange: (quantity: number) => void
  onCustomerNameChange: (name: string) => void
  onCustomerPhoneChange: (phone: string) => void
  onCreateOrder: () => void
  onToggle: (group: PublicMenuV2ModifierGroup, optionId: string) => void
}) {
  const optionNameById = useMemo(
    () => buildOptionNameMap(product.modifierGroups),
    [product.modifierGroups],
  )

  return (
    <article className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="min-h-64 bg-slate-100">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full min-h-64 w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center bg-slate-100 px-6 text-center text-sm font-medium text-slate-500">
              Sem imagem cadastrada
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {product.type} | {product.pricingMode}
              </p>
              <h2 className="mt-1 text-3xl font-bold text-slate-950">
                {product.name}
              </h2>
            </div>
            <div className="rounded-md border border-slate-200 px-3 py-2 text-right">
              <p className="text-xs text-slate-500">Preco base</p>
              <p className="text-lg font-bold text-slate-950">
                {formatMoney(getProductBasePrice(product))}
              </p>
            </div>
          </div>

          {product.description && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {product.description}
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Grupos" value={product.modifierGroups.length} />
            <Metric
              label="Opcoes"
              value={product.modifierGroups.reduce(
                (sum, group) => sum + group.options.length,
                0,
              )}
            />
            <Metric
              label="Precos"
              value={product.modifierGroups.reduce(
                (sum, group) =>
                  sum +
                  group.options.reduce(
                    (inner, option) => inner + option.prices.length,
                    0,
                  ),
                0,
              )}
            />
            <Metric
              label="Selecionadas"
              value={Object.values(selections).reduce(
                (sum, selected) => sum + selected.length,
                0,
              )}
            />
          </div>

          <PriceEnginePanel
            priceResult={priceResult}
            priceLoading={priceLoading}
            priceError={priceError}
            quantity={quantity}
            customerName={customerName}
            customerPhone={customerPhone}
            orderLoading={orderLoading}
            orderError={orderError}
            createdOrder={createdOrder}
            onQuantityChange={onQuantityChange}
            onCustomerNameChange={onCustomerNameChange}
            onCustomerPhoneChange={onCustomerPhoneChange}
            onCreateOrder={onCreateOrder}
          />
        </div>
      </div>

      <div className="border-t border-slate-200 p-5">
        {product.modifierGroups.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            Produto simples sem grupos genericos. A renderizacao V2 preserva o
            produto sem inventar opcoes.
          </div>
        ) : (
          <div className="space-y-5">
            {product.modifierGroups.map((group) => (
              <ModifierGroupSection
                key={group.id}
                group={group}
                selections={selections}
                optionNameById={optionNameById}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function PriceEnginePanel({
  priceResult,
  priceLoading,
  priceError,
  quantity,
  customerName,
  customerPhone,
  orderLoading,
  orderError,
  createdOrder,
  onQuantityChange,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onCreateOrder,
}: {
  priceResult: PublicMenuV2PriceResult | null
  priceLoading: boolean
  priceError: string
  quantity: number
  customerName: string
  customerPhone: string
  orderLoading: boolean
  orderError: string
  createdOrder: PublicOrderV2Response | null
  onQuantityChange: (quantity: number) => void
  onCustomerNameChange: (name: string) => void
  onCustomerPhoneChange: (phone: string) => void
  onCreateOrder: () => void
}) {
  const validationErrors = priceResult?.validationErrors ?? []
  const canSubmit =
    !priceLoading &&
    !orderLoading &&
    customerName.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    validationErrors.length === 0

  return (
    <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            PriceEngine
          </p>
          <h3 className="text-lg font-bold text-slate-950">
            Calculo experimental
          </h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
          {priceLoading
            ? 'calculando'
            : priceResult
              ? 'calculado'
              : 'aguardando selecao'}
        </span>
      </div>

      {priceError && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {priceError}
        </p>
      )}

      {priceResult ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric
              label="Preco unitario"
              value={priceResult.unitPrice}
              money
            />
            <Metric label="Preco total" value={priceResult.totalPrice} money />
          </div>

          {priceResult.validationErrors.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">
                Erros de validacao
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-800">
                {priceResult.validationErrors.map((error, index) => (
                  <li key={`${error.code}-${index}`}>
                    {error.code}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-sm font-semibold text-slate-950">
              Modificadores aplicados
            </p>
            {priceResult.appliedModifiers.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Nenhum modificador aplicado ainda.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {priceResult.appliedModifiers.map((modifier, index) => (
                  <div
                    key={`${modifier.optionId}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">
                      {modifier.groupName}: {modifier.optionName}
                    </span>
                    <span className="text-slate-600">
                      {modifier.pricingMode} | delta{' '}
                      {formatMoney(modifier.totalDelta)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Selecione tamanho, sabores, bordas ou adicionais para validar o preco.
        </p>
      )}

      <div className="mt-5 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pedido V2 experimental
            </p>
            <h3 className="text-lg font-bold text-slate-950">
              Envio isolado de item unico
            </h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            nao substitui checkout
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_1fr]">
          <label className="text-sm font-medium text-slate-700">
            Quantidade
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) =>
                onQuantityChange(Number(event.target.value || 1))
              }
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-red-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Cliente
            <input
              type="text"
              value={customerName}
              onChange={(event) => onCustomerNameChange(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-red-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Telefone
            <input
              type="tel"
              value={customerPhone}
              onChange={(event) => onCustomerPhoneChange(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-red-500"
            />
          </label>
        </div>

        {orderError && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {orderError}
          </p>
        )}

        {createdOrder && (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="font-semibold">Pedido V2 criado com sucesso.</p>
            <p className="mt-1">
              Numero/id: {createdOrder.displayNumber ?? createdOrder.id}
            </p>
            <p className="mt-1">
              Total: {formatMoney(Number(createdOrder.total))}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onCreateOrder}
          disabled={!canSubmit}
          className={[
            'mt-4 h-11 rounded-md px-4 text-sm font-semibold transition',
            canSubmit
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'cursor-not-allowed bg-slate-200 text-slate-500',
          ].join(' ')}
        >
          {orderLoading
            ? 'Criando pedido V2...'
            : 'Criar pedido V2 experimental'}
        </button>
      </div>
    </div>
  )
}

function ModifierGroupSection({
  group,
  selections,
  optionNameById,
  onToggle,
}: {
  group: PublicMenuV2ModifierGroup
  selections: ExperimentalMenuV2Selections
  optionNameById: Map<string, string>
  onToggle: (group: PublicMenuV2ModifierGroup, optionId: string) => void
}) {
  const selectedIds = selections[group.id] ?? []

  return (
    <section className="rounded-md border border-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{group.name}</h3>
            {group.isRequired && (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                Obrigatorio
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {group.code} | {group.selectionType} | {group.pricingMode} | min{' '}
            {group.minSelections} max {group.maxSelections}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
          {getGroupStatus(group, selections)}
        </span>
      </header>

      <div className="grid gap-3 p-4 md:grid-cols-2">
        {group.options.map((option) => {
          const selected = selectedIds.includes(option.id)

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(group, option.id)}
              className={[
                'rounded-md border p-4 text-left transition',
                selected
                  ? 'border-red-500 bg-red-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{option.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {option.code ?? 'sem codigo'}
                  </p>
                </div>
                <span
                  className={[
                    'mt-1 h-4 w-4 shrink-0 rounded-full border',
                    selected
                      ? 'border-red-600 bg-red-600'
                      : 'border-slate-300 bg-white',
                  ].join(' ')}
                />
              </div>

              {option.description && (
                <p className="mt-2 text-sm text-slate-600">
                  {option.description}
                </p>
              )}

              <p className="mt-3 text-xs font-medium text-slate-700">
                {getContextualPriceSummary(option, optionNameById)}
              </p>
            </button>
          )
        })}

        {group.options.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            Nenhuma opcao permitida retornada para este grupo.
          </div>
        )}
      </div>
    </section>
  )
}

function getFriendlyApiError(err: unknown) {
  if (!(err instanceof Error)) {
    return 'Erro ao criar pedido V2 experimental.'
  }

  try {
    const parsed = JSON.parse(err.message)
    const validationErrors = parsed.validationErrors

    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      return validationErrors
        .map((error) => `${error.code}: ${error.message}`)
        .join(' | ')
    }

    if (typeof parsed.message === 'string') {
      return parsed.message
    }
  } catch {
    return err.message
  }

  return err.message
}

function Metric({
  label,
  value,
  money = false,
}: {
  label: string
  value: number
  money?: boolean
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-950">
        {money ? formatMoney(value) : value}
      </p>
    </div>
  )
}

function Shell({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
              Megas Food
            </p>
            <p className="text-xl font-bold">{title}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Menu V2 experimental
          </span>
        </div>
      </header>
      {children}
    </div>
  )
}
