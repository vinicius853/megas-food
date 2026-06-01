import type {
  Dispatch,
  SetStateAction,
} from 'react'

export type StaticTab =
  | 'pizzas'
  | 'bebidas'
  | 'bordas'
  | 'adicionais'
  | 'categorias'

export type ProductSectionTab = `section:${string}`

export type Tab = StaticTab | ProductSectionTab

export type PizzaMode = 'round' | 'square' | 'mixed'

export type CategoryType =
  | 'PRODUCT_SECTION'
  | 'PIZZA_FLAVOR_GROUP'

export type ProductType =
  | 'PIZZA_ROUND'
  | 'PIZZA_SQUARE'
  | 'DRINK'
  | 'OTHER'

export type PizzaSizeType = 'CM' | 'SLICES' | 'CUSTOM'

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

export type PizzaSizeConfig = {
  id: string
  productId: string
  name: string
  subtitle?: string | null
  type: PizzaSizeType
  value?: number | null
  maxFlavors: number | ''
  isActive: boolean
  allowBorder: boolean
  sortOrder?: number
}

export type PizzaFlavor = {
  id: string
  categoryId?: string | null
  name: string
  description?: string | null
  imageUrl?: string | null
  sortOrder?: number
  isActive: boolean
}

export type PizzaBorder = {
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
  pizzaSizes: PizzaSizeConfig[]
  pizzaFlavors: PizzaFlavor[]
  flavorPrices: FlavorPrice[]
  pizzaBorders: PizzaBorder[]
  borderPrices: BorderPrice[]
}

export type PizzaSizeSetter = Dispatch<
  SetStateAction<PizzaSizeConfig[]>
>

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

export function isProductSectionTab(
  tab: Tab,
): tab is ProductSectionTab {
  return tab.startsWith('section:')
}

export function getProductSectionIdFromTab(tab: Tab) {
  return isProductSectionTab(tab)
    ? tab.replace('section:', '')
    : null
}

export function isRoundSize(size: PizzaSizeConfig) {
  return size.type === 'CM'
}

export function isSquareSize(size: PizzaSizeConfig) {
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

export function parsePositiveInteger(
  value: unknown,
  fallback = 1,
) {
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
