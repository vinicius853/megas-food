import {
  type Category,
  type MenuManagementResponse,
  type PizzaMode,
  type SizeOptionMatrixRow,
  type Product,
  isRoundSize,
  isSquareSize,
} from '../types/menu-management'
import { fixedProductSectionSlugs } from './menu-management-constants'

export function getPizzaProduct(
  products: Product[],
  type: 'PIZZA_ROUND' | 'PIZZA_SQUARE',
) {
  return products.find(
    (product) => product.type === type && product.isActive,
  )
}

export function getInactivePizzaProduct(
  products: Product[],
  type: 'PIZZA_ROUND' | 'PIZZA_SQUARE',
) {
  return products.find(
    (product) => product.type === type && !product.isActive,
  )
}

const preferredPizzaBaseCategorySlugs = [
  'tradicionais',
  'tradicional',
  'especiais',
  'especial',
  'doces',
  'doce',
  'salgadas',
  'salgada',
]

const avoidedPizzaBaseCategorySlugs = [
  'bebidas',
  'bebida',
  'esfirras',
  'esfirra',
  'adicionais',
  'adicional',
  'bordas',
  'borda',
]

export function getTechnicalPizzaBaseCategory(
  categories: Category[],
) {
  const activeProductSections = categories
    .filter(
      (category) =>
        category.isActive &&
        category.type === 'PRODUCT_SECTION',
    )
    .sort(
      (left, right) =>
        (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
    )

  return (
    activeProductSections.find(
      (category) => category.slug === 'pizzas',
    ) ??
    activeProductSections.find((category) =>
      preferredPizzaBaseCategorySlugs.includes(
        getCategoryLookupKey(category),
      ),
    ) ??
    activeProductSections.find(
      (category) =>
        !avoidedPizzaBaseCategorySlugs.includes(
          getCategoryLookupKey(category),
        ),
    ) ??
    activeProductSections[0] ??
    null
  )
}

function getCategoryLookupKey(category: Category) {
  return normalizeCategoryKey(category.slug || category.name)
}

function normalizeCategoryKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getProductSections(
  categories: Category[],
) {
  return categories.filter(
    (category) =>
      category.isActive &&
      category.type === 'PRODUCT_SECTION',
  )
}

export function getCustomProductSections(
  productSections: Category[],
) {
  return productSections.filter(
    (category) =>
      !fixedProductSectionSlugs.includes(
        category.slug ?? '',
      ),
  )
}

export function getSelectedProductSection(
  customProductSections: Category[],
  selectedProductSectionId: string | null,
) {
  if (!selectedProductSectionId) return null

  return (
    customProductSections.find(
      (category) =>
        category.id === selectedProductSectionId,
    ) ?? null
  )
}

export function getSelectedProductSectionProducts(
  products: Product[],
  selectedProductSection: Category | null,
) {
  if (!selectedProductSection) return []

  return products.filter(
    (product) =>
      product.categoryId === selectedProductSection.id &&
      product.type === 'OTHER',
  )
}

export function getFlavorDisplayGroups(
  categories: Category[],
) {
  return categories.filter(
    (category) =>
      category.isActive &&
      (category.type === 'PRODUCT_SECTION' ||
        category.type === 'PIZZA_FLAVOR_GROUP'),
  )
}

export function getDrinks(
  products: Product[],
) {
  return products.filter(
    (product) => product.type === 'DRINK',
  )
}

export function getExtras(
  products: Product[],
  productSections: Category[],
) {
  return products.filter(
    (product) =>
      product.type === 'OTHER' &&
      product.categoryId ===
        productSections.find(
          (category) => category.slug === 'adicionais',
        )?.id,
  )
}

export function getVisibleSizes(
  sizes: SizeOptionMatrixRow[],
  pizzaMode: PizzaMode,
) {
  return sizes.filter((size) => {
    if (!size.isActive) return false

    if (pizzaMode === 'mixed') return true

    if (pizzaMode === 'round') return isRoundSize(size)

    return isSquareSize(size)
  })
}

export function getBorderSizes(
  sizes: SizeOptionMatrixRow[],
) {
  return sizes.filter(
    (size) => size.isActive && size.allowBorder,
  )
}

export function getRoundSizes(
  sizes: SizeOptionMatrixRow[],
) {
  return sizes.filter(isRoundSize)
}

export function getSquareSizes(
  sizes: SizeOptionMatrixRow[],
) {
  return sizes.filter(isSquareSize)
}

export function getFilteredFlavors(
  flavors: MenuManagementResponse['flavorOptions'],
  search: string,
) {
  return flavors.filter((flavor) =>
    flavor.name
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
}
