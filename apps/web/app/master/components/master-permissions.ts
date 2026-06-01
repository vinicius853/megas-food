'use client'

type UserLike = {
  role?: string | null
  permissions?: string[] | null
}

export function canViewFinancialData(user?: UserLike | null) {
  const role = user?.role ?? ''

  return (
    role === 'MASTER_ADMIN' ||
    role === 'MASTER_OWNER' ||
    role === 'FINANCE_ADMIN' ||
    Boolean(user?.permissions?.includes('VIEW_FINANCIAL_DATA'))
  )
}

export function hasPermission(
  permission: string,
  user?: UserLike | null,
) {
  const role = user?.role ?? ''

  if (role === 'MASTER_OWNER' || role === 'MASTER_ADMIN') {
    return true
  }

  return Boolean(user?.permissions?.includes(permission))
}

export function getStoredPermissions() {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(localStorage.getItem('userPermissions') || '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}
