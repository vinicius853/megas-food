import {
  Check,
  MessageCircle,
  Truck,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

type Order = {
  id: string
  type: 'ONLINE' | 'TAKEAWAY' | 'DELIVERY'
  status: OrderStatus
}

type RenderOrderActionsProps = {
  order: Order
  updateStatus: (
    orderId: string,
    status: OrderStatus,
  ) => Promise<boolean>
  openManualWhatsApp: (
    orderId: string,
    status: OrderStatus,
  ) => Promise<void>
}

export function renderOrderActions({
  order,
  updateStatus,
  openManualWhatsApp,
}: RenderOrderActionsProps) {
  async function updateStatusWithFallback(status: OrderStatus) {
    const automaticScheduled = await updateStatus(order.id, status)
    if (!automaticScheduled) {
      await openManualWhatsApp(order.id, status)
    }
  }

  const manualButton = (status: OrderStatus) => (
    <ManualButton
      onClick={() => openManualWhatsApp(order.id, status)}
    />
  )

  if (order.status === 'PENDING') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={async () => {
            await updateStatusWithFallback('CONFIRMED')
          }}
        >
          <Check className="h-4 w-4" />
          Aceitar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={async () => {
            await updateStatusWithFallback('CANCELLED')
          }}
        >
          <X className="h-4 w-4" />
          Recusar
        </Button>
      </div>
    )
  }

  if (order.status === 'CONFIRMED') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await updateStatusWithFallback('READY')
          }}
        >
          <Check className="h-4 w-4" />
          Pronto
        </Button>
        {manualButton('CONFIRMED')}
      </div>
    )
  }

  if (order.status === 'READY') {
    return (
      <div className="flex flex-wrap gap-2">
        {order.type === 'DELIVERY' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await updateStatusWithFallback(
                'OUT_FOR_DELIVERY',
              )
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
              updateStatusWithFallback('DELIVERED')
            }
          >
            <Check className="h-4 w-4" />
            Finalizar
          </Button>
        )}
        {manualButton('READY')}
      </div>
    )
  }

  if (order.status === 'OUT_FOR_DELIVERY') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() =>
            updateStatusWithFallback('DELIVERED')
          }
        >
          <Check className="h-4 w-4" />
          Entregue
        </Button>
        {manualButton('OUT_FOR_DELIVERY')}
      </div>
    )
  }

  if (
    order.status === 'CANCELLED' ||
    order.status === 'DELIVERED'
  ) {
    return manualButton(order.status)
  }

  return (
    <span className="text-xs text-slate-400">
      Sem acoes
    </span>
  )
}

function ManualButton({
  onClick,
}: {
  onClick: () => Promise<void>
}) {
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      <MessageCircle className="h-4 w-4" />
      Enviar manualmente
    </Button>
  )
}
