import { SubscriptionStatus } from '@prisma/client'

export function extractDataId(body: any, query: Record<string, unknown>) {
  return String(
    body?.data?.id ||
      query['data.id'] ||
      query.id ||
      body?.id ||
      '',
  )
}

export function headerToString(value: unknown) {
  return Array.isArray(value)
    ? String(value[0] || '')
    : String(value || '')
}

export function getHeader(headers: Record<string, unknown>, name: string) {
  const normalizedName = name.toLowerCase()
  const key = Object.keys(headers).find(
    (currentKey) => currentKey.toLowerCase() === normalizedName,
  )

  return headerToString(key ? headers[key] : '')
}

export function isPreapprovalEvent(eventType: string) {
  return ['preapproval', 'subscription_preapproval'].includes(eventType)
}

export function mapMercadoPagoSubscriptionStatus(
  status: string | undefined,
  currentStatus: SubscriptionStatus,
) {
  if (status === 'authorized') return SubscriptionStatus.ACTIVE
  if (status === 'paused') return SubscriptionStatus.PAST_DUE
  if (status === 'cancelled') return SubscriptionStatus.CANCEL_SCHEDULED
  if (status === 'pending') return SubscriptionStatus.PENDING

  return currentStatus
}
