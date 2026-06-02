import { History, RefreshCw, RotateCcw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { BillingEvent } from './cobrancas.types'

type CobrancasEventsPanelProps = {
  filteredEvents: BillingEvent[]
  eventSourceFilter: string
  isLoading: boolean
  isSaving: boolean
  onEventSourceFilterChange: (value: string) => void
  onRefresh: () => void
  onReprocessWebhook: (event: BillingEvent) => void | Promise<void>
  formatDateTime: (value?: string | null) => string
}

export function CobrancasEventsPanel({
  filteredEvents,
  eventSourceFilter,
  isLoading,
  isSaving,
  onEventSourceFilterChange,
  onRefresh,
  onReprocessWebhook,
  formatDateTime,
}: CobrancasEventsPanelProps) {
  return (
    <Card className="mt-5">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-orange-600" />
            Historico de cobrancas
          </CardTitle>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Eventos recentes de assinaturas, pagamentos e webhooks do Mercado Pago.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={eventSourceFilter}
            onChange={(event) => onEventSourceFilterChange(event.target.value)}
            className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-orange-500"
          >
            <option value="ALL">Todos os eventos</option>
            <option value="AUDIT">Auditoria</option>
            <option value="WEBHOOK">Webhook</option>
          </select>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            Atualizar eventos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Carregando eventos de cobranca...
          </div>
        ) : filteredEvents.length ? (
          filteredEvents.map((event) => (
            <div
              key={`${event.source}-${event.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      event.level === 'CRITICAL'
                        ? 'danger'
                        : event.level === 'WARNING'
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {event.source === 'WEBHOOK' ? 'Webhook' : 'Auditoria'}
                  </Badge>
                  {!event.processed ? (
                    <Badge variant="warning">Pendente</Badge>
                  ) : null}
                </div>
                <p className="mt-2 font-black text-slate-900">{event.title}</p>
                <p className="text-sm text-slate-500">{event.target}</p>
                {event.error ? (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {event.error}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <p className="text-sm font-semibold text-slate-500">
                  {formatDateTime(event.createdAt)}
                </p>
                {event.source === 'WEBHOOK' && (!event.processed || event.error) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReprocessWebhook(event)}
                    disabled={isSaving}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reprocessar
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Nenhum evento de cobranca registrado ainda.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
