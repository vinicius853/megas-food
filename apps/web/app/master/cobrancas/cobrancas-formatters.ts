import type { BillingInvoice, SubscriptionAction, SubscriptionStatus } from './cobrancas.types'

export const monthlyFee = 150

export const statusLabels: Record<BillingInvoice['status'], string> = {
  OPEN: 'Em aberto',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
}

export const statusVariant: Record<BillingInvoice['status'], 'success' | 'warning' | 'danger' | 'default'> = {
  OPEN: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'default',
}

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Em atraso',
  CANCEL_SCHEDULED: 'Cancelamento agendado',
  CANCELED: 'Cancelada',
  BLOCKED: 'Bloqueada',
}

export const subscriptionStatusVariant: Record<SubscriptionStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCEL_SCHEDULED: 'warning',
  CANCELED: 'default',
  BLOCKED: 'danger',
}

export function parseMoney(value: unknown) {
  const parsed = Number(String(value ?? '0').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatDate(value?: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function getErrorMessage(error: unknown) {
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

export function getSubscriptionActionSuccess(action: SubscriptionAction) {
  if (action === 'cancel-scheduled') return 'Cancelamento da assinatura agendado.'
  if (action === 'block') return 'Assinatura bloqueada.'

  return 'Assinatura desbloqueada.'
}

export function getSubscriptionActionTitle(action: SubscriptionAction) {
  if (action === 'cancel-scheduled') return 'Agendar cancelamento'
  if (action === 'block') return 'Bloquear assinatura'

  return 'Desbloquear assinatura'
}
