export type ConfiguredItemNameOption = {
  name: string
  fraction?: number | null
}

export type ConfiguredItemNameGroup = {
  code?: string | null
  name?: string | null
  options: ConfiguredItemNameOption[]
}

export function buildConfiguredItemName(
  originalName: string,
  groups: ConfiguredItemNameGroup[],
) {
  const cleanOriginalName = originalName.trim() || 'Produto'
  const flavorGroup = groups.find(isFlavorGroup)
  const flavors =
    flavorGroup?.options
      .map((option) => ({
        name: option.name.trim(),
        fraction: option.fraction,
      }))
      .filter((option) => option.name) ?? []

  if (!/\bpizza\b/i.test(cleanOriginalName) || flavors.length === 0) {
    return cleanOriginalName
  }

  if (flavors.length === 1) {
    return `Pizza ${flavors[0].name}`
  }

  const flavorSummary = flavors
    .map((flavor) => {
      const fraction = formatSelectionFraction(flavor.fraction, flavors.length)
      return `${fraction} ${flavor.name}`
    })
    .join(' + ')

  return `Pizza ${flavorSummary}`
}

function isFlavorGroup(group: ConfiguredItemNameGroup) {
  const code = normalizeToken(group.code)
  const name = normalizeToken(group.name)
  const flavorTerms = ['flavor', 'flavors', 'sabor', 'sabores']

  return (
    code.split('_').some((part) => flavorTerms.includes(part)) ||
    flavorTerms.includes(name)
  )
}

function formatSelectionFraction(
  configuredFraction: number | null | undefined,
  selectionCount: number,
) {
  const denominator =
    configuredFraction && configuredFraction > 0 && configuredFraction < 1
      ? Math.round(1 / configuredFraction)
      : selectionCount

  return `1/${Math.max(denominator, 2)}`
}

function normalizeToken(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}
