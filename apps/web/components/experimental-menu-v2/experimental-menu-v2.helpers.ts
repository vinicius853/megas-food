import type {
  ExperimentalOrderV2Customer,
  ExperimentalOrderV2Payload,
  ExperimentalMenuV2Selections,
  PublicMenuV2ModifierGroup,
  PublicMenuV2Option,
  PublicMenuV2Product,
} from './experimental-menu-v2.types'

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'Sob consulta'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function getProductBasePrice(product: {
  price: number | null
  basePrice: number | null
}) {
  return product.basePrice ?? product.price
}

export function getContextualPriceSummary(
  option: PublicMenuV2Option,
  optionNameById: Map<string, string>,
) {
  if (option.prices.length === 0) {
    return option.priceDelta > 0
      ? `+ ${formatMoney(option.priceDelta)}`
      : 'Sem preco contextual'
  }

  return option.prices
    .map((price) => {
      const dependency = price.dependsOnOptionId
        ? (optionNameById.get(price.dependsOnOptionId) ?? 'contexto')
        : 'padrao'

      return `${dependency}: ${formatMoney(price.price)}`
    })
    .join(' | ')
}

export function toggleOption(
  selections: ExperimentalMenuV2Selections,
  group: PublicMenuV2ModifierGroup,
  optionId: string,
) {
  const current = selections[group.id] ?? []
  const isSelected = current.includes(optionId)

  if (group.selectionType === 'SINGLE') {
    return {
      ...selections,
      [group.id]: isSelected ? [] : [optionId],
    }
  }

  if (isSelected) {
    return {
      ...selections,
      [group.id]: current.filter((id) => id !== optionId),
    }
  }

  if (current.length >= group.maxSelections) {
    return selections
  }

  return {
    ...selections,
    [group.id]: [...current, optionId],
  }
}

export function getGroupStatus(
  group: PublicMenuV2ModifierGroup,
  selections: ExperimentalMenuV2Selections,
) {
  const selectedCount = selections[group.id]?.length ?? 0

  if (group.isRequired && selectedCount === 0) {
    return 'Obrigatorio'
  }

  if (selectedCount < group.minSelections) {
    return `Minimo ${group.minSelections}`
  }

  if (selectedCount >= group.maxSelections) {
    return `Limite ${group.maxSelections}`
  }

  return `${selectedCount}/${group.maxSelections}`
}

export function buildOptionNameMap(groups: PublicMenuV2ModifierGroup[]) {
  const optionNameById = new Map<string, string>()

  for (const group of groups) {
    for (const option of group.options) {
      optionNameById.set(option.id, option.name)
    }
  }

  return optionNameById
}

export function buildPriceEngineModifiers(
  product: PublicMenuV2Product,
  selections: ExperimentalMenuV2Selections,
) {
  const dependencyOptionId = product.modifierGroups
    .filter((group) => group.pricingMode === 'INCLUDED')
    .flatMap((group) => selections[group.id] ?? [])
    .at(0)

  return product.modifierGroups.flatMap((group) => {
    const selectedIds = selections[group.id] ?? []
    const fraction =
      group.pricingMode === 'HIGHEST_SELECTED' && selectedIds.length > 1
        ? roundFraction(1 / selectedIds.length)
        : undefined

    return selectedIds.map((optionId) => ({
      groupId: group.id,
      groupCode: group.code,
      optionId,
      dependsOnOptionId:
        group.pricingMode === 'INCLUDED' ? undefined : dependencyOptionId,
      fraction,
    }))
  })
}

export function hasAnySelection(selections: ExperimentalMenuV2Selections) {
  return Object.values(selections).some((selected) => selected.length > 0)
}

export function buildPublicOrderV2Payload({
  customer,
  product,
  quantity,
  selections,
}: {
  customer: ExperimentalOrderV2Customer
  product: PublicMenuV2Product
  quantity: number
  selections: ExperimentalMenuV2Selections
}): ExperimentalOrderV2Payload {
  return {
    customer,
    type: 'DELIVERY',
    paymentType: 'PIX',
    deliveryFee: 0,
    notes: 'Pedido experimental V2',
    items: [
      {
        productId: product.id,
        quantity: normalizeOrderQuantity(quantity),
        selectedModifiers: buildPriceEngineModifiers(product, selections),
      },
    ],
  }
}

export function normalizeOrderQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1
  }

  return Math.floor(quantity)
}

function roundFraction(value: number) {
  return Math.round(value * 100) / 100
}
