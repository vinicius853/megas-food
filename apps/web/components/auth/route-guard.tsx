'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

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
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('userRole')

    if (!token || !role) {
      router.replace('/login')
      return
    }

    const isMaster = MASTER_ROLES.includes(role)

    if (area === 'master' && !isMaster) {
      router.replace('/dashboard')
      return
    }

    if (area === 'dashboard' && isMaster) {
      router.replace('/master')
      return
    }

    setAllowed(true)
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
