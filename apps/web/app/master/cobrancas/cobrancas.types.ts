export type TenantUser = {
  id: string
  name: string
  email: string
}

export type Tenant = {
  id: string
  name: string
  slug: string
  isActive: boolean
  users?: TenantUser[]
}

export type BillingInvoice = {
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

export type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCEL_SCHEDULED'
  | 'CANCELED'
  | 'BLOCKED'

export type BillingSubscription = {
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

export type BillingEvent = {
  id: string
  source: 'AUDIT' | 'WEBHOOK'
  title: string
  target: string
  level: 'INFO' | 'WARNING' | 'CRITICAL'
  processed: boolean
  error?: string | null
  createdAt: string
}

export type BillingDiagnostics = {
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

export type CreateInvoiceForm = {
  tenantId: string
  dueDate: string
}

export type ManualPaymentForm = {
  confirmationPassword: string
  notes: string
}

export type SubscriptionAction =
  | 'cancel-scheduled'
  | 'block'
  | 'unblock'

export type SubscriptionActionForm = {
  confirmationPassword: string
  reason: string
  accessUntil: string
}
