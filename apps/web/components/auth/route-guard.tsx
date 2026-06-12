'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import {
  AUTH_SESSION_CHANGED_EVENT,
  hasValidAuthSession,
} from '@/lib/auth-session'

type RouteGuardProps = {
  area: 'master' | 'dashboard'
  children: React.ReactNode
}

const MASTER_ROLES = ['MASTER_OWNER', 'MASTER_ADMIN']

export function RouteGuard({ area, children }: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    function validateAccess() {
      setAllowed(false)

      if (!hasValidAuthSession()) {
        router.replace('/login')
        return
      }

      const role = localStorage.getItem('userRole')
      const isMaster = role ? MASTER_ROLES.includes(role) : false

      if (area === 'master' && !isMaster) {
        router.replace('/dashboard')
        return
      }

      if (area === 'dashboard' && isMaster) {
        router.replace('/master')
        return
      }

      setAllowed(true)
    }

    validateAccess()
    window.addEventListener('pageshow', validateAccess)
    window.addEventListener('storage', validateAccess)
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, validateAccess)

    return () => {
      window.removeEventListener('pageshow', validateAccess)
      window.removeEventListener('storage', validateAccess)
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, validateAccess)
    }
  }, [area, pathname, router])

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Verificando acesso...</p>
      </main>
    )
  }

  return <>{children}</>
}
