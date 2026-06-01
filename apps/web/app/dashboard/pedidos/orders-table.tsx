import { Eye } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { renderOrderActions } from './order-actions'
import { formatMoney } from './print-order'

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

type OrdersTableProps = {
  orders: Order[]
  loading: boolean
  typeLabels: Record<OrderType, string>
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
  updateStatus: (
    orderId: string,
    status: OrderStatus,
  ) => Promise<void>
  onOpenOrder: (order: Order) => void
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getOrderNumber(
  orders: Order[],
  index: number,
) {
  return `#${orders.length - index}`
}

function getItemsQuantity(order: Order) {
  return order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  )
}

export function OrdersTable({
  orders,
  loading,
  typeLabels,
  statusLabels,
  statusVariants,
  updateStatus,
  onOpenOrder,
}: OrdersTableProps) {
  return (
    <>
      <Card className="hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Aberto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acoes</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-8 text-center text-sm text-slate-500"
                >
                  Carregando pedidos...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-8 text-center text-sm text-slate-500"
                >
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, index) => (
                <TableRow key={order.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {getOrderNumber(orders, index)}
                  </TableCell>

                  <TableCell>
                    {typeLabels[order.type] ?? order.type}
                  </TableCell>

                  <TableCell>
                    {order.customerName ||
                      'Cliente nao informado'}
                  </TableCell>

                  <TableCell>
                    {getItemsQuantity(order)}
                  </TableCell>

                  <TableCell className="font-medium">
                    {formatMoney(order.total)}
                  </TableCell>

                  <TableCell className="text-slate-500">
                    {formatTime(order.createdAt)}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={statusVariants[order.status]}
                    >
                      {statusLabels[order.status]}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {renderOrderActions({
                      order,
                      updateStatus,
                    })}
                  </TableCell>

                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <Card className="p-5 text-center text-sm font-bold text-slate-500">
            Carregando pedidos...
          </Card>
        ) : orders.length === 0 ? (
          <Card className="p-5 text-center text-sm font-bold text-slate-500">
            Nenhum pedido encontrado.
          </Card>
        ) : (
          orders.map((order, index) => (
            <Card
              key={order.id}
              className="overflow-hidden p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-slate-950">
                      {getOrderNumber(orders, index)}
                    </span>

                    <Badge
                      variant={statusVariants[order.status]}
                    >
                      {statusLabels[order.status]}
                    </Badge>
                  </div>

                  <p className="mt-2 truncate text-base font-black text-slate-950">
                    {order.customerName ||
                      'Cliente nao informado'}
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {typeLabels[order.type] ?? order.type} -{' '}
                    {formatTime(order.createdAt)}
                  </p>
                </div>

                <strong className="shrink-0 text-lg font-black text-orange-600">
                  {formatMoney(order.total)}
                </strong>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-sm">
                <div>
                  <p className="text-xs font-bold text-slate-400">
                    Itens
                  </p>
                  <p className="mt-1 font-black text-slate-900">
                    {getItemsQuantity(order)}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400">
                    Telefone
                  </p>
                  <p className="mt-1 truncate font-black text-slate-900">
                    {order.customerPhone || 'Nao informado'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <div className="[&>button]:w-full [&>div]:w-full [&>div>button]:flex-1">
                  {renderOrderActions({
                    order,
                    updateStatus,
                  })}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenOrder(order)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4" />
                  Ver detalhes
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
