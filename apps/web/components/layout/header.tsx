'use client'

import * as React from 'react'
import Link from 'next/link'
import { ExternalLink, Menu } from 'lucide-react'

import type { WorkspaceKind } from '@/lib/navigation'
import type { DashboardBrand } from './app-shell'

interface HeaderProps {
  title?: string
  subtitle?: string
  onToggleMobileNav?: () => void
  rightSlot?: React.ReactNode
  brand?: DashboardBrand | null
  workspace?: WorkspaceKind
}

export function Header({
  title,
  onToggleMobileNav,
  rightSlot,
  brand,
  workspace = 'dashboard',
}: HeaderProps) {
  const displayTitle = brand?.name || title || 'Megas Food'
  const publicMenuHref = brand?.slug ? `/c/${brand.slug}` : '/c/parada-pizza'

  return (
    <header className="relative z-30 border-b border-slate-200 bg-white">
      <div className="grid h-20 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 md:px-8">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 justify-center">
          <span className="block max-w-full truncate text-sm font-black tracking-tight text-slate-900 md:text-base">
            {displayTitle}
          </span>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2">
          {workspace === 'dashboard' && (
            <Link
              href={publicMenuHref}
              target="_blank"
              className="hidden h-11 items-center gap-2 rounded-2xl border border-orange-200 bg-white px-5 text-sm font-black text-orange-600 transition hover:bg-orange-50 md:flex"
            >
              Ver cardapio publico
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}

          {rightSlot}
        </div>
      </div>
    </header>
  )
}
