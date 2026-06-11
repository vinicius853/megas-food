export type PublicMenuV2Response = {
  tenant: {
    id: string
    slug: string
    name: string
    whatsapp: string | null
    logoUrl: string | null
  }
  categories: PublicMenuV2Category[]
}

export type PublicMenuV2Category = {
  id: string
  name: string
  slug: string
  type: string
  sortOrder: number
  products: PublicMenuV2Product[]
}

export type PublicMenuV2Product = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  type: string
  pricingMode: 'FIXED' | 'FROM_MODIFIERS'
  basePrice: number | null
  price: number | null
  sortOrder: number
  modifierGroups: PublicMenuV2ModifierGroup[]
}

export type PublicMenuV2ModifierGroup = {
  id: string
  code: string
  name: string
  description: string | null
  selectionType: 'SINGLE' | 'MULTIPLE'
  pricingMode: 'INCLUDED' | 'ADDITIVE' | 'REPLACE_BASE' | 'HIGHEST_SELECTED'
  isRequired: boolean
  minSelections: number
  maxSelections: number
  sortOrder: number
  options: PublicMenuV2Option[]
}

export type PublicMenuV2Option = {
  id: string
  code: string | null
  name: string
  description: string | null
  imageUrl: string | null
  priceDelta: number
  sortOrder: number
  isActive: boolean
  prices: Array<{
    id: string
    dependsOnOptionId: string | null
    price: number
  }>
}

export type ExperimentalMenuV2Selections = Record<string, string[]>

export type ExperimentalOrderV2Customer = {
  name: string
  phone: string
}

export type ExperimentalOrderV2Payload = {
  customer: ExperimentalOrderV2Customer
  type: 'ONLINE' | 'TAKEAWAY' | 'DELIVERY'
  paymentType: 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD'
  deliveryFee: number
  notes?: string
  items: Array<{
    productId: string
    quantity: number
    selectedModifiers: Array<{
      groupId: string
      groupCode: string
      optionId: string
      dependsOnOptionId?: string
      fraction?: number
    }>
  }>
}

export type PublicOrderV2Response = {
  id: string
  displayNumber?: string | number | null
  total: string | number
  items: Array<{
    id: string
    modifiers: unknown[]
    flavors: unknown[]
  }>
}

export type PublicMenuV2PriceResult = {
  unitPrice: number
  totalPrice: number
  appliedModifiers: Array<{
    groupId: string
    groupCode: string
    groupName: string
    optionId: string
    optionCode?: string
    optionName: string
    pricingMode: string
    quantity: number
    fraction?: number
    unitPriceDelta: number
    totalDelta: number
  }>
  validationErrors: Array<{
    code: string
    message: string
    groupCode?: string
    optionId?: string
  }>
}
