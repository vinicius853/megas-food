export function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function onlyNumbers(value: string) {
  return value.replace(/\D/g, '')
}

export function parseMoneyInput(value: string) {
  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Erro ao finalizar pedido.'
  }

  try {
    const parsed = JSON.parse(error.message) as {
      message?: string | string[]
    }

    if (Array.isArray(parsed.message)) {
      return parsed.message.join('\n')
    }

    return parsed.message || error.message
  } catch {
    return error.message || 'Erro ao finalizar pedido.'
  }
}
