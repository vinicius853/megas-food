import { normalizeOrderItemForDisplay } from './order-item-display'
import type { OrderItem } from './types'

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

type OrderType = 'ONLINE' | 'TAKEAWAY' | 'DELIVERY'

type Order = {
  customerName?: string | null
  customerPhone?: string | null
  type: OrderType
  status: OrderStatus
  total?: string | number
  items?: OrderItem[]
}

export function buildWhatsAppMessage(order: Order) {
  switch (order.status) {
    case 'CONFIRMED':
      return withItems(
        order,
        `Ola ${order.customerName || ''}!\n\n` +
          'Seu pedido foi aceito e ja entrou em preparacao.',
      )

    case 'READY':
      return withItems(
        order,
        `Ola ${order.customerName || ''}!\n\n` +
          'Seu pedido ja esta pronto para retirada.',
      )

    case 'OUT_FOR_DELIVERY':
      return withItems(
        order,
        `Ola ${order.customerName || ''}!\n\n` +
          'Seu pedido saiu para entrega.',
      )

    case 'CANCELLED':
      return `Ola ${order.customerName || ''}.\n\n` + 'Seu pedido foi recusado.'

    default:
      return ''
  }
}

export function openWhatsApp(order: Order) {
  if (!order.customerPhone) {
    alert('Cliente sem telefone.')
    return
  }

  const phone = order.customerPhone.replace(/\D/g, '')
  const message = buildWhatsAppMessage(order)

  if (!message) {
    return
  }

  const url = `https://wa.me/55${phone}?text=` + encodeURIComponent(message)

  window.open(url, '_blank')
}

function withItems(order: Order, message: string) {
  const itemsText = buildItemsText(order)

  if (!itemsText) {
    return message
  }

  return `${message}\n\nResumo do pedido:\n${itemsText}${buildTotalText(order)}`
}

function buildItemsText(order: Order) {
  if (!order.items?.length) {
    return ''
  }

  return order.items
    .map((item) => {
      const normalized = normalizeOrderItemForDisplay(item)
      const lines = [`${normalized.quantity}x ${normalized.name}`]

      for (const group of normalized.groups) {
        lines.push(`${group.groupName}:`)

        for (const option of group.options) {
          lines.push(
            `* ${formatFraction(option.fraction)}${option.optionName}${formatDelta(option.totalDelta)}`,
          )
        }
      }

      if (normalized.notes) {
        lines.push(`Obs: ${normalized.notes}`)
      }

      lines.push(`Item: ${formatMoney(normalized.total)}`)

      return lines.join('\n')
    })
    .join('\n\n')
}

function buildTotalText(order: Order) {
  if (order.total === null || order.total === undefined) {
    return ''
  }

  return `\n\nTotal: ${formatMoney(order.total)}`
}

function formatFraction(value?: number | null) {
  if (!value || value === 1) return ''

  if (value === 0.5) return '1/2 '
  if (value === 0.33 || value === 0.333) return '1/3 '
  if (value === 0.25) return '1/4 '

  return `${value} `
}

function formatDelta(value: number) {
  if (value <= 0) {
    return ''
  }

  return ` (+ ${formatMoney(value)})`
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
