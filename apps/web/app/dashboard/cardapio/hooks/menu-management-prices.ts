import type {
  BorderPrice,
  FlavorPrice,
  MenuManagementResponse,
} from '../types/menu-management'

export function dedupeFlavorPrices(prices: FlavorPrice[]) {
  return dedupePrices(prices, flavorPriceKey)
}

export function dedupeBorderPrices(prices: BorderPrice[]) {
  return dedupePrices(prices, borderPriceKey)
}

export function normalizeMenuPrices(
  state: MenuManagementResponse,
): MenuManagementResponse {
  return {
    ...state,
    flavorPrices: dedupeFlavorPrices(state.flavorPrices),
    borderPrices: dedupeBorderPrices(state.borderPrices),
  }
}

export function upsertFlavorPrice(
  prices: FlavorPrice[],
  next: FlavorPrice,
) {
  return upsertPrice(prices, next, flavorPriceKey)
}

export function upsertBorderPrice(
  prices: BorderPrice[],
  next: BorderPrice,
) {
  return upsertPrice(prices, next, borderPriceKey)
}

export function validateUniqueMenuPrices(state: MenuManagementResponse) {
  if (hasDuplicate(state.flavorPrices, flavorPriceKey)) {
    return 'Existem precos de sabor duplicados para o mesmo produto e tamanho.'
  }

  if (hasDuplicate(state.borderPrices, borderPriceKey)) {
    return 'Existem precos de borda duplicados para o mesmo produto e tamanho.'
  }

  return null
}

function flavorPriceKey(price: FlavorPrice) {
  return `${price.productId}:${price.flavorId}:${price.sizeId}`
}

function borderPriceKey(price: BorderPrice) {
  return `${price.productId}:${price.borderId}:${price.sizeId}`
}

function dedupePrices<T extends { id?: string }>(
  prices: T[],
  getKey: (price: T) => string,
) {
  const unique = new Map<string, T>()

  for (const price of prices) {
    const key = getKey(price)
    const current = unique.get(key)

    unique.set(key, {
      ...current,
      ...price,
      id: current?.id ?? price.id,
    })
  }

  return [...unique.values()]
}

function upsertPrice<T extends { id?: string }>(
  prices: T[],
  next: T,
  getKey: (price: T) => string,
) {
  const targetKey = getKey(next)
  const current = prices.find((price) => getKey(price) === targetKey)
  const withoutTarget = prices.filter(
    (price) => getKey(price) !== targetKey,
  )

  return [
    ...withoutTarget,
    {
      ...current,
      ...next,
      id: current?.id ?? next.id,
    },
  ]
}

function hasDuplicate<T>(prices: T[], getKey: (price: T) => string) {
  const keys = new Set<string>()

  return prices.some((price) => {
    const key = getKey(price)

    if (keys.has(key)) return true

    keys.add(key)
    return false
  })
}
