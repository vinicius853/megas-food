import {
  Check,
  Truck,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

import { openWhatsApp } from './whatsapp-order'

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
  id: string
  customerName?: string | null
  customerPhone?: string | null
  type: OrderType
  status: OrderStatus
}

type RenderOrderActionsProps = {
  order: Order

  updateStatus: (
    orderId: string,
    status: OrderStatus,
  ) => Promise<void>
}

export function renderOrderActions({
  order,
  updateStatus,
}: RenderOrderActionsProps) {
  switch (order.status) {
    case 'PENDING':
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={async () => {
              await updateStatus(
                order.id,
                'CONFIRMED',
              )

              openWhatsApp({
                ...order,
                status: 'CONFIRMED',
              })
            }}
          >
            <Check className="h-4 w-4" />
            Aceitar
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              await updateStatus(
                order.id,
                'CANCELLED',
              )

              openWhatsApp({
                ...order,
                status: 'CANCELLED',
              })
            }}
          >
            <X className="h-4 w-4" />
            Recusar
          </Button>
        </div>
      )

    case 'CONFIRMED':
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await updateStatus(order.id, 'READY')

            if (order.type !== 'DELIVERY') {
              openWhatsApp({
                ...order,
                status: 'READY',
              })
            }
          }}
        >
          <Check className="h-4 w-4" />
          Pronto
        </Button>
      )

    case 'READY':
      return order.type === 'DELIVERY' ? (
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await updateStatus(
              order.id,
              'OUT_FOR_DELIVERY',
            )

            openWhatsApp({
              ...order,
              status: 'OUT_FOR_DELIVERY',
            })
          }}
        >
          <Truck className="h-4 w-4" />
          Saiu entrega
        </Button>
      ) : (
        <Button
          size="sm"
          variant="primary"
          onClick={() =>
            updateStatus(
              order.id,
              'DELIVERED',
            )
          }
        >
          <Check className="h-4 w-4" />
          Finalizar
        </Button>
      )

    case 'OUT_FOR_DELIVERY':
      return (
        <Button
          size="sm"
          variant="primary"
          onClick={() =>
            updateStatus(
              order.id,
              'DELIVERED',
            )
          }
        >
          <Check className="h-4 w-4" />
          Entregue
        </Button>
      )

    default:
      return (
        <span className="text-xs text-slate-400">
          Sem ações
        </span>
      )
  }
}
