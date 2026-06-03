type OrderWithDisplayNumber = {
  id?: string | null
  displayNumber?: string | number | null
  dailyOrderNumber?: string | number | null
  orderNumber?: string | number | null
  number?: string | number | null
  code?: string | number | null
  sequence?: string | number | null
}

type OrderNumberContext<TOrder> = {
  orders?: TOrder[]
  index?: number
}

function formatDisplayNumber(value: string | number) {
  const text = String(value).trim()

  return text.startsWith('#') ? text : `#${text}`
}

export function getOrderDisplayNumber<TOrder extends OrderWithDisplayNumber>(
  order: TOrder,
  context: OrderNumberContext<TOrder> = {},
) {
  const explicitNumber =
    order.displayNumber ??
    order.dailyOrderNumber ??
    order.orderNumber ??
    order.number ??
    order.code ??
    order.sequence

  if (explicitNumber) {
    return formatDisplayNumber(explicitNumber)
  }

  if (
    context.orders &&
    typeof context.index === 'number'
  ) {
    return formatDisplayNumber(context.orders.length - context.index)
  }

  const digits = String(order.id ?? '').replace(/\D/g, '')

  if (digits.length >= 3) {
    return formatDisplayNumber(digits.slice(-3))
  }

  const fallback = String(order.id ?? '').slice(0, 6).toUpperCase()

  return fallback ? formatDisplayNumber(fallback) : '#---'
}
