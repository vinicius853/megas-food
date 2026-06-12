export const AUTH_SESSION_CHANGED_EVENT = 'auth-session-changed'

const AUTH_STORAGE_KEYS = [
  'token',
  'tenantId',
  'tenantSlug',
  'tenantName',
  'tenantSegments',
  'userName',
  'userRole',
  'userPermissions',
] as const

export function clearAuthSession() {
  if (typeof window === 'undefined') return

  for (const key of AUTH_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  }

  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}

export function hasValidAuthSession() {
  if (typeof window === 'undefined') return false

  const token = window.localStorage.getItem('token')
  const role = window.localStorage.getItem('userRole')

  if (!token || !role) return false

  const expiresAt = getTokenExpiration(token)

  if (expiresAt !== null && expiresAt <= Date.now()) {
    clearAuthSession()
    return false
  }

  return true
}

function getTokenExpiration(token: string) {
  try {
    const payload = token.split('.')[1]

    if (!payload) return null

    const normalized = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const decoded = JSON.parse(window.atob(normalized)) as { exp?: unknown }

    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}
