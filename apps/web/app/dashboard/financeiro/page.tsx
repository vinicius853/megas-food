'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  CreditCard,
  DollarSign,
  RefreshCw,
} from 'lucide-react'

import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/api'

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

type OrderType = 'ONLINE' | 'TAKEAWAY' | 'DELIVERY'

type PaymentType =
  | 'CASH'
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'

type Order = {
  id: string
  number?: number | null
  type: OrderType
  status: OrderStatus
  paymentType?: PaymentType | null
  total: string | number
  createdAt: string
}

const openStatuses: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'READY',
  'OUT_FOR_DELIVERY',
]

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Saiu entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

const typeLabels: Record<OrderType, string> = {
  ONLINE: 'Online',
  TAKEAWAY: 'Retirada',
  DELIVERY: 'Delivery',
}

const paymentLabels: Record<PaymentType, string> = {
  CASH: 'Dinheiro',
  PIX: 'Pix',
  CREDIT_CARD: 'Credito',
  DEBIT_CARD: 'Debito',
}

function toNumber(value: unknown) {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function isToday(value: string) {
  const date = new Date(value)
  const now = new Date()

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function getOrderLabel(order: Order) {
  const number = order.number
    ? `#${order.number}`
    : `#${order.id.slice(0, 6)}`

  return `Pedido ${number} · ${typeLabels[order.type]}`
}

export default function FinanceiroPizzariaPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadOrders() {
    try {
      setLoading(true)
      setError('')

      const data = await apiFetch<Order[]>('/orders')

      setOrders(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar financeiro.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const todayOrders = useMemo(
    () => orders.filter((order) => isToday(order.createdAt)),
    [orders],
  )

  const validTodayOrders = todayOrders.filter(
    (order) => order.status !== 'CANCELLED',
  )

  const revenueToday = validTodayOrders.reduce(
    (total, order) => total + toNumber(order.total),
    0,
  )

  const averageTicket =
    validTodayOrders.length > 0
      ? revenueToday / validTodayOrders.length
      : 0

  const receivable = todayOrders
    .filter((order) => openStatuses.includes(order.status))
    .reduce((total, order) => total + toNumber(order.total), 0)

  const stats = [
    {
      label: 'Faturamento hoje',
      value: formatMoney(revenueToday),
      delta: `${validTodayOrders.length} pedidos vendidos`,
      icon: DollarSign,
      accent: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Ticket medio',
      value: formatMoney(averageTicket),
      delta: 'Media dos pedidos de hoje',
      icon: CreditCard,
      accent: 'text-sky-600 bg-sky-50',
    },
    {
      label: 'A receber',
      value: formatMoney(receivable),
      delta: 'Pedidos em aberto',
      icon: Banknote,
      accent: 'text-amber-600 bg-amber-50',
    },
  ]

  const movements = todayOrders
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )

  return (
    <PageContainer>
      <PageHeader
        title="Financeiro"
        description="Movimentacoes reais dos pedidos."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {loading ? '...' : stat.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">{stat.delta}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimentacoes de hoje</CardTitle>
          <CardDescription>
            Pedidos reais criados hoje no sistema.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                    Carregando movimentacoes...
                  </TableCell>
                </TableRow>
              )}

              {!loading && movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                    Nenhuma venda registrada hoje.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                movements.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-slate-500">
                      {formatTime(order.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {getOrderLabel(order)}
                    </TableCell>
                    <TableCell>
                      {order.paymentType
                        ? paymentLabels[order.paymentType]
                        : 'Nao informado'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatMoney(toNumber(order.total))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'CANCELLED'
                            ? 'danger'
                            : openStatuses.includes(order.status)
                              ? 'warning'
                              : 'success'
                        }
                      >
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
