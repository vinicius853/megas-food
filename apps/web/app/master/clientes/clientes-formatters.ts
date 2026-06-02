import type { Tenant } from './clientes.types'

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatFullDate(value?: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

export function formatMoney(value?: string | number | null) {
  const amount = Number(value || 0)

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function parseMoneyInput(value: string) {
  const normalized = value.replace(',', '.').trim()

  if (!normalized) return undefined

  const amount = Number(normalized)

  return Number.isFinite(amount) ? amount : undefined
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function formatCpfCnpj(value?: string | null) {
  const digits = onlyDigits(value || '')

  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  return value || '-'
}

export function formatPhone(value?: string | null) {
  const digits = onlyDigits(value || '')

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return value || '-'
}

export function formatCep(value?: string | null) {
  const digits = onlyDigits(value || '')

  if (digits.length === 8) {
    return digits.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  return value || '-'
}

export function formatDocumentInput(value: string) {
  const digits = onlyDigits(value).slice(0, 14)

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function formatZipInput(value: string) {
  return onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}

export function formatWhatsappInput(value: string) {
  const digits = onlyDigits(value).slice(0, 13)

  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, ddd, first, last) =>
      last ? `(${ddd}) ${first}-${last}` : `(${ddd}) ${first}`,
    )
  }

  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, ddd, first, last) =>
    last ? `(${ddd}) ${first}-${last}` : `(${ddd}) ${first}`,
  )
}

export function getPlanName(tenant: Tenant) {
  return tenant.subscriptions?.[0]?.plan?.name || 'Sem plano'
}

export function getCurrentSubscription(tenant: Tenant | null) {
  return tenant?.subscriptions?.[0] || null
}

export function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Nao foi possivel concluir a acao.'
  }

  try {
    const parsed = JSON.parse(error.message)
    return Array.isArray(parsed.message)
      ? parsed.message.join(', ')
      : parsed.message || error.message
  } catch {
    return error.message
  }
}
