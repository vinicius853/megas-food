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
  ) => Promise<void>
  openManualWhatsApp: (
    orderId: string,
    status: OrderStatus,
  ) => Promise<void>
  whatsappAutomationEnabled: boolean
}

export function renderOrderActions({
  order,
  updateStatus,
  openManualWhatsApp,
  whatsappAutomationEnabled,
}: RenderOrderActionsProps) {
  async function notifyManually(status: OrderStatus) {
    if (!whatsappAutomationEnabled) {
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
            await updateStatus(order.id, 'CONFIRMED')
            await notifyManually('CONFIRMED')
          }}
        >
          <Check className="h-4 w-4" />
          Aceitar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={async () => {
            await updateStatus(order.id, 'CANCELLED')
            await notifyManually('CANCELLED')
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
            await updateStatus(order.id, 'READY')
            if (order.type !== 'DELIVERY')
              await notifyManually('READY')
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
              await updateStatus(
                order.id,
                'OUT_FOR_DELIVERY',
              )
              await notifyManually('OUT_FOR_DELIVERY')
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
              updateStatus(order.id, 'DELIVERED')
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
            updateStatus(order.id, 'DELIVERED')
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
