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
      category.type === 'PIZZA_FLAVOR_GROUP',
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
