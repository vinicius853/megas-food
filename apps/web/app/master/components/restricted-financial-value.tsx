'use client'

import type * as React from 'react'
import { EyeOff, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

type RestrictedFinancialValueProps = {
  value: React.ReactNode
  canView: boolean
  label?: string
  className?: string
}

export function RestrictedFinancialValue({
  value,
  canView,
  label = 'Dados financeiros restritos',
  className,
}: RestrictedFinancialValueProps) {
  if (canView) {
    return <span className={className}>{value}</span>
  }

  // A restricao real tambem deve existir no backend. O frontend apenas protege a visualizacao.
  return (
    <span className={cn('relative inline-flex min-w-36 items-center', className)}>
      <span className="select-none blur-sm">R$ 999.999,99</span>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#111827] shadow-sm">
          <EyeOff className="h-4 w-4" />
        </span>
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function RestrictedFinancialPanel({
  canView,
  children,
}: {
  canView: boolean
  children: React.ReactNode
}) {
  if (canView) return <>{children}</>

  // A restricao real tambem deve existir no backend. O frontend apenas protege a visualizacao.
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl bg-orange-50/60 p-6 text-center">
      <Lock className="h-9 w-9 text-[#FF6A00]" />
      <span className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-black text-[#FF3C00]">
        Acesso restrito
      </span>
      <p className="mt-3 max-w-xs text-sm font-semibold text-[#64748B]">
        Somente usuarios autorizados podem visualizar dados financeiros.
      </p>
      <button
        type="button"
        className="mt-4 rounded-xl border border-[#EAECEF] bg-white px-4 py-2 text-xs font-black text-[#111827] shadow-sm"
      >
        Solicitar acesso
      </button>
    </div>
  )
}
