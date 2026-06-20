export function parseMoney(value: unknown) {
  if (typeof value === 'number') return value

  const parsed = Number(
    String(value ?? '0')
      .replace(/\./g, '')
      .replace(',', '.'),
  )

  return Number.isFinite(parsed) ? parsed : 0
}

export function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatShortMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function cleanCategoryLabel(value: string) {
  return value
    .trim()
    .replace(
      /^(?:\p{Extended_Pictographic}|\p{Symbol}|\uFE0F|\u200D|\s)+/gu,
      '',
    )
    .trim()
}

export function normalizeCategoryLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function getCategoryPriority(value: string) {
  const normalized = normalizeCategoryLabel(value)

  if (normalized === 'todos') return 0
  if (
    normalized.includes('salgad') ||
    normalized.includes('tradicion') ||
    (normalized.includes('pizza') && !normalized.includes('doce'))
  ) {
    return 10
  }
  if (normalized.includes('doce')) return 20
  if (
    normalized.includes('bebida') ||
    normalized.includes('refrigerante') ||
    normalized.includes('suco') ||
    normalized.includes('agua')
  ) {
    return 30
  }
  if (normalized.includes('esfi')) return 40
  if (normalized.includes('adicion')) return 50

  return 100
}

export function compareCategoryOrder(
  firstName: string,
  firstSortOrder: number,
  secondName: string,
  secondSortOrder: number,
) {
  const priorityDifference =
    getCategoryPriority(firstName) - getCategoryPriority(secondName)

  if (priorityDifference !== 0) return priorityDifference

  const sortDifference = firstSortOrder - secondSortOrder

  if (sortDifference !== 0) return sortDifference

  return firstName.localeCompare(secondName, 'pt-BR')
}

export function getSectionDomId(title: string) {
  return `menu-section-${title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`
}
