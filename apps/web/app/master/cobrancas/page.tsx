'use client'

import * as React from 'react'
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Plus,
  RefreshCw,
} from 'lucide-react'

import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/api'
import { downloadCsv } from '@/lib/download-csv'

import {
  canViewFinancialData,
  getStoredPermissions,
} from '../components/master-permissions'
import {
  RestrictedFinancialPanel,
} from '../components/restricted-financial-value'
import { CobrancaDetailsModal } from './cobranca-details-modal'
import { CobrancasDiagnosticsPanel } from './cobrancas-diagnostics-panel'
import { CobrancasEventsPanel } from './cobrancas-events-panel'
import { CobrancasFilters } from './cobrancas-filters'
import { CobrancasInvoicesTable } from './cobrancas-invoices-table'
import { CobrancasSubscriptionsTable } from './cobrancas-subscriptions-table'
import {
  formatDate,
  formatDateTime,
  formatMoney,
  getErrorMessage,
  getSubscriptionActionSuccess,
  getSubscriptionActionTitle,
  monthlyFee,
  parseMoney,
  statusLabels,
  statusVariant,
  subscriptionStatusLabels,
  subscriptionStatusVariant,
  toDateInputValue,
} from './cobrancas-formatters'
import { BillingMetric } from './cobrancas-metric'
import type {
  BillingDiagnostics,
  BillingEvent,
  BillingInvoice,
  BillingSubscription,
  CreateInvoiceForm,
  ManualPaymentForm,
  SubscriptionAction,
  SubscriptionActionForm,
  Tenant,
} from './cobrancas.types'

export default function CobrancasPage() {
  const [role, setRole] = React.useState<string | null>(null)
  const [permissions, setPermissions] = React.useState<string[]>([])
  const [tenants, setTenants] = React.useState<Tenant[]>([])
  const [invoices, setInvoices] = React.useState<BillingInvoice[]>([])
  const [subscriptions, setSubscriptions] = React.useState<BillingSubscription[]>([])
  const [events, setEvents] = React.useState<BillingEvent[]>([])
  const [diagnostics, setDiagnostics] = React.useState<BillingDiagnostics | null>(null)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('ALL')
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = React.useState('ALL')
  const [eventSourceFilter, setEventSourceFilter] = React.useState('ALL')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [selectedSubscription, setSelectedSubscription] =
    React.useState<BillingSubscription | null>(null)
  const [manualPaymentInvoice, setManualPaymentInvoice] = React.useState<BillingInvoice | null>(null)
  const [subscriptionAction, setSubscriptionAction] = React.useState<{
    action: SubscriptionAction
    subscription: BillingSubscription
  } | null>(null)
  const [createForm, setCreateForm] = React.useState<CreateInvoiceForm>({
    tenantId: '',
    dueDate: toDateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  })
  const [manualPaymentForm, setManualPaymentForm] = React.useState<ManualPaymentForm>({
    confirmationPassword: '',
    notes: '',
  })
  const [subscriptionActionForm, setSubscriptionActionForm] =
    React.useState<SubscriptionActionForm>({
      confirmationPassword: '',
      reason: '',
      accessUntil: '',
    })

  const canViewFinance = canViewFinancialData({ role, permissions })

  const loadData = React.useCallback(async () => {
    if (!canViewFinance) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const [
        invoiceData,
        tenantData,
        subscriptionData,
        eventData,
        diagnosticsData,
      ] = await Promise.all([
        apiFetch<BillingInvoice[]>('/billing/invoices'),
        apiFetch<Tenant[]>('/tenants'),
        apiFetch<BillingSubscription[]>('/billing/subscriptions'),
        apiFetch<BillingEvent[]>('/billing/events'),
        apiFetch<BillingDiagnostics>('/billing/diagnostics'),
      ])

      setInvoices(invoiceData)
      setSubscriptions(subscriptionData)
      setEvents(eventData)
      setDiagnostics(diagnosticsData)
      setTenants(tenantData.filter((tenant) => tenant.slug !== 'megastech-master'))
      setCreateForm((current) => ({
        ...current,
        tenantId:
          current.tenantId ||
          tenantData.find((tenant) => tenant.slug !== 'megastech-master')?.id ||
          '',
      }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [canViewFinance])

  React.useEffect(() => {
    setRole(localStorage.getItem('userRole') || 'MASTER_ADMIN')
    setPermissions(getStoredPermissions())
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const filteredInvoices = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return invoices.filter((invoice) => {
      const owner = invoice.tenant.users?.[0]
      const matchesSearch =
        !normalizedSearch ||
        invoice.tenant.name.toLowerCase().includes(normalizedSearch) ||
        invoice.tenant.slug.toLowerCase().includes(normalizedSearch) ||
        owner?.email.toLowerCase().includes(normalizedSearch)

      const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [invoices, search, statusFilter])

  const filteredSubscriptions = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return subscriptions.filter((subscription) => {
      const owner = subscription.tenant.users?.[0]
      const matchesSearch =
        !normalizedSearch ||
        subscription.tenant.name.toLowerCase().includes(normalizedSearch) ||
        subscription.tenant.slug.toLowerCase().includes(normalizedSearch) ||
        owner?.email.toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        subscriptionStatusFilter === 'ALL' ||
        subscription.status === subscriptionStatusFilter

      return matchesSearch && matchesStatus
    })
  }, [search, subscriptionStatusFilter, subscriptions])

  const filteredEvents = React.useMemo(() => {
    return events.filter(
      (event) => eventSourceFilter === 'ALL' || event.source === eventSourceFilter,
    )
  }, [eventSourceFilter, events])

  const selectedClientInvoices = React.useMemo(() => {
    if (!selectedSubscription) return []

    return invoices.filter(
      (invoice) => invoice.tenantId === selectedSubscription.tenantId,
    )
  }, [invoices, selectedSubscription])

  const selectedClientEvents = React.useMemo(() => {
    if (!selectedSubscription) return []
    const tenantName = selectedSubscription.tenant.name.toLowerCase()

    return events.filter((event) => event.target.toLowerCase().includes(tenantName))
  }, [events, selectedSubscription])

  const stats = React.useMemo(() => {
    const activeClients = tenants.filter((tenant) => tenant.isActive).length
    const openInvoices = invoices.filter((invoice) => invoice.status === 'OPEN')
    const overdueInvoices = invoices.filter((invoice) => invoice.status === 'OVERDUE')
    const paidInvoices = invoices.filter((invoice) => invoice.status === 'PAID')
    const openAmount = [...openInvoices, ...overdueInvoices].reduce(
      (total, invoice) => total + parseMoney(invoice.amount),
      0,
    )

    return {
      expectedRevenue: activeClients * monthlyFee,
      openAmount,
      paidCount: paidInvoices.length,
      overdueCount: overdueInvoices.length,
    }
  }, [invoices, tenants])

  const tenantsWithoutSubscription = React.useMemo(() => {
    const subscribedTenantIds = new Set(
      subscriptions
        .filter((subscription) => subscription.status !== 'CANCELED')
        .map((subscription) => subscription.tenantId),
    )

    return tenants.filter((tenant) => !subscribedTenantIds.has(tenant.id))
  }, [subscriptions, tenants])

  async function createInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch('/billing/invoices', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: createForm.tenantId,
          dueDate: createForm.dueDate,
        }),
      })

      setSuccess('Cobranca criada.')
      setCreateModalOpen(false)
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function activateSubscription(tenantId: string) {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch('/billing/subscriptions/activate', {
        method: 'POST',
        body: JSON.stringify({ tenantId }),
      })

      setSuccess('Assinatura ativada.')
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function createMercadoPagoSubscriptionLink(subscription: BillingSubscription) {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const updated = await apiFetch<BillingSubscription>(
        `/billing/subscriptions/${subscription.id}/mercado-pago-preapproval`,
        {
          method: 'POST',
        },
      )

      setSubscriptions((current) =>
        current.map((item) =>
          item.id === updated.id ? { ...item, ...updated } : item,
        ),
      )
      setSuccess('Link recorrente do Mercado Pago gerado.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function copySubscriptionLink(subscription: BillingSubscription) {
    if (!subscription.mercadoPagoSubscriptionUrl) return

    await navigator.clipboard.writeText(subscription.mercadoPagoSubscriptionUrl)
    setSuccess('Link da assinatura copiado.')
  }

  async function resendSubscriptionLink(subscription: BillingSubscription) {
    if (subscription.mercadoPagoSubscriptionUrl) {
      await navigator.clipboard.writeText(subscription.mercadoPagoSubscriptionUrl)
      setSuccess('Link recorrente copiado para reenviar ao cliente.')
      return
    }

    await createMercadoPagoSubscriptionLink(subscription)
  }

  function openSubscriptionAction(
    action: SubscriptionAction,
    subscription: BillingSubscription,
  ) {
    const defaultAccessUntil =
      subscription.accessUntil ||
      subscription.nextBillingDate ||
      new Date().toISOString()

    setSubscriptionAction({ action, subscription })
    setSubscriptionActionForm({
      confirmationPassword: '',
      reason: '',
      accessUntil: toDateInputValue(new Date(defaultAccessUntil)),
    })
  }

  async function submitSubscriptionAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!subscriptionAction) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch(
        `/billing/subscriptions/${subscriptionAction.subscription.id}/${subscriptionAction.action}`,
        {
          method: 'POST',
          body: JSON.stringify({
            confirmationPassword: subscriptionActionForm.confirmationPassword,
            reason: subscriptionActionForm.reason || undefined,
            ...(subscriptionAction.action === 'cancel-scheduled' ||
            subscriptionAction.action === 'unblock'
              ? {
                  accessUntil: subscriptionActionForm.accessUntil || undefined,
                }
              : {}),
          }),
        },
      )

      setSuccess(getSubscriptionActionSuccess(subscriptionAction.action))
      setSubscriptionAction(null)
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function createMercadoPagoPreference(invoice: BillingInvoice) {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const updated = await apiFetch<BillingInvoice>(`/billing/invoices/${invoice.id}/mercado-pago-preference`, {
        method: 'POST',
      })

      setInvoices((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      )
      setSuccess('Link do Mercado Pago gerado.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function copyPaymentLink(invoice: BillingInvoice) {
    const url = invoice.paymentUrl || invoice.sandboxPaymentUrl

    if (!url) return

    await navigator.clipboard.writeText(url)
    setSuccess('Link de pagamento copiado.')
  }

  async function markManualPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!manualPaymentInvoice) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/billing/invoices/${manualPaymentInvoice.id}/manual-payment`, {
        method: 'POST',
        body: JSON.stringify(manualPaymentForm),
      })

      setSuccess('Pagamento manual registrado.')
      setManualPaymentInvoice(null)
      setManualPaymentForm({ confirmationPassword: '', notes: '' })
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function reprocessWebhook(event: BillingEvent) {
    if (event.source !== 'WEBHOOK') return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/billing/events/${event.id}/reprocess`, {
        method: 'POST',
      })

      setSuccess('Webhook reprocessado com sucesso.')
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
      await loadData()
    } finally {
      setIsSaving(false)
    }
  }

  function exportCsv() {
    downloadCsv(
      'cobrancas-megas-food.csv',
      filteredInvoices.map((invoice) => ({
        cliente: invoice.tenant.name,
        plano: 'Unico Plano',
        mensalidade: monthlyFee,
        status: statusLabels[invoice.status],
        vencimento: formatDate(invoice.dueDate),
        ultimo_pagamento: formatDate(invoice.paidAt),
      })),
    )
  }

  if (!canViewFinance) {
    return (
      <PageContainer>
        <PageHeader
          title="Cobrancas"
          description="Mensalidades, vencimentos e pagamentos dos clientes."
        />
        <RestrictedFinancialPanel canView={false}>
          <div />
        </RestrictedFinancialPanel>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Cobrancas"
        description="Acompanhe mensalidades, vencimentos e pagamentos dos clientes."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              Exportar
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova cobranca
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BillingMetric title="Receita prevista" value={formatMoney(stats.expectedRevenue)} icon={CreditCard} />
        <BillingMetric title="Receita em aberto" value={formatMoney(stats.openAmount)} icon={CalendarClock} />
        <BillingMetric title="Pagamentos confirmados" value={`${stats.paidCount}`} icon={CheckCircle2} />
        <BillingMetric title="Clientes em atraso" value={`${stats.overdueCount}`} icon={CalendarClock} />
      </div>

      {diagnostics ? <CobrancasDiagnosticsPanel diagnostics={diagnostics} /> : null}

      <CobrancasFilters
        search={search}
        invoiceStatusFilter={statusFilter}
        subscriptionStatusFilter={subscriptionStatusFilter}
        onSearchChange={setSearch}
        onInvoiceStatusChange={setStatusFilter}
        onSubscriptionStatusChange={setSubscriptionStatusFilter}
      />

      <CobrancasInvoicesTable
        filteredInvoices={filteredInvoices}
        isLoading={isLoading}
        isSaving={isSaving}
        onCopyPaymentLink={copyPaymentLink}
        onCreateMercadoPagoPreference={createMercadoPagoPreference}
        onOpenManualPayment={setManualPaymentInvoice}
        formatMoney={formatMoney}
        formatDate={formatDate}
        parseMoney={parseMoney}
        statusLabels={statusLabels}
        statusVariant={statusVariant}
      />

      <CobrancasSubscriptionsTable
        filteredSubscriptions={filteredSubscriptions}
        isLoading={isLoading}
        isSaving={isSaving}
        tenantsWithoutSubscription={tenantsWithoutSubscription}
        onActivateSubscription={activateSubscription}
        onOpenDetails={setSelectedSubscription}
        onCopySubscriptionLink={copySubscriptionLink}
        onResendSubscriptionLink={resendSubscriptionLink}
        onCreateMercadoPagoSubscriptionLink={createMercadoPagoSubscriptionLink}
        onOpenSubscriptionAction={openSubscriptionAction}
        formatMoney={formatMoney}
        formatDate={formatDate}
        parseMoney={parseMoney}
        subscriptionStatusLabels={subscriptionStatusLabels}
        subscriptionStatusVariant={subscriptionStatusVariant}
      />

      <CobrancasEventsPanel
        filteredEvents={filteredEvents}
        eventSourceFilter={eventSourceFilter}
        isLoading={isLoading}
        isSaving={isSaving}
        onEventSourceFilterChange={setEventSourceFilter}
        onRefresh={loadData}
        onReprocessWebhook={reprocessWebhook}
        formatDateTime={formatDateTime}
      />

      <CobrancaDetailsModal
        open={Boolean(selectedSubscription)}
        subscription={selectedSubscription}
        invoices={selectedClientInvoices}
        events={selectedClientEvents}
        onClose={() => setSelectedSubscription(null)}
        formatMoney={formatMoney}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        parseMoney={parseMoney}
        statusLabels={statusLabels}
        statusVariant={statusVariant}
        subscriptionStatusLabels={subscriptionStatusLabels}
      />

      <Modal open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <ModalContent>
          <form onSubmit={createInvoice}>
            <ModalHeader>
              <ModalTitle>Nova cobranca</ModalTitle>
              <ModalDescription>
                Crie uma mensalidade de R$ 150,00 para um cliente.
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Cliente</label>
                <select
                  value={createForm.tenantId}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      tenantId: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-orange-500"
                  required
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Vencimento</label>
                <Input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving || !createForm.tenantId}>
                {isSaving ? 'Criando...' : 'Criar cobranca'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal open={Boolean(manualPaymentInvoice)} onOpenChange={(open) => !open && setManualPaymentInvoice(null)}>
        <ModalContent>
          <form onSubmit={markManualPayment}>
            <ModalHeader>
              <ModalTitle>Registrar pagamento manual</ModalTitle>
              <ModalDescription>
                Use apenas quando o pagamento foi confirmado fora do Mercado Pago.
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-black text-slate-900">{manualPaymentInvoice?.tenant.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Valor: {formatMoney(parseMoney(manualPaymentInvoice?.amount))}
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Sua senha de operador</label>
                <Input
                  type="password"
                  value={manualPaymentForm.confirmationPassword}
                  onChange={(event) =>
                    setManualPaymentForm((current) => ({
                      ...current,
                      confirmationPassword: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Observacao</label>
                <Input
                  value={manualPaymentForm.notes}
                  onChange={(event) =>
                    setManualPaymentForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Ex: pagamento confirmado por transferencia"
                />
              </div>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setManualPaymentInvoice(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? 'Registrando...' : 'Confirmar pagamento'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal open={Boolean(subscriptionAction)} onOpenChange={(open) => !open && setSubscriptionAction(null)}>
        <ModalContent>
          <form onSubmit={submitSubscriptionAction}>
            <ModalHeader>
              <ModalTitle>
                {subscriptionAction
                  ? getSubscriptionActionTitle(subscriptionAction.action)
                  : 'Assinatura'}
              </ModalTitle>
              <ModalDescription>
                Esta acao afeta o acesso do cliente e fica registrada na auditoria.
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                <p className="text-sm font-black text-slate-900">
                  {subscriptionAction?.subscription.tenant.name}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Status atual:{' '}
                  {subscriptionAction
                    ? subscriptionStatusLabels[subscriptionAction.subscription.status]
                    : '-'}
                </p>
              </div>

              {subscriptionAction?.action === 'cancel-scheduled' ||
              subscriptionAction?.action === 'unblock' ? (
                <div className="grid gap-1.5">
                  <label className="text-sm font-bold text-slate-700">
                    Acesso liberado ate
                  </label>
                  <Input
                    type="date"
                    value={subscriptionActionForm.accessUntil}
                    onChange={(event) =>
                      setSubscriptionActionForm((current) => ({
                        ...current,
                        accessUntil: event.target.value,
                      }))
                    }
                    required={subscriptionAction?.action === 'cancel-scheduled'}
                  />
                  <p className="text-xs font-medium text-slate-500">
                    No cancelamento agendado, o cliente continua usando ate esta data.
                  </p>
                </div>
              ) : null}

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Motivo</label>
                <Input
                  value={subscriptionActionForm.reason}
                  onChange={(event) =>
                    setSubscriptionActionForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  placeholder="Ex: inadimplencia, solicitacao do cliente..."
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">
                  Sua senha de operador
                </label>
                <Input
                  type="password"
                  value={subscriptionActionForm.confirmationPassword}
                  onChange={(event) =>
                    setSubscriptionActionForm((current) => ({
                      ...current,
                      confirmationPassword: event.target.value,
                    }))
                  }
                  required
                />
                <p className="text-xs font-medium text-slate-500">
                  Exigimos sua senha para proteger operacoes criticas.
                </p>
              </div>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setSubscriptionAction(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Confirmar acao'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </PageContainer>
  )
}
