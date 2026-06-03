import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { renderOrderActions } from './order-actions'
import { getOrderDisplayNumber } from './order-display-number'
import {
  formatDateTime,
  formatMoney,
  printOrder,
} from './print-order'

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

type OrderType = 'ONLINE' | 'TAKEAWAY' | 'DELIVERY'

type OrderItemFlavor = {
  id: string
  flavorName: string
  fraction: string | number
}

type OrderItem = {
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

type Order = {
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

type OrderModalProps = {
  order: Order
  onClose: () => void
  updateStatus: (
    orderId: string,
    status: OrderStatus,
  ) => Promise<void>
  statusLabels: Record<OrderStatus, string>
  statusVariants: Record<
    OrderStatus,
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'outline'
  >
  typeLabels: Record<OrderType, string>
}

function splitItemNotes(notes?: string | null) {
  const lines = String(notes ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const additions: string[] = []
  const observations: string[] = []

  for (const line of lines) {
    if (/^adicionais:/i.test(line)) {
      additions.push(
        ...line
          .replace(/^adicionais:\s*/i, '')
          .split(',')
          .map((addition) => addition.trim())
          .filter(Boolean),
      )
      continue
    }

    observations.push(line)
  }

  return {
    additions,
    observations: observations.join('\n'),
  }
}

export function OrderModal({
  order,
  onClose,
  updateStatus,
  statusLabels,
  statusVariants,
  typeLabels,
}: OrderModalProps) {
  const hasDoubleStatusActions = order.status === 'PENDING'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-4 md:items-center">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[94vh] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                Detalhes do pedido
              </h2>

              <Badge variant={statusVariants[order.status]}>
                {statusLabels[order.status]}
              </Badge>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                {getOrderDisplayNumber(order)}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {typeLabels[order.type]} - {formatDateTime(order.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="font-semibold text-slate-900">
                Cliente
              </h3>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>
                  <strong>Nome:</strong>{' '}
                  {order.customerName || 'Nao informado'}
                </p>

                <p>
                  <strong>WhatsApp:</strong>{' '}
                  {order.customerPhone || 'Nao informado'}
                </p>

                <p>
                  <strong>Canal:</strong>{' '}
                  {typeLabels[order.type]}
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-slate-900">
                Valores
              </h3>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>
                  <strong>Subtotal:</strong>{' '}
                  {formatMoney(order.subtotal)}
                </p>

                <p>
                  <strong>Entrega:</strong>{' '}
                  {formatMoney(order.deliveryFee)}
                </p>

                <p className="text-base text-slate-900">
                  <strong>Total:</strong>{' '}
                  {formatMoney(order.total)}
                </p>
              </div>
            </Card>
          </div>

          {order.notes && (
            <Card className="mt-4 p-4">
              <h3 className="font-semibold text-slate-900">
                Observacoes / endereco
              </h3>

              <p className="mt-3 whitespace-pre-line break-words text-sm text-slate-600">
                {order.notes}
              </p>
            </Card>
          )}

          <Card className="mt-4 p-4">
            <h3 className="font-semibold text-slate-900">
              Itens do pedido
            </h3>

            <div className="mt-4 space-y-4">
              {order.items.map((item) => (
                <OrderItemDetails key={item.id} item={item} />
              ))}
            </div>
          </Card>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total do pedido
              </p>

              <strong className="text-xl text-slate-900 sm:text-2xl">
                {formatMoney(order.total)}
              </strong>
            </div>

            <div
              className={
                hasDoubleStatusActions
                  ? 'grid gap-2 sm:flex sm:flex-wrap sm:justify-end'
                  : 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end'
              }
            >
              <div
                className={
                  hasDoubleStatusActions
                    ? '[&>div]:grid [&>div]:grid-cols-2 [&>div]:gap-2 [&>div>button]:w-full'
                    : '[&>button]:w-full [&>div]:w-full [&>div>button]:w-full'
                }
              >
                {renderOrderActions({
                  order,
                  updateStatus,
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => printOrder(order)}
                className="w-full sm:w-auto"
              >
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderItemDetails({ item }: { item: OrderItem }) {
  const parsedNotes = splitItemNotes(item.notes)

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900">
                        {item.quantity}x {item.name}
                      </h4>

                      {item.sizeName && (
                        <p className="mt-1 text-sm text-slate-500">
                          Tamanho: {item.sizeName}
                        </p>
                      )}

                      {item.borderName && (
                        <p className="mt-1 text-sm text-slate-500">
                          Borda: {item.borderName}
                        </p>
                      )}

                      {parsedNotes.additions.length > 0 && (
                        <p className="mt-1 text-sm text-slate-500">
                          Adicionais: {parsedNotes.additions.join(', ')}
                        </p>
                      )}

                      {item.flavors.length > 0 && (
                        <p className="mt-1 text-sm text-slate-500">
                          Sabores:{' '}
                          {item.flavors
                            .map((flavor) => flavor.flavorName)
                            .join(', ')}
                        </p>
                      )}

                      {parsedNotes.observations && (
                        <p className="mt-1 text-sm text-slate-500">
                          Obs: {parsedNotes.observations}
                        </p>
                      )}
                    </div>

                    <strong className="shrink-0 text-right text-slate-900 sm:text-left">
                      {formatMoney(item.total)}
                    </strong>
                  </div>
                </div>
  )
}
