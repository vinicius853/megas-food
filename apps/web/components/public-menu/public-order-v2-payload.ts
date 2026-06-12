import type { CartItem } from './cart-context'

type PublicOrderV2PayloadInput = {
  customerName: string
  customerPhone: string
  type: 'DELIVERY' | 'TAKEAWAY'
  paymentType?: 'CASH' | 'CREDIT_CARD' | 'PIX'
  deliveryFee: number
  couponCode?: string
  notes?: string
  privacyAccepted: boolean
  privacyPolicyVersion: string
  items: CartItem[]
}

type PublicOrderV2ItemPayload = {
  productId: string
  quantity: number
  notes?: string
  selectedModifiers: Array<{
    groupCode: string
    optionId: string
    dependsOnOptionId?: string
    quantity?: number
    fraction?: number
  }>
}

export function buildPublicOrderV2Payload(input: PublicOrderV2PayloadInput) {
  return {
    customer: {
      name: input.customerName,
      phone: input.customerPhone,
    },
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    type: input.type,
    paymentType: input.paymentType,
    deliveryFee: input.deliveryFee,
    couponCode: input.couponCode,
    notes: input.notes,
    privacyAccepted: input.privacyAccepted,
    privacyPolicyVersion: input.privacyPolicyVersion,
    items: input.items.flatMap(buildPublicOrderV2ItemsForCartItem),
  }
}

export function buildPublicOrderV2ItemsForCartItem(
  item: CartItem,
): PublicOrderV2ItemPayload[] {
  return [
    {
      productId: item.productId,
      quantity: item.quantity,
      notes: buildItemNotes(item),
      selectedModifiers: sanitizeSelectedModifiers(item.selectedModifiers),
    },
    ...buildAdditionalItems(item),
  ]
}

function sanitizeSelectedModifiers(
  modifiers: NonNullable<CartItem['selectedModifiers']>,
) {
  return modifiers.map((modifier) => ({
    groupCode: modifier.groupCode,
    optionId: modifier.optionId,
    dependsOnOptionId: modifier.dependsOnOptionId,
    quantity: modifier.quantity,
    fraction: modifier.fraction,
  }))
}

function buildAdditionalItems(item: CartItem): PublicOrderV2ItemPayload[] {
  return (item.additionalItems ?? []).map((additional) => ({
    productId: additional.productId,
    quantity: item.quantity,
    notes: `Adicional de ${item.productName}`,
    selectedModifiers: [],
  }))
}

function buildItemNotes(item: CartItem) {
  return [
    item.notes,
    (item.additionalItems?.length ?? 0) > 0
      ? `Adicionais: ${item.additionalItems
          ?.map((additional) => additional.name)
          .join(', ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}
