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
