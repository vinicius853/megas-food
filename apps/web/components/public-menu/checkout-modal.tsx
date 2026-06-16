'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Banknote, CreditCard, MapPin, QrCode, Search, X } from 'lucide-react'

import { apiFetch } from '@/lib/api'
import {
  formatMoney,
  getErrorMessage,
  normalizeText,
  onlyNumbers,
  parseMoneyInput,
} from './checkout-formatters'
import type {
  CepResponse,
  CheckoutSuccessState,
  CheckoutModalProps,
  CreatedPublicOrder,
  DeliveryType,
  PaymentMethod,
} from './checkout.types'
import { buildPublicOrderV2Payload } from './public-order-v2-payload'
import { CheckoutPrivacyConsent } from './checkout-privacy-consent'
import {
  buildCheckoutWhatsAppMessage,
  buildStoreWhatsAppUrl,
} from './checkout-whatsapp-message'
import { CheckoutWhatsAppSuccess } from './checkout-whatsapp-success'
import { PublicMenuFloatingPanel } from './public-menu-floating-panel'
import { PRIVACY_POLICY_VERSION } from '@/lib/legal'

export function CheckoutModal({
  open,
  onClose,
  onOrderFinished,
  items,
  totalPrice,
  couponCode,
  discountAmount = 0,
  storeWhatsappPhone,
  tenantName,
  tenantSlug,
  palette,
  delivery,
  ordersEnabled = true,
  closedMessage,
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerWhatsapp, setCustomerWhatsapp] = useState('')
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('DELIVERY')

  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [stateUf, setStateUf] = useState('')
  const [complement, setComplement] = useState('')

  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [cashPaidAmount, setCashPaidAmount] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)
  const [cepError, setCepError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(true)
  const [privacyError, setPrivacyError] = useState('')
  const [success, setSuccess] = useState<CheckoutSuccessState | null>(null)
  const customerSectionRef = useRef<HTMLDivElement | null>(null)
  const addressSectionRef = useRef<HTMLDivElement | null>(null)
  const paymentSectionRef = useRef<HTMLDivElement | null>(null)
  const submitSectionRef = useRef<HTMLDivElement | null>(null)
  const autoScrollRef = useRef({
    hasScrolledToAddress: false,
    hasScrolledToPayment: false,
    hasScrolledToSubmit: false,
  })
  const theme = palette ?? {
    primary: '#C40012',
    secondary: '#FF4A00',
    accent: '#FFD166',
    soft: '#FFF1F2',
    textOnPrimary: '#FFFFFF',
  }

  useEffect(() => {
    if (!open) return

    const timer = window.setTimeout(() => {
      setPrivacyAccepted(true)
      setPrivacyError('')
    }, 0)

    autoScrollRef.current = {
      hasScrolledToAddress: false,
      hasScrolledToPayment: false,
      hasScrolledToSubmit: false,
    }

    return () => window.clearTimeout(timer)
  }, [open])

  async function handleSearchCep() {
    const cleanCep = onlyNumbers(cep)

    if (cleanCep.length !== 8) {
      setCepError('Digite um CEP válido com 8 números.')
      return
    }

    try {
      setLoadingCep(true)
      setCepError('')

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)

      const data = (await response.json()) as CepResponse

      if (data.erro) {
        setCepError('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }

      setStreet(data.logradouro || '')
      setNeighborhood(data.bairro || '')
      setCity(data.localidade || '')
      setStateUf(data.uf || '')
    } catch {
      setCepError('Não foi possível buscar o CEP.')
    } finally {
      setLoadingCep(false)
    }
  }

  const fullAddress = useMemo(() => {
    const parts = [
      street,
      number ? `nº ${number}` : '',
      complement,
      neighborhood,
      city && stateUf ? `${city}/${stateUf}` : city || stateUf,
      cep ? `CEP: ${cep}` : '',
    ].filter(Boolean)

    return parts.join(', ')
  }, [street, number, complement, neighborhood, city, stateUf, cep])

  const activeDeliveryZones = useMemo(
    () => (delivery?.zones ?? []).filter((zone) => zone.isActive),
    [delivery?.zones],
  )

  const selectedDeliveryZone = useMemo(() => {
    if (deliveryType !== 'DELIVERY' || !neighborhood.trim()) return null

    const normalizedNeighborhood = normalizeText(neighborhood)

    return (
      activeDeliveryZones.find(
        (zone) => normalizeText(zone.name) === normalizedNeighborhood,
      ) ?? null
    )
  }, [activeDeliveryZones, deliveryType, neighborhood])

  const hasDeliveryZones = activeDeliveryZones.length > 0
  const deliveryFee =
    deliveryType === 'DELIVERY' && selectedDeliveryZone
      ? Number(selectedDeliveryZone.fee)
      : 0
  const discountedSubtotal = Math.max(totalPrice - discountAmount, 0)
  const orderTotal = discountedSubtotal + deliveryFee
  const deliveryFeeLabel =
    deliveryType !== 'DELIVERY'
      ? 'Retirada'
      : selectedDeliveryZone
        ? formatMoney(deliveryFee)
        : hasDeliveryZones
          ? neighborhood.trim()
            ? 'Bairro nao atendido'
            : 'Informe o bairro'
          : 'A confirmar'

  const cashAmountNumber = useMemo(
    () => parseMoneyInput(cashPaidAmount),
    [cashPaidAmount],
  )

  const changeAmount =
    paymentMethod === 'MONEY' && cashAmountNumber > orderTotal
      ? cashAmountNumber - orderTotal
      : 0

  const customerSectionValid =
    customerName.trim().length > 0 && onlyNumbers(customerWhatsapp).length >= 10
  const addressSectionValid =
    deliveryType === 'PICKUP' ||
    (street.trim().length > 0 &&
      number.trim().length > 0 &&
      neighborhood.trim().length > 0 &&
      (!hasDeliveryZones || Boolean(selectedDeliveryZone)))
  const paymentSectionValid =
    paymentMethod !== 'MONEY' ||
    cashAmountNumber === 0 ||
    cashAmountNumber >= orderTotal

  const paymentLabel = {
    MONEY: 'Dinheiro',
    CARD: 'Cartão',
    PIX: 'Pix',
  }[paymentMethod]

  const paymentNotes = [
    `Pagamento: ${paymentLabel}`,
    paymentMethod === 'MONEY' && cashAmountNumber > 0
      ? `Cliente vai pagar com: ${formatMoney(cashAmountNumber)}`
      : '',
    paymentMethod === 'MONEY' ? `Troco: ${formatMoney(changeAmount)}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const pickupAddress = [
    delivery?.storeAddress,
    delivery?.city && delivery?.state
      ? `${delivery.city} - ${delivery.state}`
      : delivery?.city || delivery?.state,
    delivery?.storeCep ? `CEP: ${delivery.storeCep}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  useEffect(() => {
    autoScrollRef.current = {
      hasScrolledToAddress: false,
      hasScrolledToPayment: false,
      hasScrolledToSubmit: false,
    }
  }, [deliveryType])

  useEffect(() => {
    if (!customerSectionValid) {
      autoScrollRef.current = {
        hasScrolledToAddress: false,
        hasScrolledToPayment: false,
        hasScrolledToSubmit: false,
      }
      return
    }

    if (!addressSectionValid) {
      autoScrollRef.current.hasScrolledToPayment = false
      autoScrollRef.current.hasScrolledToSubmit = false
      return
    }

    if (!paymentSectionValid) {
      autoScrollRef.current.hasScrolledToSubmit = false
    }
  }, [addressSectionValid, customerSectionValid, paymentSectionValid])

  useEffect(() => {
    if (!open || success || submitting || !customerSectionValid) return

    const timer = window.setTimeout(() => {
      const isMobile = window.matchMedia('(max-width: 767px)').matches
      if (!isMobile) return

      if (
        deliveryType === 'DELIVERY' &&
        !autoScrollRef.current.hasScrolledToAddress
      ) {
        addressSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
        autoScrollRef.current.hasScrolledToAddress = true
        return
      }

      if (
        addressSectionValid &&
        !autoScrollRef.current.hasScrolledToPayment
      ) {
        paymentSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
        autoScrollRef.current.hasScrolledToPayment = true
        return
      }

      if (
        addressSectionValid &&
        paymentSectionValid &&
        !autoScrollRef.current.hasScrolledToSubmit
      ) {
        submitSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        })
        autoScrollRef.current.hasScrolledToSubmit = true
      }
    }, 450)

    return () => window.clearTimeout(timer)
  }, [
    addressSectionValid,
    customerSectionValid,
    deliveryType,
    open,
    paymentSectionValid,
    submitting,
    success,
  ])

  function choiceStyle(isSelected: boolean) {
    return isSelected
      ? {
          borderColor: theme.primary,
          backgroundColor: theme.soft,
          color: theme.primary,
        }
      : undefined
  }

  async function handleFinishOrder() {
    try {
      if (!privacyAccepted) {
        setPrivacyError(
          'Aceite a Política de Privacidade para finalizar o pedido.',
        )
        return
      }

      setPrivacyError('')

      if (!customerName.trim() || !customerWhatsapp.trim()) {
        alert('Informe seu nome e WhatsApp.')
        return
      }

      if (!ordersEnabled) {
        alert(
          closedMessage ??
            'O estabelecimento esta fora do horario de atendimento.',
        )
        return
      }

      if (deliveryType === 'DELIVERY') {
        if (!street.trim() || !number.trim() || !neighborhood.trim()) {
          alert('Informe rua, número e bairro.')
          return
        }
      }

      if (deliveryType === 'DELIVERY' && delivery?.isDeliveryOpen === false) {
        alert('As entregas estão fechadas no momento.')
        return
      }

      if (
        deliveryType === 'DELIVERY' &&
        hasDeliveryZones &&
        !selectedDeliveryZone
      ) {
        alert(
          'Esse bairro não está ativo para entrega. Confira o bairro ou escolha retirada.',
        )
        return
      }

      if (
        paymentMethod === 'MONEY' &&
        cashAmountNumber > 0 &&
        cashAmountNumber < orderTotal
      ) {
        alert(
          'O valor em dinheiro precisa ser maior ou igual ao total do pedido.',
        )
        return
      }

      setSubmitting(true)

      const paymentType =
        paymentMethod === 'MONEY'
          ? 'CASH'
          : paymentMethod === 'CARD'
            ? 'CREDIT_CARD'
            : 'PIX'

      const order = await apiFetch<CreatedPublicOrder>(
        `/public-orders-v2/${tenantSlug}`,
        {
          method: 'POST',
          body: JSON.stringify(
            buildPublicOrderV2Payload({
              customerName: customerName.trim(),
              customerPhone: customerWhatsapp.trim(),
              type: deliveryType === 'DELIVERY' ? 'DELIVERY' : 'TAKEAWAY',
              paymentType,
              deliveryFee,
              couponCode,
              notes: [
                notes.trim(),
                paymentNotes,
                couponCode && discountAmount > 0
                  ? `Cupom: ${couponCode}\nDesconto: -${formatMoney(discountAmount)}`
                  : '',
                deliveryType === 'DELIVERY'
                  ? `Taxa de entrega: ${deliveryFeeLabel}`
                  : '',
                fullAddress ? `Endereco: ${fullAddress}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
              privacyAccepted,
              privacyPolicyVersion: PRIVACY_POLICY_VERSION,
              items,
            }),
          ),
        },
      )

      const message = buildCheckoutWhatsAppMessage({
        orderNumber: order.number,
        tenantName,
        customerName: customerName.trim(),
        customerWhatsapp: customerWhatsapp.trim(),
        deliveryType,
        fullAddress,
        items,
        notes: notes.trim(),
        paymentMethod,
        cashAmount: cashAmountNumber,
        changeAmount,
        subtotal: totalPrice,
        couponCode,
        discountAmount,
        deliveryFeeLabel,
        total: orderTotal,
      })
      const whatsappUrl = storeWhatsappPhone
        ? buildStoreWhatsAppUrl(storeWhatsappPhone, message)
        : undefined
      const openedWindow = whatsappUrl
        ? window.open(whatsappUrl, '_blank')
        : null

      if (openedWindow) openedWindow.opener = null

      setPrivacyAccepted(true)

      if (openedWindow) {
        onOrderFinished?.()
        return
      }

      setSuccess({
        orderNumber: order.number,
        whatsappUrl,
        popupBlocked: Boolean(whatsappUrl),
      })
    } catch (error: unknown) {
      alert(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <PublicMenuFloatingPanel
      contentClassName="relative"
      maxWidthClassName="max-w-2xl"
      onBack={() => {
        onClose()
        return false
      }}
      zIndexClassName="z-[80]"
    >
        {success && (
          <CheckoutWhatsAppSuccess
            orderNumber={success.orderNumber}
            whatsappUrl={success.whatsappUrl}
            popupBlocked={success.popupBlocked}
            primaryColor={theme.primary}
            textOnPrimary={theme.textOnPrimary}
            onConfirm={() => {
              if (!success.whatsappUrl) return

              const openedWindow = window.open(success.whatsappUrl, '_blank')
              if (openedWindow) {
                openedWindow.opener = null
                onOrderFinished?.()
                return
              }

              setSuccess((current) =>
                current ? { ...current, popupBlocked: true } : current,
              )
            }}
            onClose={() => {
              setSuccess(null)
              onOrderFinished?.()
              onClose()
            }}
          />
        )}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Finalizar pedido
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Informe seus dados para enviar o pedido.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5">
          <div className="space-y-4">
            <div
              ref={customerSectionRef}
              className="grid gap-3 md:grid-cols-2"
            >
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Seu nome"
                className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-red-600"
              />

              <input
                value={customerWhatsapp}
                onChange={(e) => setCustomerWhatsapp(e.target.value)}
                placeholder="Seu WhatsApp"
                className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-red-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('DELIVERY')}
                style={choiceStyle(deliveryType === 'DELIVERY')}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  deliveryType === 'DELIVERY'
                    ? 'border-red-700 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Entrega
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('PICKUP')}
                style={choiceStyle(deliveryType === 'PICKUP')}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  deliveryType === 'PICKUP'
                    ? 'border-red-700 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Retirada
              </button>
            </div>

            {deliveryType === 'PICKUP' && (
              <div
                ref={addressSectionRef}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: theme.soft,
                      color: theme.primary,
                    }}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-900">
                      Retirar no estabelecimento
                    </p>

                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {pickupAddress ||
                        'Endereço de retirada ainda não configurado pela pizzaria.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {deliveryType === 'DELIVERY' && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MapPin
                    className="h-4 w-4"
                    style={{ color: theme.primary }}
                  />
                  Endereço de entrega
                </div>

                <div className="mb-3 flex gap-2">
                  <input
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="CEP"
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-red-600"
                  />

                  <button
                    type="button"
                    onClick={handleSearchCep}
                    disabled={loadingCep}
                    className="flex h-12 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition disabled:opacity-60"
                    style={{
                      backgroundColor: theme.primary,
                      color: theme.textOnPrimary,
                    }}
                  >
                    <Search className="h-4 w-4" />
                    {loadingCep ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>

                {cepError && (
                  <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                    {cepError}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                  <input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Rua / Avenida"
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-red-600"
                  />

                  <input
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Número"
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-red-600"
                  />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-red-600"
                  />

                  <input
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Complemento"
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-red-600"
                  />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_100px]">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade"
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-red-600"
                  />

                  <input
                    value={stateUf}
                    onChange={(e) => setStateUf(e.target.value)}
                    placeholder="UF"
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 uppercase outline-none focus:border-red-600"
                  />
                </div>
              </div>
            )}

            <div
              ref={paymentSectionRef}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-3 text-sm font-semibold text-slate-700">
                Forma de pagamento
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PIX')}
                  style={choiceStyle(paymentMethod === 'PIX')}
                  className={`flex h-14 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition ${
                    paymentMethod === 'PIX'
                      ? 'border-red-700 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  Pix
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  style={choiceStyle(paymentMethod === 'CARD')}
                  className={`flex h-14 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition ${
                    paymentMethod === 'CARD'
                      ? 'border-red-700 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Cartão
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('MONEY')}
                  style={choiceStyle(paymentMethod === 'MONEY')}
                  className={`flex h-14 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition ${
                    paymentMethod === 'MONEY'
                      ? 'border-red-700 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  Dinheiro
                </button>
              </div>

              {paymentMethod === 'MONEY' && (
                <div
                  className="mt-3 rounded-2xl border bg-white p-3"
                  style={{ borderColor: theme.soft }}
                >
                  <label className="text-xs font-semibold text-slate-500">
                    Vai pagar com quanto?
                  </label>

                  <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto]">
                    <input
                      value={cashPaidAmount}
                      onChange={(e) => setCashPaidAmount(e.target.value)}
                      placeholder="Ex: 100,00"
                      inputMode="decimal"
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-red-600"
                    />

                    <div
                      className="flex min-h-12 min-w-36 flex-col justify-center rounded-2xl px-4 text-right"
                      style={{
                        backgroundColor: theme.soft,
                      }}
                    >
                      <span className="text-xs font-semibold text-slate-500">
                        Troco
                      </span>
                      <strong
                        className="text-base"
                        style={{ color: theme.primary }}
                      >
                        {formatMoney(changeAmount)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Observações do pedido (opcional)
                </label>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                  Informe remoções de ingredientes, preferências de preparo ou
                  instruções para entrega.
                </p>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: sem cebola, sem azeitona, pouco molho, entregar no portão azul."
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-600"
              />
            </div>

            <CheckoutPrivacyConsent
              accepted={privacyAccepted}
              error={privacyError}
              onChange={(accepted) => {
                setPrivacyAccepted(accepted)
                if (accepted) setPrivacyError('')
              }}
            />
          </div>
        </div>

        <div
          ref={submitSectionRef}
          className="border-t border-slate-200 bg-white p-5"
        >
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <strong className="text-slate-800">
                {formatMoney(totalPrice)}
              </strong>
            </div>

            {couponCode && discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Cupom {couponCode}</span>
                <strong style={{ color: theme.primary }}>
                  - {formatMoney(discountAmount)}
                </strong>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Taxa de entrega</span>
              <strong
                className="text-right"
                style={{
                  color:
                    deliveryType === 'DELIVERY' &&
                    hasDeliveryZones &&
                    !selectedDeliveryZone
                      ? theme.primary
                      : '#334155',
                }}
              >
                {deliveryFeeLabel}
              </strong>
            </div>

            <div className="flex items-end justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-bold text-slate-500">Total</span>
              <strong className="text-2xl" style={{ color: theme.primary }}>
                {formatMoney(orderTotal)}
              </strong>
            </div>

            {!ordersEnabled && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                {closedMessage ??
                  'O estabelecimento esta fora do horario de atendimento.'}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleFinishOrder}
            disabled={items.length === 0 || submitting || !ordersEnabled}
            className="w-full rounded-2xl px-5 py-4 text-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: theme.primary,
              color: theme.textOnPrimary,
            }}
          >
            {submitting ? 'Enviando pedido...' : 'Enviar pedido'}
          </button>
        </div>
    </PublicMenuFloatingPanel>
  )
}
