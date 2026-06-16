import type { CartItem } from './cart-context'
import { buildConfiguredItemName } from '@/lib/configured-item-name'
import { capitalizePublicDisplayName } from './public-menu-display-text'

export type CartItemDisplay = {
  sizeOption?: string
  flavorOptions: Array<{
    name: string
    fraction?: number
  }>
  borderOption?: {
    name: string
    price?: number
  }
}

export function buildCartItemDisplay(item: CartItem): CartItemDisplay {
  const sizeGroup = item.displayGroups.find((group) => group.code === 'pizza_size')
  const flavorGroup = item.displayGroups.find((group) => group.code === 'pizza_flavor')
  const borderGroup = item.displayGroups.find((group) => group.code === 'pizza_border')

  return {
    sizeOption: capitalizeOptionalName(
      sizeGroup?.options[0]?.name ?? getModifierName(item, 'pizza_size'),
    ),
    flavorOptions:
      flavorGroup?.options.map((option) => ({
        name: capitalizePublicDisplayName(option.name),
        fraction: option.fraction,
      })) ?? buildFlavorDisplayFromModifiers(item),
    borderOption: borderGroup?.options[0]
      ? {
          name: capitalizePublicDisplayName(borderGroup.options[0].name),
          price: borderGroup.options[0].price,
        }
      : buildBorderDisplayFromModifiers(item),
  }
}

export function itemDisplaySubtitle(display: CartItemDisplay) {
  const details = [
    display.sizeOption,
    display.flavorOptions.length > 0
      ? display.flavorOptions.map((option) => option.name).join(' / ')
      : '',
  ].filter(Boolean)

  return details.join(' · ')
}

export function cartItemDisplayName(item: CartItem) {
  const groups =
    item.displayGroups.length > 0
      ? item.displayGroups.map((group) => ({
          code: group.code,
          name: group.name,
          options: group.options.map((option) => ({
            name: capitalizePublicDisplayName(option.name),
            fraction: option.fraction,
          })),
        }))
      : groupSelectedModifiers(item)

  return capitalizePublicDisplayName(buildConfiguredItemName(item.productName, groups))
}

export function formatModifierFraction(fraction?: number) {
  if (!fraction || fraction >= 1) return ''

  const roundedDenominator = Math.round(1 / fraction)

  return roundedDenominator > 1 ? `1/${roundedDenominator} ` : ''
}

function buildFlavorDisplayFromModifiers(item: CartItem) {
  const flavorModifiers =
    item.selectedModifiers.filter(
      (modifier) => modifier.groupCode === 'pizza_flavor',
    )

  return flavorModifiers.length > 0
    ? flavorModifiers.map((modifier) => ({
        name: modifier.optionName
          ? capitalizePublicDisplayName(modifier.optionName)
          : 'Sabor',
        fraction: modifier.fraction,
      }))
    : []
}

function buildBorderDisplayFromModifiers(item: CartItem) {
  const borderModifier = item.selectedModifiers.find(
    (modifier) => modifier.groupCode === 'pizza_border',
  )

  if (!borderModifier?.optionName) {
    return undefined
  }

  return {
    name: capitalizePublicDisplayName(borderModifier.optionName),
    price: borderModifier.totalDelta,
  }
}

function getModifierName(item: CartItem, groupCode: string) {
  return item.selectedModifiers.find(
    (modifier) => modifier.groupCode === groupCode,
  )
    ?.optionName
}

function groupSelectedModifiers(item: CartItem) {
  const groups = new Map<
    string,
    {
      code: string
      name: string
      options: Array<{ name: string; fraction?: number }>
    }
  >()

  for (const modifier of item.selectedModifiers) {
    if (!modifier.optionName) continue

    const group = groups.get(modifier.groupCode) ?? {
      code: modifier.groupCode,
      name: modifier.groupName ?? modifier.groupCode,
      options: [],
    }
    group.options.push({
      name: capitalizePublicDisplayName(modifier.optionName),
      fraction: modifier.fraction,
    })
    groups.set(modifier.groupCode, group)
  }

  return [...groups.values()]
}

function capitalizeOptionalName(value?: string) {
  return value ? capitalizePublicDisplayName(value) : undefined
}
