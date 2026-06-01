import {
  compareCategoryOrder,
  normalizeCategoryLabel,
  parseMoney,
} from './public-menu-formatters'
import { PIZZA_IMAGES, PRODUCT_IMAGES } from './public-menu-theme'
import type {
  FixedProductCard,
  FlavorCard,
  MenuSection,
  Product,
  PublicMenuResponse,
} from './public-menu.types'

export function isPizzaProduct(product: Product) {
  return product.type === 'PIZZA_ROUND' || product.type === 'PIZZA_SQUARE'
}

export function getPizzaProduct(data: PublicMenuResponse) {
  return (
    data.products.find((product) => product.isActive && product.type === 'PIZZA_ROUND') ??
    data.products.find((product) => product.isActive && product.type === 'PIZZA_SQUARE') ??
    null
  )
}

export function mapFlavorCards(data: PublicMenuResponse): FlavorCard[] {
  const pizzaProduct = getPizzaProduct(data)

  if (!pizzaProduct) return []

  return data.flavors
    .map((flavor, index) => {
      const prices = data.sizes
        .filter((size) => size.productId === pizzaProduct.id)
        .map((size) => {
          const price = data.flavorPrices.find(
            (item) =>
              item.productId === pizzaProduct.id &&
              item.flavorId === flavor.id &&
              item.sizeId === size.id,
          )

          return {
            label: size.name,
            subtitle: size.subtitle,
            value: parseMoney(price?.price),
          }
        })
        .filter((price) => price.value > 0)
        .slice(0, 4)

      const category = data.categories.find((item) => item.id === flavor.categoryId)

      return {
        id: flavor.id,
        name: flavor.name,
        description: flavor.description ?? 'Pizza artesanal preparada com ingredientes selecionados.',
        categoryName: category?.name ?? 'Pizzas',
        categorySortOrder: category?.sortOrder ?? 0,
        image: flavor.imageUrl || PIZZA_IMAGES[index % PIZZA_IMAGES.length],
        minPrice: prices.length > 0 ? Math.min(...prices.map((price) => price.value)) : 0,
        prices,
      }
    })
    .filter((flavor) => flavor.minPrice > 0)
}

export function mapFixedProductCards(data: PublicMenuResponse): FixedProductCard[] {
  return data.products
    .filter((product) => product.isActive && !isPizzaProduct(product))
    .map((product, index) => {
      const category = data.categories.find((item) => item.id === product.categoryId)

      return {
        id: product.id,
        product,
        name: product.name,
        description: product.description ?? 'Produto cadastrado no cardapio.',
        categoryName: category?.name ?? 'Cardapio',
        categorySortOrder: category?.sortOrder ?? 0,
        image: product.imageUrl || PRODUCT_IMAGES[index % PRODUCT_IMAGES.length],
        price: parseMoney(product.price),
      }
    })
    .filter((product) => product.price > 0)
}

export function isAdditionalCategory(value: string) {
  return normalizeCategoryLabel(value).includes('adicion')
}

function groupByCategory<T extends { categoryName: string; categorySortOrder: number }>(
  items: T[],
) {
  const groups = new Map<
    string,
    {
      title: string
      sortOrder: number
      items: T[]
    }
  >()

  for (const item of items) {
    const key = item.categoryName
    const existing = groups.get(key)

    if (existing) {
      existing.items.push(item)
      continue
    }

    groups.set(key, {
      title: key,
      sortOrder: item.categorySortOrder,
      items: [item],
    })
  }

  return Array.from(groups.values())
}

export function buildMenuSections(
  flavors: FlavorCard[],
  products: FixedProductCard[],
): MenuSection[] {
  const flavorSections = groupByCategory(flavors).map(
    (section) => ({
      id: `flavors-${section.title}`,
      title: section.title.toLowerCase().includes('pizza')
        ? section.title
        : `Pizzas ${section.title.toLowerCase()}`,
      sortOrder: section.sortOrder,
      type: 'flavors' as const,
      items: section.items,
    }),
  )

  const productSections = groupByCategory(products).map(
    (section) => ({
      id: `products-${section.title}`,
      title: section.title,
      sortOrder: section.sortOrder + 100,
      type: 'products' as const,
      items: section.items,
    }),
  )

  return [...flavorSections, ...productSections].sort((a, b) =>
    compareCategoryOrder(a.title, a.sortOrder, b.title, b.sortOrder),
  )
}

export function buildCategoryTabs(
  flavors: FlavorCard[],
  products: FixedProductCard[],
) {
  const tabs = new Map<string, number>()

  for (const flavor of flavors) {
    tabs.set(
      flavor.categoryName,
      Math.min(
        tabs.get(flavor.categoryName) ?? flavor.categorySortOrder,
        flavor.categorySortOrder,
      ),
    )
  }

  for (const product of products) {
    tabs.set(
      product.categoryName,
      Math.min(
        tabs.get(product.categoryName) ?? product.categorySortOrder + 100,
        product.categorySortOrder + 100,
      ),
    )
  }

  return [
    'Todos',
    ...Array.from(tabs.entries())
      .sort((a, b) => compareCategoryOrder(a[0], a[1], b[0], b[1]))
      .map(([name]) => name),
  ]
}
