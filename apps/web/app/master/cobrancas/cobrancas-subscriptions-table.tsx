import {
  Ban,
  Copy,
  CreditCard,
  Eye,
  ExternalLink,
  Power,
  RotateCcw,
  Send,
  ShieldX,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type {
  BillingSubscription,
  SubscriptionAction,
  Tenant,
} from './cobrancas.types'

type CobrancasSubscriptionsTableProps = {
  filteredSubscriptions: BillingSubscription[]
  isLoading: boolean
  isSaving: boolean
  tenantsWithoutSubscription: Tenant[]
  onActivateSubscription: (tenantId: string) => void | Promise<void>
  onOpenDetails: (subscription: BillingSubscription) => void
  onCopySubscriptionLink: (subscription: BillingSubscription) => void
  onResendSubscriptionLink: (subscription: BillingSubscription) => void | Promise<void>
  onCreateMercadoPagoSubscriptionLink: (subscription: BillingSubscription) => void | Promise<void>
  onOpenSubscriptionAction: (
    action: SubscriptionAction,
    subscription: BillingSubscription,
  ) => void
  formatMoney: (value: number) => string
  formatDate: (value?: string | null) => string
  parseMoney: (value: unknown) => number
  subscriptionStatusLabels: Record<BillingSubscription['status'], string>
  subscriptionStatusVariant: Record<BillingSubscription['status'], 'success' | 'warning' | 'danger' | 'default'>
}

export function CobrancasSubscriptionsTable({
  filteredSubscriptions,
  isLoading,
  isSaving,
  tenantsWithoutSubscription,
  onActivateSubscription,
  onOpenDetails,
  onCopySubscriptionLink,
  onResendSubscriptionLink,
  onCreateMercadoPagoSubscriptionLink,
  onOpenSubscriptionAction,
  formatMoney,
  formatDate,
  parseMoney,
  subscriptionStatusLabels,
  subscriptionStatusVariant,
}: CobrancasSubscriptionsTableProps) {
  return (
    <Card className="mt-5">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Assinaturas dos clientes</CardTitle>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Controle acesso, cancelamento agendado e bloqueio da mensalidade.
          </p>
        </div>

        {tenantsWithoutSubscription.length ? (
          <select
            className="h-11 min-w-56 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-orange-500"
            defaultValue=""
            disabled={isSaving}
            onChange={(event) => {
              const tenantId = event.target.value
              if (!tenantId) return
              void onActivateSubscription(tenantId)
              event.target.value = ''
            }}
          >
            <option value="">Ativar assinatura...</option>
            {tenantsWithoutSubscription.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        ) : null}
      </CardHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Proximo vencimento</TableHead>
            <TableHead>Acesso ate</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                Carregando assinaturas...
              </TableCell>
            </TableRow>
          ) : filteredSubscriptions.length ? (
            filteredSubscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>
                  <p className="font-black text-slate-900">
                    {subscription.tenant.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {subscription.tenant.users?.[0]?.email || subscription.tenant.slug}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant={subscriptionStatusVariant[subscription.status]}>
                    {subscriptionStatusLabels[subscription.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="font-semibold text-slate-700">
                    {subscription.plan.name}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {formatMoney(parseMoney(subscription.plan.monthlyPrice))} / mes
                  </p>
                </TableCell>
                <TableCell>{formatDate(subscription.nextBillingDate)}</TableCell>
                <TableCell>{formatDate(subscription.accessUntil)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenDetails(subscription)}
                    >
                      <Eye className="h-4 w-4" />
                      Detalhes
                    </Button>

                    {subscription.mercadoPagoSubscriptionUrl ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCopySubscriptionLink(subscription)}
                        >
                          <Copy className="h-4 w-4" />
                          Copiar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onResendSubscriptionLink(subscription)}
                        >
                          <Send className="h-4 w-4" />
                          Reenviar
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={subscription.mercadoPagoSubscriptionUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Assinar
                          </a>
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCreateMercadoPagoSubscriptionLink(subscription)}
                        disabled={isSaving || subscription.status === 'CANCELED'}
                      >
                        <CreditCard className="h-4 w-4" />
                        Link recorrente
                      </Button>
                    )}

                    {subscription.status === 'BLOCKED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenSubscriptionAction('unblock', subscription)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Desbloquear
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenSubscriptionAction('block', subscription)}
                        disabled={subscription.status === 'CANCELED'}
                      >
                        <Ban className="h-4 w-4" />
                        Bloquear
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenSubscriptionAction('cancel-scheduled', subscription)}
                      disabled={
                        subscription.status === 'CANCEL_SCHEDULED' ||
                        subscription.status === 'CANCELED'
                      }
                    >
                      <ShieldX className="h-4 w-4" />
                      Cancelar
                    </Button>

                    {subscription.status === 'CANCELED' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onActivateSubscription(subscription.tenantId)}
                      >
                        <Power className="h-4 w-4" />
                        Reativar
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                Nenhuma assinatura encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
