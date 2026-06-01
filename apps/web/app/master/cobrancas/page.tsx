'use client'

import * as React from 'react'
import {
  CalendarClock,
  Ban,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  ExternalLink,
  History,
  RadioTower,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldX,
} from 'lucide-react'

import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  RestrictedFinancialValue,
} from '../components/restricted-financial-value'

type TenantUser = {
  id: string
  name: string
  email: string
}

type Tenant = {
  id: string
  name: string
  slug: string
  isActive: boolean
  users?: TenantUser[]
}

type BillingInvoice = {
  id: string
  tenantId: string
  amount: string | number
  dueDate: string
  status: 'OPEN' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentMethod?: 'MERCADO_PAGO' | 'MANUAL' | null
  mercadoPagoPreferenceId?: string | null
  mercadoPagoPaymentId?: string | null
  paymentUrl?: string | null
  sandboxPaymentUrl?: string | null
  paidAt?: string | null
  notes?: string | null
  tenant: Tenant
}

type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCEL_SCHEDULED'
  | 'CANCELED'
  | 'BLOCKED'

type BillingSubscription = {
  id: string
  tenantId: string
  planId: string
  mercadoPagoSubscriptionId?: string | null
  mercadoPagoSubscriptionUrl?: string | null
  mercadoPagoSubscriptionStatus?: string | null
  status: SubscriptionStatus
  startedAt?: string | null
  nextBillingDate?: string | null
  canceledAt?: string | null
  accessUntil?: string | null
  gracePeriodDays: number
  blockedAt?: string | null
  plan: {
    id: string
    name: string
    monthlyPrice: string | number
  }
  tenant: Tenant
}

type BillingEvent = {
  id: string
  source: 'AUDIT' | 'WEBHOOK'
  title: string
  target: string
  level: 'INFO' | 'WARNING' | 'CRITICAL'
  processed: boolean
  error?: string | null
  createdAt: string
}

type BillingDiagnostics = {
  status: 'OK' | 'WARNING' | 'CRITICAL'
  checkedAt: string
  pendingWebhooks: number
  oldPendingWebhooks: number
  failedWebhooks24h: number
  latestWebhookError?: {
    eventType?: string | null
    resourceId?: string | null
    error?: string | null
    createdAt?: string | null
  } | null
  pastDueSubscriptions: number
  blockedSubscriptions: number
  upcomingRenewals: number
}

type CreateInvoiceForm = {
  tenantId: string
  dueDate: string
}

type ManualPaymentForm = {
  confirmationPassword: string
  notes: string
}

type SubscriptionAction =
  | 'cancel-scheduled'
  | 'block'
  | 'unblock'

type SubscriptionActionForm = {
  confirmationPassword: string
  reason: string
  accessUntil: string
}

const monthlyFee = 150

const statusLabels: Record<BillingInvoice['status'], string> = {
  OPEN: 'Em aberto',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
}

const statusVariant: Record<BillingInvoice['status'], 'success' | 'warning' | 'danger' | 'default'> = {
  OPEN: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'default',
}

const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Em atraso',
  CANCEL_SCHEDULED: 'Cancelamento agendado',
  CANCELED: 'Cancelada',
  BLOCKED: 'Bloqueada',
}

const subscriptionStatusVariant: Record<SubscriptionStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCEL_SCHEDULED: 'warning',
  CANCELED: 'default',
  BLOCKED: 'danger',
}

function parseMoney(value: unknown) {
  const parsed = Number(String(value ?? '0').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Nao foi possivel concluir a acao.'

  try {
    const parsed = JSON.parse(error.message)
    return Array.isArray(parsed.message)
      ? parsed.message.join(', ')
      : parsed.message || error.message
  } catch {
    return error.message
  }
}

function getSubscriptionActionSuccess(action: SubscriptionAction) {
  if (action === 'cancel-scheduled') return 'Cancelamento da assinatura agendado.'
  if (action === 'block') return 'Assinatura bloqueada.'

  return 'Assinatura desbloqueada.'
}

function getSubscriptionActionTitle(action: SubscriptionAction) {
  if (action === 'cancel-scheduled') return 'Agendar cancelamento'
  if (action === 'block') return 'Bloquear assinatura'

  return 'Desbloquear assinatura'
}

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

      {diagnostics ? (
        <Card className="mb-5">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RadioTower className="h-5 w-5 text-orange-600" />
                Saude do billing
              </CardTitle>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Monitoramento rapido de webhooks, assinaturas em risco e proximas renovacoes.
              </p>
            </div>
            <Badge
              variant={
                diagnostics.status === 'CRITICAL'
                  ? 'danger'
                  : diagnostics.status === 'WARNING'
                    ? 'warning'
                    : 'success'
              }
            >
              {diagnostics.status === 'CRITICAL'
                ? 'Atencao critica'
                : diagnostics.status === 'WARNING'
                  ? 'Requer atencao'
                  : 'Operacional'}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <DiagnosticBox
              label="Webhooks pendentes"
              value={`${diagnostics.pendingWebhooks}`}
              tone={diagnostics.oldPendingWebhooks > 0 ? 'danger' : diagnostics.pendingWebhooks > 0 ? 'warning' : 'success'}
              helper={
                diagnostics.oldPendingWebhooks > 0
                  ? `${diagnostics.oldPendingWebhooks} ha mais de 15 min`
                  : 'Fila dentro do esperado'
              }
            />
            <DiagnosticBox
              label="Falhas 24h"
              value={`${diagnostics.failedWebhooks24h}`}
              tone={diagnostics.failedWebhooks24h > 0 ? 'danger' : 'success'}
              helper={
                diagnostics.latestWebhookError?.error
                  ? diagnostics.latestWebhookError.error
                  : 'Sem erro recente'
              }
            />
            <DiagnosticBox
              label="Assinaturas em risco"
              value={`${diagnostics.pastDueSubscriptions + diagnostics.blockedSubscriptions}`}
              tone={diagnostics.blockedSubscriptions > 0 ? 'danger' : diagnostics.pastDueSubscriptions > 0 ? 'warning' : 'success'}
              helper={`${diagnostics.pastDueSubscriptions} em atraso | ${diagnostics.blockedSubscriptions} bloqueadas`}
            />
            <DiagnosticBox
              label="Vencem em 7 dias"
              value={`${diagnostics.upcomingRenewals}`}
              tone="default"
              helper={`Atualizado em ${formatDateTime(diagnostics.checkedAt)}`}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-5">
        <CardContent className="grid gap-3 p-5 lg:grid-cols-[1fr_220px_260px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cliente, slug ou email..."
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
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
            onChange={(event) => setSubscriptionStatusFilter(event.target.value)}
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

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Ultimo pagamento</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  Carregando cobrancas...
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length ? (
              filteredInvoices.map((invoice) => {
                const paymentLink = invoice.paymentUrl || invoice.sandboxPaymentUrl

                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <p className="font-black text-slate-900">{invoice.tenant.name}</p>
                      <p className="text-xs text-slate-500">{invoice.tenant.users?.[0]?.email || invoice.tenant.slug}</p>
                    </TableCell>
                    <TableCell>Unico Plano</TableCell>
                    <TableCell>
                      <RestrictedFinancialValue value={formatMoney(parseMoney(invoice.amount))} canView />
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[invoice.status]}>
                        {statusLabels[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{formatDate(invoice.paidAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {paymentLink ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => copyPaymentLink(invoice)}>
                              <Copy className="h-4 w-4" />
                              Copiar
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <a href={paymentLink} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                Mercado Pago
                              </a>
                            </Button>
                          </>
                        ) : invoice.status !== 'PAID' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => createMercadoPagoPreference(invoice)}
                            disabled={isSaving}
                          >
                            Gerar link
                          </Button>
                        ) : null}

                        {invoice.status !== 'PAID' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setManualPaymentInvoice(invoice)}
                          >
                            Pago manual
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  Nenhuma cobranca encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

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
                void activateSubscription(tenantId)
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
                        onClick={() => setSelectedSubscription(subscription)}
                      >
                        <Eye className="h-4 w-4" />
                        Detalhes
                      </Button>

                      {subscription.mercadoPagoSubscriptionUrl ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copySubscriptionLink(subscription)}
                          >
                            <Copy className="h-4 w-4" />
                            Copiar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendSubscriptionLink(subscription)}
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
                          onClick={() => createMercadoPagoSubscriptionLink(subscription)}
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
                          onClick={() => openSubscriptionAction('unblock', subscription)}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Desbloquear
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSubscriptionAction('block', subscription)}
                          disabled={subscription.status === 'CANCELED'}
                        >
                          <Ban className="h-4 w-4" />
                          Bloquear
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSubscriptionAction('cancel-scheduled', subscription)}
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
                          onClick={() => activateSubscription(subscription.tenantId)}
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
              onChange={(event) => setEventSourceFilter(event.target.value)}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-orange-500"
            >
              <option value="ALL">Todos os eventos</option>
              <option value="AUDIT">Auditoria</option>
              <option value="WEBHOOK">Webhook</option>
            </select>
            <Button variant="outline" size="sm" onClick={loadData}>
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
                      onClick={() => reprocessWebhook(event)}
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

      <Modal
        open={Boolean(selectedSubscription)}
        onOpenChange={(open) => {
          if (!open) setSelectedSubscription(null)
        }}
      >
        <ModalContent>
          {selectedSubscription ? (
            <>
              <ModalHeader>
                <ModalTitle>{selectedSubscription.tenant.name}</ModalTitle>
                <ModalDescription>
                  Detalhes financeiros e operacionais da assinatura do cliente.
                </ModalDescription>
              </ModalHeader>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailBox
                    label="Status"
                    value={subscriptionStatusLabels[selectedSubscription.status]}
                  />
                  <DetailBox
                    label="Proximo vencimento"
                    value={formatDate(selectedSubscription.nextBillingDate)}
                  />
                  <DetailBox
                    label="Acesso ate"
                    value={formatDate(selectedSubscription.accessUntil)}
                  />
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-slate-400">
                    Cliente
                  </p>
                  <p className="mt-1 font-black text-slate-900">
                    {selectedSubscription.tenant.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selectedSubscription.tenant.users?.[0]?.email ||
                      selectedSubscription.tenant.slug}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Plano: {selectedSubscription.plan.name} |{' '}
                    {formatMoney(parseMoney(selectedSubscription.plan.monthlyPrice))} / mes
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-black text-slate-900">
                    Cobrancas deste cliente
                  </p>
                  <div className="space-y-2">
                    {selectedClientInvoices.length ? (
                      selectedClientInvoices.slice(0, 5).map((invoice) => (
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
                    {selectedClientEvents.length ? (
                      selectedClientEvents.slice(0, 5).map((event) => (
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
                  onClick={() => setSelectedSubscription(null)}
                >
                  Fechar
                </Button>
              </ModalFooter>
            </>
          ) : null}
        </ModalContent>
      </Modal>

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

function BillingMetric({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 pb-3">
        <CardTitle className="text-sm text-slate-500">{title}</CardTitle>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-black text-slate-950">{value}</p>
      </CardContent>
    </Card>
  )
}

function DiagnosticBox({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string
  helper: string
  tone: 'success' | 'warning' | 'danger' | 'default'
}) {
  const toneClassName = {
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    warning: 'border-orange-100 bg-orange-50 text-orange-700',
    danger: 'border-red-100 bg-red-50 text-red-700',
    default: 'border-slate-100 bg-slate-50 text-slate-700',
  }[tone]

  return (
    <div className={`rounded-2xl border p-4 ${toneClassName}`}>
      <p className="text-xs font-black uppercase opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs font-semibold opacity-80">
        {helper}
      </p>
    </div>
  )
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-900">{value}</p>
    </div>
  )
}
