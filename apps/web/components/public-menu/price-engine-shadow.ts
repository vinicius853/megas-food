import { apiFetch } from '@/lib/api'

export type PriceEngineSelectedModifier = {
  groupCode: string
  optionId: string
  dependsOnOptionId?: string
  quantity?: number
  fraction?: number
}

export type PriceEngineShadowRequest = {
  productId: string
  quantity: number
  selectedModifiers: PriceEngineSelectedModifier[]
}

type PriceEngineShadowResult = {
  unitPrice: number
  totalPrice: number
  validationErrors: Array<{
    code: string
    message: string
  }>
}

type ShadowComparisonInput = {
  configuredTotalPrice: number
  additionalTotalPrice?: number
  priceEngineTotalPrice: number
}

export async function calculatePriceEngineShadow(tenantSlug: string, request: PriceEngineShadowRequest) {
  return apiFetch<PriceEngineShadowResult>(`/public-menu-v2/${tenantSlug}/price`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function comparePriceEngineShadow(input: ShadowComparisonInput) {
  const expectedTotal = input.configuredTotalPrice - (input.additionalTotalPrice ?? 0)
  const difference = roundMoney(input.priceEngineTotalPrice - expectedTotal)

  return {
    expectedTotal: roundMoney(expectedTotal),
    priceEngineTotal: roundMoney(input.priceEngineTotalPrice),
    difference,
    diverged: Math.abs(difference) >= 0.01,
  }
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
