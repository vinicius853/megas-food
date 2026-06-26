import type { CartItem } from './cart-context'
import {
  cartItemDisplayName,
  formatModifierFraction,
} from './cart-item-display'
import { formatMoney } from './checkout-formatters'
import type { DeliveryType, PaymentMethod } from './checkout.types'
import { capitalizePublicDisplayName } from './public-menu-display-text'

type BuildCheckoutWhatsAppMessageInput = {
  orderNumber?: string | number
  tenantName: string
  customerName: string
  customerWhatsapp: string
  deliveryType: DeliveryType
  fullAddress: string
  items: CartItem[]
  notes: string
  paymentMethod: PaymentMethod
  cashAmount: number
  changeAmount: number
  subtotal: number
  couponCode?: string
  discountAmount: number
  deliveryFeeLabel: string
  total: number
}

const paymentLabels: Record<PaymentMethod, string> = {
  MONEY: 'Dinheiro',
  CARD: 'Cartão',
  PIX: 'Pix',
}

export function buildCheckoutWhatsAppMessage({
  orderNumber,
  tenantName,
  customerName,
  customerWhatsapp,
  deliveryType,
  fullAddress,
  items,
  notes,
  paymentMethod,
  cashAmount,
  changeAmount,
  subtotal,
  couponCode,
  discountAmount,
  deliveryFeeLabel,
  total,
}: BuildCheckoutWhatsAppMessageInput) {
  const publicStoreName = tenantName.trim() || 'Loja'
  const lines = [
    `🍕 *Pedido ${formatOrderNumber(orderNumber)} - ${publicStoreName}*`,
    '',
  ]

  items.forEach((item, index) => {
    lines.push(`*${index + 1}. ${cartItemDisplayName(item)}*`)

    item.displayGroups.forEach((group) => {
      if (group.options.length === 0) return

      const options = group.options
        .map((option) => {
          const fraction = formatModifierFraction(option.fraction)
          const price =
            option.price && option.price > 0
              ? ` (+${formatMoney(option.price)})`
              : ''

          return `${fraction}${capitalizePublicDisplayName(option.name)}${price}`
        })
        .join(', ')

      lines.push(`${capitalizePublicDisplayName(group.name)}: ${options}`)
    })

    if ((item.additionalItems?.length ?? 0) > 0) {
      lines.push(
        `Adicionais: ${item.additionalItems
          ?.map(
            (additional) =>
              `${capitalizePublicDisplayName(additional.name)} (+${formatMoney(additional.price)})`,
          )
          .join(', ')}`,
      )
    }

    if (item.notes) lines.push(`Observações do item: ${item.notes}`)

    lines.push(`Quantidade: ${item.quantity}`)
    lines.push(
      `Subtotal do item: ${formatMoney(item.totalPrice * item.quantity)}`,
    )
    lines.push('')
  })

  lines.push(`Subtotal: ${formatMoney(subtotal)}`)
  if (couponCode && discountAmount > 0) {
    lines.push(`Cupom: ${couponCode}`)
    lines.push(`Desconto: -${formatMoney(discountAmount)}`)
  }
  lines.push(`Taxa de entrega: ${deliveryFeeLabel}`)
  lines.push(`💰 *Total: ${formatMoney(total)}*`)
  lines.push(`Pagamento: ${paymentLabels[paymentMethod]}`)

  if (paymentMethod === 'MONEY') {
    lines.push(
      `Vai pagar com: ${cashAmount > 0 ? formatMoney(cashAmount) : 'Não informado'}`,
    )
    lines.push(`Troco: ${formatMoney(changeAmount)}`)
  }

  lines.push('')
  lines.push(`👤 Nome: ${customerName}`)
  lines.push(`📱 WhatsApp: ${customerWhatsapp}`)
  lines.push(`🚚 Tipo: ${deliveryType === 'DELIVERY' ? 'Entrega' : 'Retirada'}`)

  if (deliveryType === 'DELIVERY') {
    lines.push(`📍 Endereço: ${fullAddress || 'Não informado'}`)
  }

  if (notes) lines.push(`📝 Observações: ${notes}`)

  return lines.join('\n')
}

export function buildStoreWhatsAppUrl(
  storeWhatsappPhone: string,
  message: string,
) {
  const cleanPhone = storeWhatsappPhone.replace(/\D/g, '')
  if (!cleanPhone) return undefined

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

function formatOrderNumber(value?: string | number) {
  if (!value) return '#registrado'

  const text = String(value).trim()
  return text.startsWith('#') ? text : `#${text}`
}
