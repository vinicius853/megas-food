type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

type OrderType =
  | 'ONLINE'
  | 'TAKEAWAY'
  | 'DELIVERY'

type Order = {
  customerName?: string | null
  customerPhone?: string | null
  type: OrderType
  status: OrderStatus
}

export function openWhatsApp(order: Order) {
  if (!order.customerPhone) {
    alert('Cliente sem telefone.')
    return
  }

  const phone = order.customerPhone.replace(/\D/g, '')

  let message = ''

  switch (order.status) {
    case 'CONFIRMED':
      message =
        `Olá ${order.customerName || ''}! 🍕\n\n` +
        `Seu pedido foi aceito e já entrou em preparação.`
      break

    case 'READY':
      message =
        `Olá ${order.customerName || ''}! 🍕\n\n` +
        `Seu pedido já está pronto para retirada.`
      break

    case 'OUT_FOR_DELIVERY':
      message =
        `Olá ${order.customerName || ''}! 🛵\n\n` +
        `Seu pedido saiu para entrega.`
      break

    case 'CANCELLED':
      message =
        `Olá ${order.customerName || ''}.\n\n` +
        `Seu pedido foi recusado.`
      break

    default:
      return
  }

  const url =
    `https://wa.me/55${phone}?text=` +
    encodeURIComponent(message)

  window.open(url, '_blank')
}
