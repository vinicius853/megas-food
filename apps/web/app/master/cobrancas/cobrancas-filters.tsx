import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type CobrancasFiltersProps = {
  search: string
  invoiceStatusFilter: string
  subscriptionStatusFilter: string
  onSearchChange: (value: string) => void
  onInvoiceStatusChange: (value: string) => void
  onSubscriptionStatusChange: (value: string) => void
}

export function CobrancasFilters({
  search,
  invoiceStatusFilter,
  subscriptionStatusFilter,
  onSearchChange,
  onInvoiceStatusChange,
  onSubscriptionStatusChange,
}: CobrancasFiltersProps) {
  return (
    <Card className="mb-5">
      <CardContent className="grid gap-3 p-5 lg:grid-cols-[1fr_220px_260px]">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar cliente, slug ou email..."
        />
        <select
          value={invoiceStatusFilter}
          onChange={(event) => onInvoiceStatusChange(event.target.value)}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-orange-500"
        >
          <option value="ALL">Todos os status</option>
          <option value="OPEN">Em aberto</option>
          <option value="PAID">Pago</option>
          <option value="OVERDUE">Vencido</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <select
          value={subscriptionStatusFilter}
          onChange={(event) => onSubscriptionStatusChange(event.target.value)}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-orange-500"
        >
          <option value="ALL">Todas as assinaturas</option>
          <option value="PENDING">Pendente</option>
          <option value="ACTIVE">Ativa</option>
          <option value="PAST_DUE">Em atraso</option>
          <option value="CANCEL_SCHEDULED">Cancelamento agendado</option>
          <option value="CANCELED">Cancelada</option>
          <option value="BLOCKED">Bloqueada</option>
        </select>
      </CardContent>
    </Card>
  )
}
