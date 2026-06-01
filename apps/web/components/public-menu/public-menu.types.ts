export type ProductType = 'PIZZA_ROUND' | 'PIZZA_SQUARE' | 'DRINK' | 'OTHER'

export type Tenant = {
  id: string
  name: string
  slug: string
  whatsapp?: string | null
  logoUrl?: string | null
}

export type Category = {
  id: string
  name: string
  slug: string
  type?: 'PRODUCT_SECTION' | 'PIZZA_FLAVOR_GROUP'
  sortOrder: number
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
  isActive: boolean
}

export type PizzaSize = {
  id: string
  productId: string
  name: string
  subtitle?: string | null
  maxFlavors: number
  allowBorder: boolean
}

export type PizzaFlavor = {
  id: string
  categoryId?: string | null
  name: string
  description?: string | null
  imageUrl?: string | null
}

export type FlavorPrice = {
  id: string
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
  id: string
  productId: string
  sizeId: string
  borderId: string
  price: string | number
}

export type PublicMenuResponse = {
  tenant: Tenant
  customization?: MenuCustomization
  delivery?: DeliverySettings
  subscription?: PublicSubscription
  categories: Category[]
  products: Product[]
  sizes: PizzaSize[]
  flavors: PizzaFlavor[]
  flavorPrices: FlavorPrice[]
  borders: PizzaBorder[]
  borderPrices: BorderPrice[]
}

export type MenuCustomization = {
  logoUrl?: string
  coverUrl?: string
  paletteId?: string
  brandName?: string
  tagline?: string
}

export type DeliveryZone = {
  id: string
  name: string
  fee: number
  eta: string
  isActive: boolean
}

export type OpeningHourRange = {
  enabled?: boolean
  open: string
  close: string
}

export type DeliveryOpeningHours = {
  monday?: OpeningHourRange
  tuesday?: OpeningHourRange
  wednesday?: OpeningHourRange
  thursday?: OpeningHourRange
  friday?: OpeningHourRange
  weekday?: OpeningHourRange
  saturday?: OpeningHourRange
  sunday?: OpeningHourRange
}

export type DeliverySettings = {
  isDeliveryOpen?: boolean
  city?: string
  state?: string
  storeCep?: string
  storeAddress?: string
  whatsapp?: string
  zones?: DeliveryZone[]
  openingHours?: DeliveryOpeningHours
}

export type PublicSubscription = {
  status: string
  canAcceptOrders: boolean
  canAccessDashboard: boolean
  accessUntil?: string | null
  nextBillingDate?: string | null
  message?: string | null
}

export type MenuPalette = {
  id: string
  primary: string
  secondary: string
  accent: string
  soft: string
  textOnPrimary: string
}

export type FlavorCard = {
  id: string
  name: string
  description: string
  categoryName: string
  categorySortOrder: number
  image: string
  minPrice: number
  prices: {
    label: string
    subtitle?: string | null
    value: number
  }[]
}

export type FixedProductCard = {
  id: string
  product: Product
  name: string
  description: string
  categoryName: string
  categorySortOrder: number
  image: string
  price: number
}

export type MenuSection =
  | {
      id: string
      title: string
      sortOrder: number
      type: 'flavors'
      items: FlavorCard[]
    }
  | {
      id: string
      title: string
      sortOrder: number
      type: 'products'
      items: FixedProductCard[]
    }
