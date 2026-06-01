import { useState } from 'react'

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

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(
    [],
  )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] = useState('')

  async function loadOrders() {
    try {
      setLoading(true)

      setError('')

      const data = await apiFetch<Order[]>(
        '/orders',
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
  }

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

    loadOrders,
    updateStatus,
  }
}
