'use client'

import { useEffect, useRef, useState } from 'react'

import { Bell, CheckCircle2, PauseCircle, Plus, RefreshCw } from 'lucide-react'

import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'

import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

import { useOrderSound } from './use-order-sound'
import { useOrdersSocket } from './use-orders-socket'

import { OrderModal } from './order-modal'
import { OrderModalLoading } from './order-modal-loading'
import { OrdersTable } from './orders-table'

import { useOrders } from './use-orders'

import type { Order, OrderStatus, OrderType } from './types'
import type { OrdersPeriod } from './use-orders'

type DeliverySettings = {
  isDeliveryOpen?: boolean
  city?: string
  state?: string
  storeCep?: string
  storeAddress?: string
  whatsapp?: string
  zones?: unknown[]
  openingHours?: Record<string, unknown>
  options?: Record<string, unknown>
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Saiu entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

const statusVariants: Record<
  OrderStatus,
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
> = {
  PENDING: 'warning',
  CONFIRMED: 'primary',
  READY: 'success',
  OUT_FOR_DELIVERY: 'info',
  DELIVERED: 'default',
  CANCELLED: 'danger',
}

const typeLabels: Record<OrderType, string> = {
  ONLINE: 'Online',
  TAKEAWAY: 'Retirada',
  DELIVERY: 'Delivery',
}

const periodOptions: Array<{
  value: OrdersPeriod
  label: string
}> = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last7', label: 'Últimos 7 dias' },
  { value: 'last30', label: 'Últimos 30 dias' },
]

export default function PedidosPage() {
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null)
  const [selectedOrderId, setSelectedOrderId] =
    useState<string | null>(null)
  const [deliverySettings, setDeliverySettings] =
    useState<DeliverySettings | null>(null)
  const [deliverySettingsLoading, setDeliverySettingsLoading] =
    useState(true)
  const [deliveryPauseSaving, setDeliveryPauseSaving] =
    useState(false)
  const [deliveryConfirmOpen, setDeliveryConfirmOpen] =
    useState(false)
  const [deliveryActionError, setDeliveryActionError] =
    useState('')
  const [orderDetailError, setOrderDetailError] = useState('')
  const detailRequestRef = useRef(0)
  const deliveryConfirmRef = useRef<HTMLDivElement | null>(null)

  const {
    orders,
    loading,
    error,
    period,
    periodLabel,

    loadOrders,
    setPeriod,
    updateStatus,
    openManualWhatsApp,
    loadOrderDetails,
  } = useOrders()

  const { soundEnabled, toggleSound, playNewOrderSound } =
    useOrderSound()

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    loadDeliverySettings()
  }, [])

  useEffect(() => {
    if (!deliveryConfirmOpen) return

    function handleOutsideClick(event: MouseEvent) {
      if (
        deliveryConfirmRef.current &&
        !deliveryConfirmRef.current.contains(event.target as Node)
      ) {
        setDeliveryConfirmOpen(false)
        setDeliveryActionError('')
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [deliveryConfirmOpen])

  useOrdersSocket({
    loadOrders,
    playNewOrderSound,
  })

  async function loadDeliverySettings() {
    try {
      setDeliverySettingsLoading(true)
      const delivery = await apiFetch<DeliverySettings>(
        '/dashboard-settings/delivery',
      )
      setDeliverySettings(delivery)
    } catch {
      setDeliverySettings(null)
    } finally {
      setDeliverySettingsLoading(false)
    }
  }

  function openDeliveryConfirmation() {
    setDeliveryActionError('')
    setDeliveryConfirmOpen((current) => !current)
  }

  async function confirmDeliveryPauseToggle() {
    if (!deliverySettings) {
      setDeliveryActionError(
        'Nao foi possivel carregar o status de recebimento de pedidos.',
      )
      return
    }

    const isAcceptingOrders = deliverySettings.isDeliveryOpen !== false
    const nextSettings = {
      ...deliverySettings,
      isDeliveryOpen: !isAcceptingOrders,
    }

    try {
      setDeliveryPauseSaving(true)
      const updated = await apiFetch<DeliverySettings>(
        '/dashboard-settings/delivery',
        {
          method: 'PUT',
          body: JSON.stringify(nextSettings),
        },
      )
      setDeliverySettings(updated)
      setDeliveryConfirmOpen(false)
      setDeliveryActionError('')
    } catch (err) {
      setDeliveryActionError(
        err instanceof Error
          ? err.message
          : 'Nao foi possivel atualizar o recebimento de pedidos.',
      )
    } finally {
      setDeliveryPauseSaving(false)
    }
  }

  async function openOrderDetails(orderId: string) {
    const requestId = ++detailRequestRef.current

    setSelectedOrderId(orderId)
    setSelectedOrder(null)
    setOrderDetailError('')

    try {
      const order = await loadOrderDetails(orderId)

      if (detailRequestRef.current === requestId) {
        setSelectedOrder(order)
      }
    } catch {
      if (detailRequestRef.current === requestId) {
        setSelectedOrderId(null)
        setOrderDetailError(
          'Nao foi possivel carregar os detalhes do pedido.',
        )
      }
    }
  }

  function closeOrderDetails() {
    detailRequestRef.current += 1
    setSelectedOrderId(null)
    setSelectedOrder(null)
    setOrderDetailError('')
  }

  async function updateStatusAndDetail(
    orderId: string,
    status: OrderStatus,
  ) {
    const automaticScheduled = await updateStatus(orderId, status)

    setSelectedOrder((current) =>
      current?.id === orderId
        ? {
            ...current,
            status,
          }
        : current,
    )

    return automaticScheduled
  }

  const isAcceptingOrders = deliverySettings?.isDeliveryOpen !== false

  return (
    <PageContainer>
      <PageHeader
        title="Pedidos de hoje"
        description={`Pedidos do período: ${periodLabel}. Atualização em tempo real.`}
        actions={
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-4">
            <Button
              variant={soundEnabled ? 'primary' : 'outline'}
              size="sm"
              onClick={toggleSound}
              className="w-full sm:w-auto"
            >
              <Bell className="h-4 w-4" />

              {soundEnabled ? 'Som ativo' : 'Som desligado'}
            </Button>

            <div
              ref={deliveryConfirmRef}
              className="relative w-full sm:w-auto"
            >
              <Button
                type="button"
                variant={isAcceptingOrders ? 'outline' : 'destructive'}
                size="sm"
                onClick={openDeliveryConfirmation}
                disabled={deliverySettingsLoading || deliveryPauseSaving}
                className={
                  isAcceptingOrders
                    ? 'w-full border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 sm:w-auto'
                    : 'w-full sm:w-auto'
                }
              >
                {isAcceptingOrders ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <PauseCircle className="h-4 w-4" />
                )}
                {isAcceptingOrders
                  ? 'Recebendo pedidos'
                  : 'Pedidos pausados'}
              </Button>

              {deliveryConfirmOpen && (
                <DeliveryPauseConfirmation
                  isAcceptingOrders={isAcceptingOrders}
                  saving={deliveryPauseSaving}
                  error={deliveryActionError}
                  onCancel={() => {
                    setDeliveryConfirmOpen(false)
                    setDeliveryActionError('')
                  }}
                  onConfirm={confirmDeliveryPauseToggle}
                />
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadOrders}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Novo pedido
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {orderDetailError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {orderDetailError}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {periodOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={
              period === option.value
                ? 'primary'
                : 'outline'
            }
            onClick={() => setPeriod(option.value)}
            disabled={loading && period === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <OrdersTable
        orders={orders}
        loading={loading}
        typeLabels={typeLabels}
        statusLabels={statusLabels}
        statusVariants={statusVariants}
        updateStatus={updateStatus}
        openManualWhatsApp={openManualWhatsApp}
        onOpenOrder={openOrderDetails}
      />

      {selectedOrderId && !selectedOrder && (
        <OrderModalLoading onClose={closeOrderDetails} />
      )}

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={closeOrderDetails}
          updateStatus={updateStatusAndDetail}
          openManualWhatsApp={openManualWhatsApp}
          statusLabels={statusLabels}
          statusVariants={statusVariants}
          typeLabels={typeLabels}
        />
      )}
    </PageContainer>
  )
}

function DeliveryPauseConfirmation({
  isAcceptingOrders,
  saving,
  error,
  onCancel,
  onConfirm,
}: {
  isAcceptingOrders: boolean
  saving: boolean
  error: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-72 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xl shadow-slate-900/10 sm:left-1/2 sm:w-80 sm:-translate-x-1/2">
      <h3 className="text-sm font-black text-slate-950">
        {isAcceptingOrders
          ? 'Pausar recebimento de pedidos?'
          : 'Retomar recebimento de pedidos?'}
      </h3>

      <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
        {isAcceptingOrders
          ? 'Novos pedidos serão bloqueados até você retomar.'
          : 'A loja voltará a receber pedidos se estiver dentro do horário de funcionamento.'}
      </p>

      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={saving}
          className="w-full"
        >
          Cancelar
        </Button>

        <Button
          type="button"
          variant={isAcceptingOrders ? 'destructive' : 'primary'}
          size="sm"
          onClick={onConfirm}
          disabled={saving}
          className="w-full"
        >
          {isAcceptingOrders ? 'Pausar pedidos' : 'Retomar pedidos'}
        </Button>
      </div>
    </div>
  )
}
