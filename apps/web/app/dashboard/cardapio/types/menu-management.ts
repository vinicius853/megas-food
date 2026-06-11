import type { Dispatch, SetStateAction } from 'react'

export type StaticTab =
  | 'pizzas'
  | 'bebidas'
  | 'bordas'
  | 'adicionais'
  | 'categorias'

export type ProductSectionTab = `section:${string}`

export type Tab = StaticTab | ProductSectionTab

export type PizzaMode = 'round' | 'square' | 'mixed'

export type CategoryType = 'PRODUCT_SECTION' | 'PIZZA_FLAVOR_GROUP'

export type ProductType = 'PIZZA_ROUND' | 'PIZZA_SQUARE' | 'DRINK' | 'OTHER'

export type SizeOptionDisplayType = 'CM' | 'SLICES' | 'CUSTOM'

export type Category = {
  id: string
  name: string
  slug?: string
  type: CategoryType
  sortOrder?: number
  isActive: boolean
}

export type Product = {
  id: string
  categoryId: string
  name: string
  description?: string | null
  imageUrl?: string | null
  type: ProductType
  price?: string | number | null
  sortOrder?: number
  isActive: boolean
}

export type SizeOptionMatrixRow = {
  id: string
  productId: string
  name: string
  subtitle?: string | null
  type: SizeOptionDisplayType
  value?: number | null
  maxFlavors: number | ''
  isActive: boolean
  allowBorder: boolean
  sortOrder?: number
}

export type FlavorOptionMatrixRow = {
  id: string
  categoryId?: string | null
  name: string
  description?: string | null
  imageUrl?: string | null
  sortOrder?: number
  isActive: boolean
}

export type BorderOptionMatrixRow = {
  id: string
  name: string
  isActive: boolean
}

export type FlavorPrice = {
  id?: string
  productId: string
  sizeId: string
  flavorId: string
  price: string | number
}

export type BorderPrice = {
  id?: string
  productId: string
  sizeId: string
  borderId: string
  price: string | number
}

export type MenuManagementResponse = {
  categories: Category[]
  products: Product[]
  sizeOptions: SizeOptionMatrixRow[]
  flavorOptions: FlavorOptionMatrixRow[]
  flavorPrices: FlavorPrice[]
  borderOptions: BorderOptionMatrixRow[]
  borderPrices: BorderPrice[]
}

export type GenericMenuManagementResponse = {
  categories: Category[]
  products: GenericMenuProduct[]
}

export type GenericMenuUpdateResponse = {
  result: {
    categories: number
    products: number
    groups: number
    options: number
    prices: number
    rules: number
  }
  menu: GenericMenuManagementResponse
}

export type GenericMenuProduct = {
  id: string
  categoryId: string
  name: string
  description: string | null
  imageUrl: string | null
  type: ProductType
  pricingMode: 'FIXED' | 'FROM_MODIFIERS'
  basePrice: number | null
  price: number | null
  isActive: boolean
  sortOrder: number
  modifierGroups: GenericModifierGroup[]
}

export type GenericModifierGroup = {
  id: string
  productModifierGroupId: string
  code: string
  name: string
  description: string | null
  selectionType: 'SINGLE' | 'MULTIPLE'
  pricingMode: 'INCLUDED' | 'ADDITIVE' | 'REPLACE_BASE' | 'HIGHEST_SELECTED'
  isRequired: boolean
  minSelections: number
  maxSelections: number
  sortOrder: number
  isActive: boolean
  options: GenericModifierOption[]
}

export type GenericModifierOption = {
  id: string
  productModifierOptionId: string
  code: string | null
  name: string
  description: string | null
  imageUrl: string | null
  displayCategoryId: string | null
  priceDelta: number
  sortOrder: number
  isActive: boolean
  prices: GenericContextualPrice[]
  rules: GenericConditionalRule[]
}

export type GenericContextualPrice = {
  id: string
  dependsOnOptionId: string | null
  price: number
}

export type GenericConditionalRule = {
  id: string
  targetGroupId: string
  targetGroupCode: string
  isEnabled: boolean
  minSelections: number | null
  maxSelections: number | null
  metadata: unknown
}

export type SizeOptionMatrixSetter = Dispatch<SetStateAction<SizeOptionMatrixRow[]>>

export type ProductUpdater = (
  id: string,
  field: keyof Product,
  value: Product[keyof Product],
) => void

export type CategoryUpdater = (
  id: string,
  field: keyof Category,
  value: Category[keyof Category],
) => void

export function isProductSectionTab(tab: Tab): tab is ProductSectionTab {
  return tab.startsWith('section:')
}

export function getProductSectionIdFromTab(tab: Tab) {
  return isProductSectionTab(tab) ? tab.replace('section:', '') : null
}

export function isRoundSize(size: SizeOptionMatrixRow) {
  return size.type === 'CM'
}

export function isSquareSize(size: SizeOptionMatrixRow) {
  return size.type === 'SLICES'
}

export function parseMoney(value: unknown) {
  if (typeof value === 'number') return value

  const normalized = String(value ?? '0')
    .replace(/\./g, '')
    .replace(',', '.')

  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

export function parsePositiveInteger(value: unknown, fallback = 1) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return Math.trunc(parsed)
}

export function formatMoneyInput(value: unknown) {
  return parseMoney(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function findFlavorPrice(
  prices: FlavorPrice[],
  productId: string,
  sizeId: string,
  flavorId: string,
) {
  return (
    prices.find(
      (price) =>
        price.productId === productId &&
        price.sizeId === sizeId &&
        price.flavorId === flavorId,
    )?.price ?? '0,00'
  )
}

export function findBorderPrice(
  prices: BorderPrice[],
  productId: string,
  sizeId: string,
  borderId: string,
) {
  return (
    prices.find(
      (price) =>
        price.productId === productId &&
        price.sizeId === sizeId &&
        price.borderId === borderId,
    )?.price ?? '0,00'
  )
}
