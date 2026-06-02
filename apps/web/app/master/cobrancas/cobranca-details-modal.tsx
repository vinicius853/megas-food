import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal'

import { DetailBox } from './cobrancas-detail-box'
import type {
  BillingEvent,
  BillingInvoice,
  BillingSubscription,
} from './cobrancas.types'

type CobrancaDetailsModalProps = {
  open: boolean
  subscription: BillingSubscription | null
  invoices: BillingInvoice[]
  events: BillingEvent[]
  onClose: () => void
  formatMoney: (value: number) => string
  formatDate: (value?: string | null) => string
  formatDateTime: (value?: string | null) => string
  parseMoney: (value: unknown) => number
  statusLabels: Record<BillingInvoice['status'], string>
  statusVariant: Record<BillingInvoice['status'], 'success' | 'warning' | 'danger' | 'default'>
  subscriptionStatusLabels: Record<BillingSubscription['status'], string>
}

export function CobrancaDetailsModal({
  open,
  subscription,
  invoices,
  events,
  onClose,
  formatMoney,
  formatDate,
  formatDateTime,
  parseMoney,
  statusLabels,
  statusVariant,
  subscriptionStatusLabels,
}: CobrancaDetailsModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <ModalContent>
        {subscription ? (
          <>
            <ModalHeader>
              <ModalTitle>{subscription.tenant.name}</ModalTitle>
              <ModalDescription>
                Detalhes financeiros e operacionais da assinatura do cliente.
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <DetailBox
                  label="Status"
                  value={subscriptionStatusLabels[subscription.status]}
                />
                <DetailBox
                  label="Proximo vencimento"
                  value={formatDate(subscription.nextBillingDate)}
                />
                <DetailBox
                  label="Acesso ate"
                  value={formatDate(subscription.accessUntil)}
                />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-400">
                  Cliente
                </p>
                <p className="mt-1 font-black text-slate-900">
                  {subscription.tenant.name}
                </p>
                <p className="text-sm text-slate-500">
                  {subscription.tenant.users?.[0]?.email ||
                    subscription.tenant.slug}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Plano: {subscription.plan.name} |{' '}
                  {formatMoney(parseMoney(subscription.plan.monthlyPrice))} / mes
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-black text-slate-900">
                  Cobrancas deste cliente
                </p>
                <div className="space-y-2">
                  {invoices.length ? (
                    invoices.slice(0, 5).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            {formatMoney(parseMoney(invoice.amount))}
                          </p>
                          <p className="text-xs text-slate-500">
                            Vence em {formatDate(invoice.dueDate)}
                          </p>
                        </div>
                        <Badge variant={statusVariant[invoice.status]}>
                          {statusLabels[invoice.status]}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                      Nenhuma cobranca encontrada para este cliente.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-black text-slate-900">
                  Eventos recentes
                </p>
                <div className="space-y-2">
                  {events.length ? (
                    events.slice(0, 5).map((event) => (
                      <div
                        key={`${event.source}-${event.id}`}
                        className="rounded-2xl border border-slate-100 px-3 py-2"
                      >
                        <p className="text-sm font-bold text-slate-800">
                          {event.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(event.createdAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                      Nenhum evento encontrado para este cliente.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Fechar
              </Button>
            </ModalFooter>
          </>
        ) : null}
      </ModalContent>
    </Modal>
  )
}
