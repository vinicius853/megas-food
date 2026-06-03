import { monthlyFee } from './billing.constants'

export function toMoneyNumber(value: unknown, fallback = monthlyFee) {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function emptyToNull(value?: string) {
  const trimmed = value?.trim()

  return trimmed ? trimmed : null
}

export function cleanStringList(value?: string[]) {
  return Array.from(
    new Set((value || []).map((item) => item.trim()).filter(Boolean)),
  )
}

export function defaultDueDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  date.setHours(23, 59, 59, 999)
  return date
}

export function defaultSubscriptionDueDate() {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  date.setHours(23, 59, 59, 999)
  return date
}
