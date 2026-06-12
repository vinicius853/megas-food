'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, CreditCard, FileText, Headphones, LayoutDashboard, Layers3, Menu, Search, Settings, ShieldCheck, Users, UserCog, Wallet, X } from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LogoutButton } from '@/components/auth/logout-button'

const navItems = [
  { label: 'Dashboard', href: '/master', icon: LayoutDashboard },
  { label: 'Clientes', href: '/master/clientes', icon: Users },
  { label: 'Planos', href: '/master/planos', icon: Layers3 },
  { label: 'Cobrancas', href: '/master/cobrancas', icon: CreditCard },
  {
    label: 'Financeiro',
    href: '/master/financeiro',
    icon: Wallet,
    restricted: true,
  },
  { label: 'Suporte', href: '/master/suporte', icon: Headphones },
  { label: 'Usuarios', href: '/master/usuarios', icon: UserCog },
  { label: 'Configuracoes', href: '/master/configuracoes', icon: Settings },
  { label: 'LGPD / Legal', href: '/master/legal', icon: ShieldCheck },
  { label: 'Logs', href: '/master/logs', icon: FileText },
]

const defaultLogo = ''
const logoStorageKey = 'masterLogoUrl'
const masterTenantSlug = 'megastech-master'

type TenantOption = {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
}

export function MasterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [logoUrl, setLogoUrl] = React.useState(defaultLogo)
  const [userName, setUserName] = React.useState('Administrador')
  const [userRole, setUserRole] = React.useState('Master Admin')
  const [rawUserRole, setRawUserRole] = React.useState('MASTER_ADMIN')

  React.useEffect(() => {
    let ignore = false

    async function loadLogo() {
      const localLogo = localStorage.getItem(logoStorageKey) || defaultLogo
      setLogoUrl(localLogo)

      try {
        const tenants = await apiFetch<TenantOption[]>('/tenants')
        const masterTenant = tenants.find((tenant) => tenant.slug === masterTenantSlug)

        if (!masterTenant || ignore) return

        const remoteLogo = masterTenant.logoUrl || defaultLogo
        setLogoUrl(remoteLogo)

        if (remoteLogo) {
          localStorage.setItem(logoStorageKey, remoteLogo)
        } else {
          localStorage.removeItem(logoStorageKey)
        }
      } catch {
        if (!ignore) {
          setLogoUrl(localLogo)
        }
      }
    }

    loadLogo()
    const storedRole = localStorage.getItem('userRole') || 'MASTER_ADMIN'
    setUserName(localStorage.getItem('userName') || 'Administrador')
    setRawUserRole(storedRole)
    setUserRole(getRoleLabel(storedRole))

    function updateLogo(event: Event) {
      const nextLogo = event instanceof CustomEvent && typeof event.detail === 'string' ? event.detail : localStorage.getItem(logoStorageKey) || defaultLogo

      setLogoUrl(nextLogo)
    }

    window.addEventListener('master-logo-updated', updateLogo)

    return () => {
      ignore = true
      window.removeEventListener('master-logo-updated', updateLogo)
    }
  }, [])

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#111827]">
      <MasterSidebar logoUrl={logoUrl} userRole={rawUserRole} open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {mobileOpen ? <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#EAECEF] bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center gap-4 px-4 md:px-8">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAECEF] bg-white text-[#111827] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-lg font-black">Dashboard Master</h1>
              <p className="text-sm font-medium text-[#64748B]">Visao geral da plataforma</p>
            </div>

            <div className="ml-auto hidden h-11 w-full max-w-md items-center gap-3 rounded-2xl border border-[#EAECEF] bg-white px-4 shadow-sm md:flex">
              <Search className="h-4 w-4 text-[#64748B]" />
              <input placeholder="Buscar cliente, pedido, plano..." className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#64748B]" />
              <span className="rounded-lg bg-[#F7F8FA] px-2 py-1 text-xs font-bold text-[#64748B]">⌘ K</span>
            </div>

            <button type="button" className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#EAECEF] bg-white shadow-sm" aria-label="Notificacoes">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF3C00] text-[10px] font-black text-white">2</span>
            </button>

            <div className="hidden items-center gap-3 md:flex">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#FF3C00] via-[#FF6A00] to-[#FFB000] text-sm font-black text-white">{getInitials(userName)}</div>
              <div className="leading-tight">
                <p className="text-sm font-black">{userName}</p>
                <p className="text-xs font-semibold text-[#64748B]">{userRole}</p>
              </div>
            </div>

            <LogoutButton />
          </div>
        </header>

        <main className="min-w-0 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}

function MasterSidebar({ logoUrl, userRole, open, onClose }: { logoUrl: string; userRole: string; open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const canSeeFinancialMenu = userRole === 'MASTER_OWNER' || userRole === 'MASTER_ADMIN' || userRole === 'FINANCE_ADMIN'

  const visibleNavItems = navItems.filter((item) => {
    if ((item.href === '/master/financeiro' || item.href === '/master/cobrancas') && !canSeeFinancialMenu) {
      return false
    }

    return true
  })

  return (
    <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#080808] px-4 py-5 text-white shadow-2xl transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="mb-7 flex items-center justify-between">
        <Link href="/master" className="flex min-h-14 items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Megas Food" className="h-14 w-40 object-contain object-left" />
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF3C00] via-[#FF6A00] to-[#FFB000] text-xl font-black shadow-[0_10px_30px_rgba(255,106,0,0.28)]">M</div>
              <div>
                <p className="text-xl font-black tracking-tight">MEGAS</p>
                <p className="-mt-1 text-lg font-black text-[#FF6A00]">FOOD</p>
              </div>
            </>
          )}
        </Link>

        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 lg:hidden" onClick={onClose} aria-label="Fechar menu">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="space-y-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const active = item.href === '/master' ? pathname === '/master' : pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition', active ? 'bg-gradient-to-r from-[#FF3C00] via-[#FF6A00] to-[#FFB000] text-white shadow-[0_12px_34px_rgba(255,60,0,0.28)]' : 'text-slate-300 hover:bg-white/[0.08] hover:text-white')}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.restricted ? <span className="ml-auto text-[10px] font-black text-[#FFB000]">lock</span> : null}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold text-slate-400">Plano atual</p>
          <p className="mt-2 text-sm font-black uppercase">UNICO PLANO</p>
          <p className="mt-1 text-sm font-black text-[#16A34A]">R$ 150,00 / mes</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#FF3C00] to-[#FF6A00] text-sm font-black">AD</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">Administrador</p>
            <p className="text-xs font-semibold text-slate-400">Master Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    MASTER_OWNER: 'Master Owner',
    MASTER_ADMIN: 'Master Admin',
    FINANCE_ADMIN: 'Financeiro',
    SUPPORT: 'Suporte',
  }

  return labels[role] || 'Master Admin'
}
