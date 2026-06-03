import { useCallback, useMemo, useState } from 'react'

import { apiFetch } from '@/lib/api'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

export type OrderType =
  | 'ONLINE'
  | 'TAKEAWAY'
  | 'DELIVERY'

export type OrderItemFlavor = {
  id: string
  flavorName: string
  fraction: string | number
}

export type OrderItem = {
  id: string
  name: string
  sizeName: string
  borderName?: string | null
  quantity: number
  unitPrice: string | number
  total: string | number
  notes?: string | null
  flavors: OrderItemFlavor[]
}

export type Order = {
  id: string
  displayNumber?: string | number | null
  customerName?: string | null
  customerPhone?: string | null
  type: OrderType
  status: OrderStatus
  subtotal: string | number
  deliveryFee: string | number
  total: string | number
  notes?: string | null
  createdAt: string
  items: OrderItem[]
}

export type OrdersPeriod = 'today' | 'yesterday' | 'last7' | 'last30'

const periodLabels: Record<OrdersPeriod, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  last7: 'Últimos 7 dias',
  last30: 'Últimos 30 dias',
}

function startOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getPeriodRange(period: OrdersPeriod) {
  const today = startOfDay(new Date())

  if (period === 'yesterday') {
    return {
      dateFrom: addDays(today, -1),
      dateTo: today,
    }
  }

  if (period === 'last7') {
    return {
      dateFrom: addDays(today, -6),
      dateTo: addDays(today, 1),
    }
  }

  if (period === 'last30') {
    return {
      dateFrom: addDays(today, -29),
      dateTo: addDays(today, 1),
    }
  }

  return {
    dateFrom: today,
    dateTo: addDays(today, 1),
  }
}

function buildOrdersUrl(period: OrdersPeriod) {
  const range = getPeriodRange(period)
  const params = new URLSearchParams({
    dateFrom: range.dateFrom.toISOString(),
    dateTo: range.dateTo.toISOString(),
  })

  return `/orders?${params.toString()}`
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(
    [],
  )
  const [period, setPeriod] = useState<OrdersPeriod>('today')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] = useState('')

  const periodLabel = useMemo(() => periodLabels[period], [period])

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)

      setError('')

      const data = await apiFetch<Order[]>(
        buildOrdersUrl(period),
      )

      setOrders(data)
    } catch (err: any) {
      setError(
        err.message ||
          'Erro ao carregar pedidos.',
      )
    } finally {
      setLoading(false)
    }
  }, [period])

  async function updateStatus(
    orderId: string,
    status: OrderStatus,
  ) {
    try {
      await apiFetch(`/orders/${orderId}`, {
        method: 'PATCH',

        body: JSON.stringify({
          status,
        }),
      })

      await loadOrders()

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status,
              }
            : order,
        ),
      )
    } catch (err: any) {
      alert(
        err.message ||
          'Erro ao atualizar pedido.',
      )
    }
  }

  return {
    orders,
    loading,
    error,
    period,
    periodLabel,

    loadOrders,
    setPeriod,
    updateStatus,
  }
}
