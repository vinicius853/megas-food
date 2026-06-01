import {
  type Category,
  type MenuManagementResponse,
  type Product,
} from '../types/menu-management'
import { fixedProductSectionSlugs } from './menu-management-constants'
import { temporaryId } from './menu-management-utils'

export function normalizeCategory(
  category: Category,
): Category {
  if (fixedProductSectionSlugs.includes(category.slug ?? '')) {
    return {
      ...category,
      type: 'PRODUCT_SECTION',
      isActive: true,
    }
  }

  return {
    ...category,
    type: category.type ?? 'PRODUCT_SECTION',
  }
}

function ensureFixedProductSection(
  categories: Category[],
  slug: string,
  name: string,
) {
  const existing = categories.find(
    (category) => category.slug === slug,
  )

  if (existing) {
    existing.name = name
    existing.type = 'PRODUCT_SECTION'
    existing.isActive = true
    return existing
  }

  const category: Category = {
    id: temporaryId(`category-${slug}`),
    name,
    slug,
    type: 'PRODUCT_SECTION',
    sortOrder: categories.length,
    isActive: true,
  }

  categories.push(category)

  return category
}

function ensurePizzaProduct(
  products: Product[],
  categoryId: string,
  type: 'PIZZA_ROUND' | 'PIZZA_SQUARE',
  name: string,
  sortOrder: number,
) {
  const existing = products.find(
    (product) => product.type === type,
  )

  if (existing) {
    existing.categoryId = categoryId
    existing.name = name
    existing.sortOrder = sortOrder
    existing.isActive = true
    return existing
  }

  const product: Product = {
    id:
      type === 'PIZZA_ROUND'
        ? temporaryId('product-round')
        : temporaryId('product-square'),
    categoryId,
    name,
    type,
    sortOrder,
    isActive: true,
  }

  products.push(product)

  return product
}

export function ensureBaseData(
  data: MenuManagementResponse,
): MenuManagementResponse {
  const categories = data.categories.map(normalizeCategory)
  const products = [...data.products]

  const pizzaCategory = ensureFixedProductSection(
    categories,
    'pizzas',
    'Pizzas',
  )

  ensureFixedProductSection(
    categories,
    'bebidas',
    'Bebidas',
  )

  ensureFixedProductSection(
    categories,
    'adicionais',
    'Adicionais',
  )

  ensurePizzaProduct(
    products,
    pizzaCategory.id,
    'PIZZA_ROUND',
    'Pizza redonda',
    0,
  )

  ensurePizzaProduct(
    products,
    pizzaCategory.id,
    'PIZZA_SQUARE',
    'Pizza quadrada',
    1,
  )

  if (
    !categories.some(
      (category) =>
        category.slug === 'salgadas' &&
        category.type === 'PIZZA_FLAVOR_GROUP',
    )
  ) {
    categories.push({
      id: temporaryId('category-salgadas'),
      name: 'Salgadas',
      slug: 'salgadas',
      type: 'PIZZA_FLAVOR_GROUP',
      sortOrder: categories.length,
      isActive: true,
    })
  }

  if (
    !categories.some(
      (category) =>
        category.slug === 'doces' &&
        category.type === 'PIZZA_FLAVOR_GROUP',
    )
  ) {
    categories.push({
      id: temporaryId('category-doces'),
      name: 'Doces',
      slug: 'doces',
      type: 'PIZZA_FLAVOR_GROUP',
      sortOrder: categories.length,
      isActive: true,
    })
  }

  return {
    ...data,
    categories,
    products,
  }
}
