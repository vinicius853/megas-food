'use client'

import { useEffect, useState } from 'react'

import { Bell, Plus, RefreshCw } from 'lucide-react'

import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'

import { Button } from '@/components/ui/button'

import { useOrderSound } from './use-order-sound'
import { useOrdersSocket } from './use-orders-socket'

import { OrderModal } from './order-modal'
import { OrdersTable } from './orders-table'

import { useOrders } from './use-orders'

import type { Order, OrderStatus, OrderType } from './types'
import type { OrdersPeriod } from './use-orders'

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
  } = useOrders()

  const { soundEnabled, enableSound, playNewOrderSound } =
    useOrderSound()

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useOrdersSocket({
    loadOrders,
    playNewOrderSound,
  })

  return (
    <PageContainer>
      <PageHeader
        title="Pedidos de hoje"
        description={`Pedidos do período: ${periodLabel}. Atualização em tempo real.`}
        actions={
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
            <Button
              variant={soundEnabled ? 'primary' : 'outline'}
              size="sm"
              onClick={enableSound}
              className="w-full sm:w-auto"
            >
              <Bell className="h-4 w-4" />

              {soundEnabled ? 'Som ativo' : 'Ativar som'}
            </Button>

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
        onOpenOrder={setSelectedOrder}
      />

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          updateStatus={updateStatus}
          openManualWhatsApp={openManualWhatsApp}
          statusLabels={statusLabels}
          statusVariants={statusVariants}
          typeLabels={typeLabels}
        />
      )}
    </PageContainer>
  )
}
