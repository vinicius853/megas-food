export type Product = {
  id: string
  name: string
  description?: string | null
  type?: 'PIZZA_ROUND' | 'PIZZA_SQUARE' | 'DRINK' | 'OTHER'
}

export type PizzaSize = {
  id: string
  productId: string
  name: string
  maxFlavors: number
  allowBorder: boolean
}

export type PizzaFlavor = {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
}

export type FlavorPrice = {
  productId: string
  sizeId: string
  flavorId: string
  price: string | number
}

export type PizzaBorder = {
  id: string
  name: string
}

export type BorderPrice = {
  productId: string
  sizeId: string
  borderId: string
  price: string | number
}

export type AdditionalProduct = {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  price: string | number
}

export type Step =
  | 'size'
  | 'mode'
  | 'secondFlavor'
  | 'borderQuestion'
  | 'borderSelect'
  | 'additionalQuestion'
  | 'additionalSelect'
  | 'summary'
  | 'drinkSuggestion'

export type SelectionMode = 'whole' | 'multi'

export type PizzaConfiguratorFlowProps = {
  open: boolean
  product: Product | null
  initialFlavorId: string | null
  sizes: PizzaSize[]
  flavors: PizzaFlavor[]
  flavorPrices: FlavorPrice[]
  borders: PizzaBorder[]
  borderPrices: BorderPrice[]
  additionalProducts?: AdditionalProduct[]
  onClose: () => void
  shouldOfferDrinkSuggestion?: boolean
  onDrinkSuggestionShown?: () => void
  onViewDrinks: () => void
  onOpenCart: () => void
  onItemAdded?: (item: { name: string; imageUrl: string }) => void
}
