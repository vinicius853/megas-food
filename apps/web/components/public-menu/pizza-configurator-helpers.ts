export function toNumber(value: unknown) {
  const normalized =
    typeof value === 'string'
      ? value.replace(/\./g, '').replace(',', '.')
      : value

  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

export function getFlavorLimitLabel(maxFlavors: number) {
  if (maxFlavors <= 1) return 'Inteira'
  if (maxFlavors === 2) return 'Meio a meio'

  return `Ate ${maxFlavors} sabores`
}

export function getSizeFlavorDescription(maxFlavors: number) {
  if (maxFlavors <= 1) return '1 sabor'

  return `Ate ${maxFlavors} sabores`
}

export function normalizeMaxFlavors(value: number) {
  return Math.min(Math.max(Number(value) || 1, 1), 4)
}

export function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
