'use client'

import { LogOut } from 'lucide-react'

import { clearAuthSession } from '@/lib/auth-session'
import { cn } from '@/lib/utils'

type LogoutButtonProps = {
  className?: string
  showLabel?: boolean
}

export function LogoutButton({
  className,
  showLabel = true,
}: LogoutButtonProps) {
  function handleLogout() {
    clearAuthSession()
    window.location.replace('/login')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      title="Sair"
      aria-label="Sair"
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600',
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      {showLabel && <span>Sair</span>}
    </button>
  )
}
