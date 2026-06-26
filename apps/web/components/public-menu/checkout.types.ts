import type { CartItem } from './cart-context'

export type CheckoutModalProps = {
  open: boolean
  onClose: () => void
  onOrderFinished?: () => void
  items: CartItem[]
  totalPrice: number
  couponCode?: string
  discountAmount?: number
  storeWhatsappPhone?: string | null
  tenantName: string
  tenantSlug: string
  palette?: MenuPalette
  delivery?: DeliverySettings
  ordersEnabled?: boolean
  closedMessage?: string
}

export type DeliveryType = 'DELIVERY' | 'PICKUP'

export type PaymentMethod = 'MONEY' | 'CARD' | 'PIX'

export type MenuPalette = {
  primary: string
  secondary: string
  accent: string
  soft: string
  textOnPrimary: string
}

export type DeliveryZone = {
  id: string
  name: string
  fee: number
  eta: string
  isActive: boolean
  streetRules?: DeliveryStreetRule[]
}

export type DeliveryStreetRule = {
  id: string
  streetName: string
  fee: number
  eta?: string
  isActive: boolean
}

export type DeliverySettings = {
  isDeliveryOpen?: boolean
  city?: string
  state?: string
  storeCep?: string
  storeAddress?: string
  whatsapp?: string
  zones?: DeliveryZone[]
}

export type CreatedPublicOrder = {
  id: string
  number?: number
  dailyNumber?: number
  dailyOrderNumber?: number
  displayNumber?: string | number
}

export type CheckoutSuccessState = {
  orderNumber?: string | number
  whatsappUrl?: string
  popupBlocked: boolean
  loadTest?: boolean
}
