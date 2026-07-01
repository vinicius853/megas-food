export function parseCurrencyInput(value: unknown) {
  if (typeof value === 'number') {
    return normalizeCurrencyNumber(value)
  }

  if (value === null || value === undefined) {
    return 0
  }

  const normalized = normalizeCurrencyString(String(value))
  const parsed = Number(normalized)

  return normalizeCurrencyNumber(Number.isFinite(parsed) ? parsed : 0)
}

function normalizeCurrencyString(value: string) {
  const sanitized = value.trim().replace(/[^\d,.-]/g, '')

  if (!sanitized) return '0'

  const lastComma = sanitized.lastIndexOf(',')
  const lastDot = sanitized.lastIndexOf('.')

  if (lastComma !== -1 && lastDot !== -1) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.'
    const thousandSeparator = decimalSeparator === ',' ? '.' : ','

    return sanitized
      .replace(new RegExp(`\\${thousandSeparator}`, 'g'), '')
      .replace(decimalSeparator, '.')
  }

  if (lastComma !== -1) {
    return normalizeSingleSeparatorCurrencyString(sanitized, ',')
  }

  if (lastDot !== -1) {
    return normalizeSingleSeparatorCurrencyString(sanitized, '.')
  }

  return sanitized
}

function normalizeCurrencyNumber(value: number) {
  if (!Number.isFinite(value)) return 0

  return Math.round(value * 100) / 100
}

function normalizeSingleSeparatorCurrencyString(
  value: string,
  separator: ',' | '.',
) {
  const parts = value.split(separator)

  if (parts.length > 2) {
    return parts.join('')
  }

  const [integerPart, decimalPart = ''] = parts

  if (decimalPart.length === 3 && integerPart.length > 0) {
    return parts.join('')
  }

  return value.replace(separator, '.')
}
