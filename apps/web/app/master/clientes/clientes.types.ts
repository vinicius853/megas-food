export type TenantUser = {
  id: string
  name: string
  email: string
  role: string
  isActive?: boolean
  createdAt?: string
}

export type Tenant = {
  id: string
  internalCode?: string | null
  name: string
  slug: string
  responsibleName?: string | null
  document?: string | null
  phone?: string | null
  whatsapp?: string | null
  city?: string | null
  state?: string | null
  address?: string | null
  zipCode?: string | null
  internalNotes?: string | null
  logoUrl?: string | null
  isActive: boolean
  createdAt: string
  users?: TenantUser[]
  subscriptions?: Array<{
    id: string
    planId: string
    status: string
    contractedMonthlyPrice: string | number
    contractedAnnualPrice?: string | number | null
    contractedSetupFee?: string | number | null
    contractedAt?: string | null
    internalNotes?: string | null
    startedAt?: string | null
    nextBillingDate?: string | null
    accessUntil?: string | null
    plan?: {
      id: string
      name: string
      monthlyPrice: string | number
      annualPrice?: string | number | null
      setupFee?: string | number | null
    } | null
  }>
}

export type Plan = {
  id: string
  name: string
  slug: string
  monthlyPrice: string | number
  annualPrice?: string | number | null
  setupFee?: string | number | null
  isActive: boolean
}

export type TenantForm = {
  name: string
  slug: string
  ownerName: string
  ownerEmail: string
  ownerPassword: string
  document: string
  phone: string
  whatsapp: string
  city: string
  state: string
  address: string
  zipCode: string
  internalNotes: string
}

export type TenantEditForm = {
  name: string
  slug: string
  responsibleName: string
  document: string
  phone: string
  whatsapp: string
  city: string
  state: string
  address: string
  zipCode: string
  internalNotes: string
}

export type ResetPasswordForm = {
  newPassword: string
  confirmationPassword: string
}

export type ChangePlanForm = {
  planId: string
  contractedMonthlyPrice: string
  contractedAnnualPrice: string
  contractedSetupFee: string
  internalNotes: string
}

export const initialForm: TenantForm = {
  name: '',
  slug: '',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '123456',
  document: '',
  phone: '',
  whatsapp: '',
  city: '',
  state: '',
  address: '',
  zipCode: '',
  internalNotes: '',
}

export const initialEditForm: TenantEditForm = {
  name: '',
  slug: '',
  responsibleName: '',
  document: '',
  phone: '',
  whatsapp: '',
  city: '',
  state: '',
  address: '',
  zipCode: '',
  internalNotes: '',
}

export const initialResetPasswordForm: ResetPasswordForm = {
  newPassword: '123456',
  confirmationPassword: '',
}

export const initialChangePlanForm: ChangePlanForm = {
  planId: '',
  contractedMonthlyPrice: '',
  contractedAnnualPrice: '',
  contractedSetupFee: '',
  internalNotes: '',
}
