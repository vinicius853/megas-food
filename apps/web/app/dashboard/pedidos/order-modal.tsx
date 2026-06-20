'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { renderOrderActions } from './order-actions'
import {
  getDashboardOrderItemName,
  normalizeOrderItemForDisplay,
} from './order-item-display'
import { getOrderDisplayNumber } from './order-display-number'
import { formatDateTime, formatMoney, printOrder } from './print-order'
import type { Order, OrderItem, OrderStatus, OrderType } from './types'

type OrderModalProps = {
  order: Order
  onClose: () => void
  updateStatus: (orderId: string, status: OrderStatus) => Promise<boolean>
  openManualWhatsApp: (orderId: string, status: OrderStatus) => Promise<void>
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
  openManualWhatsApp,
  statusLabels,
  statusVariants,
  typeLabels,
}: OrderModalProps) {
  const hasDoubleStatusActions = order.status === 'PENDING'
  const [printPaperSize, setPrintPaperSize] = useState<'80mm' | '58mm'>('80mm')

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
              <h3 className="font-semibold text-slate-900">Cliente</h3>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>
                  <strong>Nome:</strong> {order.customerName || 'Nao informado'}
                </p>

                <p>
                  <strong>WhatsApp:</strong>{' '}
                  {order.customerPhone || 'Nao informado'}
                </p>

                <p>
                  <strong>Canal:</strong> {typeLabels[order.type]}
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-slate-900">Valores</h3>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>
                  <strong>Subtotal:</strong> {formatMoney(order.subtotal)}
                </p>

                <p>
                  <strong>Entrega:</strong> {formatMoney(order.deliveryFee)}
                </p>

                <p className="text-base text-slate-900">
                  <strong>Total:</strong> {formatMoney(order.total)}
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
            <h3 className="font-semibold text-slate-900">Itens do pedido</h3>

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
              <p className="text-sm text-slate-500">Total do pedido</p>

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
                  openManualWhatsApp,
                })}
              </div>

              <div className="grid grid-cols-[auto_1fr] items-center gap-2 sm:flex">
                <label
                  htmlFor="print-paper-size"
                  className="text-xs font-semibold text-slate-600"
                >
                  Papel
                </label>
                <select
                  id="print-paper-size"
                  value={printPaperSize}
                  onChange={(event) =>
                    setPrintPaperSize(event.target.value as '80mm' | '58mm')
                  }
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500"
                  aria-label="Tamanho do papel da impressora"
                >
                  <option value="80mm">80 mm</option>
                  <option value="58mm">58 mm</option>
                </select>

                <Button
                  variant="outline"
                  onClick={() =>
                    printOrder(order, { paperSize: printPaperSize })
                  }
                  className="col-span-2 w-full sm:w-auto"
                >
                  Imprimir
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderItemDetails({ item }: { item: OrderItem }) {
  const normalized = normalizeOrderItemForDisplay(item)
  const displayName = getDashboardOrderItemName(normalized)
  const parsedNotes = splitItemNotes(item.notes)

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-900">
            {normalized.quantity}x {displayName}
          </h4>

          <div className="mt-2 space-y-2">
            {normalized.groups.map((group) => (
              <div
                key={`${group.groupCode ?? group.groupName}-${group.groupName}`}
              >
                <p className="text-sm font-semibold text-slate-700">
                  {group.groupName}:
                </p>
                <div className="mt-1 space-y-1">
                  {group.options.map((option) => (
                    <p
                      key={`${option.id}-${option.optionName}`}
                      className="text-sm text-slate-500"
                    >
                      * {formatFraction(option.fraction)}
                      {option.optionName}
                      {formatModifierDelta(option.totalDelta)}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {parsedNotes.additions.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              Adicionais: {parsedNotes.additions.join(', ')}
            </p>
          )}

          {parsedNotes.observations && (
            <p className="mt-2 text-sm text-slate-500">
              Obs: {parsedNotes.observations}
            </p>
          )}
        </div>

        <strong className="shrink-0 text-right text-slate-900 sm:text-left">
          {formatMoney(normalized.total)}
        </strong>
      </div>
    </div>
  )
}

function formatFraction(value?: number | null) {
  if (!value || value === 1) return ''

  if (value === 0.5) return '1/2 '
  if (value === 0.33 || value === 0.333) return '1/3 '
  if (value === 0.25) return '1/4 '

  return `${value} `
}

function formatModifierDelta(value: number) {
  if (value <= 0) return ''

  return ` (+ ${formatMoney(value)})`
}
