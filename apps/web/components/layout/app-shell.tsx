'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Pizza, X } from 'lucide-react'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { LogoutButton } from '@/components/auth/logout-button'
import { apiFetch } from '@/lib/api'
import { getDashboardSegmentLabel } from '@/lib/segments/segment-registry'
import type { TenantSegment } from '@/lib/segments/segment-types'

import {
  type NavSection,
  type WorkspaceKind,
  workspaceMeta,
} from '@/lib/navigation'

import { cn } from '@/lib/utils'

interface AppShellProps {
  workspace: WorkspaceKind
  sections: NavSection[]
  homeHref: string
  title?: string
  subtitle?: string
  children: React.ReactNode
}

export type DashboardBrand = {
  name: string
  subtitle: string
  logoUrl: string
  slug: string
  segments: TenantSegment[]
}

export function AppShell({
  workspace,
  sections,
  homeHref,
  title,
  subtitle,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const meta = workspaceMeta[workspace]
  const [dashboardBrand, setDashboardBrand] =
    React.useState<DashboardBrand | null>(null)

  const loadDashboardBrand = React.useCallback(async () => {
    if (workspace !== 'dashboard') return

    try {
      const [customization, tenant] = await Promise.all([
        apiFetch<{
          brandName?: string
          logoUrl?: string
        }>('/dashboard-settings/customization'),
        apiFetch<{
          name?: string
          slug?: string
          logoUrl?: string | null
          enabledSegments?: TenantSegment[]
        }>('/tenants/me'),
      ])

      setDashboardBrand({
        name:
          tenant.name ||
          customization.brandName ||
          meta.title,
        subtitle: getDashboardSegmentLabel(tenant.enabledSegments),
        logoUrl:
          customization.logoUrl ||
          tenant.logoUrl ||
          '',
        slug: tenant.slug || 'parada-pizza',
        segments: tenant.enabledSegments || ['PIZZARIA'],
      })

      localStorage.setItem(
        'tenantSegments',
        JSON.stringify(tenant.enabledSegments || ['PIZZARIA']),
      )
    } catch {
      setDashboardBrand(null)
    }
  }, [meta.subtitle, meta.title, workspace])

  React.useEffect(() => {
    loadDashboardBrand()

    window.addEventListener(
      'dashboard-brand-updated',
      loadDashboardBrand,
    )

    return () => {
      window.removeEventListener(
        'dashboard-brand-updated',
        loadDashboardBrand,
      )
    }
  }, [loadDashboardBrand])

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#f6f7fb] text-slate-950">
      <Sidebar
        workspace={workspace}
        sections={sections}
        homeHref={homeHref}
        brand={workspace === 'dashboard' ? dashboardBrand : null}
      />

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sections={sections}
        homeHref={homeHref}
        workspace={workspace}
        brand={workspace === 'dashboard' ? dashboardBrand : null}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <Header
          title={title ?? meta.title}
          subtitle={subtitle ?? meta.subtitle}
          brand={workspace === 'dashboard' ? dashboardBrand : null}
          workspace={workspace}
          onToggleMobileNav={() => setMobileOpen(true)}
          rightSlot={<LogoutButton />}
        />

        <main className="min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

function MobileNav({
  open,
  onClose,
  sections,
  homeHref,
  workspace,
  brand,
}: {
  open: boolean
  onClose: () => void
  sections: NavSection[]
  homeHref: string
  workspace: WorkspaceKind
  brand?: DashboardBrand | null
}) {
  const pathname = usePathname()
  const meta = workspaceMeta[workspace]
  const displayTitle = brand?.name || meta.title
  const displaySubtitle = brand?.subtitle || meta.subtitle

  React.useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="absolute left-0 top-0 flex h-full w-80 flex-col overflow-hidden bg-[#101827] text-white shadow-2xl">
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-lg',
                meta.accent,
              )}
            >
              {brand?.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={displayTitle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Pizza className="h-6 w-6" />
              )}
            </div>

            <div className="leading-tight">
              <p className="text-sm font-black uppercase tracking-wide">
                {displayTitle}
              </p>

              <p className="text-xs text-slate-400">
                {displaySubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {sections.map((section, index) => (
            <ul key={index} className="mb-3 space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const activeItemHref = section.items
                  .filter((currentItem) => {
                    if (currentItem.external) return false
                    if (currentItem.href === homeHref) return pathname === homeHref

                    return (
                      pathname === currentItem.href ||
                      pathname.startsWith(currentItem.href + '/')
                    )
                  })
                  .sort((first, second) => second.href.length - first.href.length)[0]
                  ?.href
                const active = item.href === activeItemHref

                const content = (
                  <>
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        active ? 'text-slate-950' : 'text-slate-400',
                      )}
                    />

                    {item.label}
                  </>
                )

                return (
                  <li key={item.href}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition',
                          'text-slate-300 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        {content}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition',
                          active
                            ? 'bg-yellow-400 text-slate-950 shadow-lg'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          ))}
        </nav>
      </aside>
    </div>
  )
}
