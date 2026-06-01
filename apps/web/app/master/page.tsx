'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  EyeOff,
  Lock,
  TrendingUp,
  UserX,
  Users,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { canViewFinancialData } from './components/master-permissions'
import {
  RestrictedFinancialPanel,
  RestrictedFinancialValue,
} from './components/restricted-financial-value'

type Tenant = {
  id: string
  name: string
  slug: string
  isActive: boolean
  createdAt: string
}

type BillingClient = {
  id: string
  name: string
  status: 'Ativo' | 'Em atraso' | 'Bloqueado' | 'Cancelado'
  plan: 'Unico Plano'
  monthlyFee: number
  nextDue: string
  lastPayment: string
}

const monthlyFee = 150

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function buildBillingClients(tenants: Tenant[]): BillingClient[] {
  // Mock temporario isolado ate existir endpoint real de cobrancas no Master.
  return tenants.map((tenant, index) => {
    const status: BillingClient['status'] = !tenant.isActive
      ? 'Bloqueado'
      : index % 11 === 3
        ? 'Em atraso'
        : index % 17 === 5
          ? 'Cancelado'
          : 'Ativo'

    return {
      id: tenant.id,
      name: tenant.name,
      status,
      plan: 'Unico Plano',
      monthlyFee,
      nextDue: `${String(8 + (index % 18)).padStart(2, '0')}/06/2026`,
      lastPayment: status === 'Ativo' ? `${String(8 + (index % 15)).padStart(2, '0')}/05/2026` : '-',
    }
  })
}

export default function MasterDashboardPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>([])
  const [loading, setLoading] = React.useState(true)
  const [role, setRole] = React.useState<string | null>(null)

  React.useEffect(() => {
    setRole(localStorage.getItem('userRole'))

    async function load() {
      try {
        const data = await apiFetch<Tenant[]>('/tenants')
        setTenants(data)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const canViewFinance = canViewFinancialData({ role })
  const clients = buildBillingClients(tenants)
  const active = clients.filter((client) => client.status === 'Ativo').length
  const overdue = clients.filter((client) => client.status === 'Em atraso').length
  const blocked = clients.filter((client) => client.status === 'Bloqueado').length
  const canceled = clients.filter((client) => client.status === 'Cancelado').length
  const total = clients.length
  const mrr = active * monthlyFee
  const openRevenue = overdue * monthlyFee
  const nextDueCount = clients.filter((client) => client.status !== 'Cancelado').slice(0, 7).length

  const topCards = [
    { title: 'Clientes ativos', value: active, helper: '+ clientes aptos a vender', icon: Users, tone: 'orange' },
    { title: 'Clientes em atraso', value: overdue, helper: 'requer acompanhamento', icon: Clock, tone: 'red' },
    { title: 'Clientes bloqueados', value: blocked, helper: 'acesso pausado', icon: UserX, tone: 'red' },
    { title: 'Todos os clientes', value: total, helper: loading ? 'carregando...' : 'base total da plataforma', icon: CheckCircle2, tone: 'purple' },
  ]

  const financeCards = [
    { title: 'Receita mensal (MRR)', value: formatMoney(mrr), helper: 'mensalidade recorrente', icon: TrendingUp },
    { title: 'Receita em aberto', value: formatMoney(openRevenue), helper: `${overdue} clientes`, icon: CreditCard },
    { title: 'Proximos vencimentos (7 dias)', value: `${nextDueCount} clientes`, helper: 'acompanhar cobrancas', icon: Calendar },
    { title: 'Valor da mensalidade', value: formatMoney(monthlyFee), helper: 'Unico plano', icon: Lock },
  ]

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {financeCards.map((card) => (
          <FinancialMetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            helper={card.helper}
            icon={card.icon}
            canView={canViewFinance}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr_0.9fr]">
        <DashboardCard title="Receita nos ultimos 6 meses" action="6 meses">
          <RestrictedFinancialPanel canView={canViewFinance}>
            <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-orange-50 to-white p-4">
              <div className="absolute inset-x-4 bottom-8 top-5 grid grid-rows-4">
                {[0, 1, 2, 3].map((line) => (
                  <div key={line} className="border-t border-[#EAECEF]" />
                ))}
              </div>
              <svg viewBox="0 0 520 190" className="relative h-full w-full">
                <defs>
                  <linearGradient id="masterRevenue" x1="0" x2="1">
                    <stop offset="0%" stopColor="#FF3C00" />
                    <stop offset="55%" stopColor="#FF6A00" />
                    <stop offset="100%" stopColor="#FFB000" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="url(#masterRevenue)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="10,150 110,105 210,115 310,75 410,55 510,25"
                />
                {[['Dez', 10], ['Jan', 110], ['Fev', 210], ['Mar', 310], ['Abr', 410], ['Mai', 510]].map(([label, x]) => (
                  <text key={String(label)} x={Number(x)} y="185" textAnchor="middle" className="fill-[#64748B] text-xs font-bold">
                    {label}
                  </text>
                ))}
              </svg>
            </div>
          </RestrictedFinancialPanel>
        </DashboardCard>

        <DashboardCard title="Clientes por status">
          <div className="grid gap-5 md:grid-cols-[160px_1fr] xl:grid-cols-1">
            <div
              className="mx-auto h-36 w-36 rounded-full"
              style={{
                background: `conic-gradient(#16A34A 0 ${percent(active, total)}%, #FF6A00 ${percent(active, total)}% ${percent(active + overdue, total)}%, #FF3C00 ${percent(active + overdue, total)}% ${percent(active + overdue + blocked, total)}%, #CBD5E1 ${percent(active + overdue + blocked, total)}% 100%)`,
              }}
            >
              <div className="grid h-full w-full place-items-center rounded-full p-5">
                <div className="grid h-full w-full place-items-center rounded-full bg-white text-center">
                  <strong>{total}</strong>
                  <span className="text-xs font-bold text-[#64748B]">clientes</span>
                </div>
              </div>
            </div>
            <StatusLegend active={active} overdue={overdue} blocked={blocked} canceled={canceled} total={total} />
          </div>
        </DashboardCard>

        <DashboardCard title="Resumo financeiro">
          <RestrictedFinancialPanel canView={canViewFinance}>
            <div className="space-y-3 text-sm">
              <SummaryRow label="Receita mensal prevista" value={formatMoney(mrr)} />
              <SummaryRow label="Receita recebida" value={formatMoney(mrr - openRevenue)} />
              <SummaryRow label="Receita em aberto" value={formatMoney(openRevenue)} />
              <SummaryRow label="Clientes pagantes" value={active} />
              <SummaryRow label="Clientes em atraso" value={overdue} />
              <SummaryRow label="Clientes bloqueados" value={blocked} />
            </div>
          </RestrictedFinancialPanel>
        </DashboardCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.8fr_0.9fr]">
        <DashboardCard title="Clientes recentes">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#EAECEF] text-left text-xs font-black uppercase text-[#64748B]">
                  <th className="py-3">Cliente</th>
                  <th>Status</th>
                  <th>Plano</th>
                  <th>Mensalidade</th>
                  <th>Proximo vencimento</th>
                  <th>Ultimo pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECEF]">
                {clients.slice(0, 5).map((client) => (
                  <tr key={client.id}>
                    <td className="py-3 font-bold">{client.name}</td>
                    <td><StatusPill status={client.status} /></td>
                    <td>{client.plan}</td>
                    <td><RestrictedFinancialValue value={formatMoney(client.monthlyFee)} canView={canViewFinance} /></td>
                    <td><RestrictedFinancialValue value={client.nextDue} canView={canViewFinance} /></td>
                    <td><RestrictedFinancialValue value={client.lastPayment} canView={canViewFinance} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href="/master/clientes" className="mt-4 inline-flex rounded-xl bg-orange-50 px-4 py-2 text-xs font-black text-[#FF3C00]">
            Ver todos os clientes
          </Link>
        </DashboardCard>

        <DashboardCard title="Atividades recentes" action="Ver todas">
          <div className="space-y-4">
            {[
              ['Novo cliente cadastrado', clients[0]?.name ?? 'Cliente', 'Hoje, 10:24'],
              ['Pagamento aprovado', clients[1]?.name ?? 'Cliente', 'Hoje, 09:15'],
              ['Cliente em atraso', clients.find((client) => client.status === 'Em atraso')?.name ?? 'Cliente', 'Ontem, 23:11'],
              ['Cliente bloqueado', clients.find((client) => client.status === 'Bloqueado')?.name ?? 'Cliente', 'Ontem, 18:45'],
            ].map(([title, client, time], index) => (
              <div key={title} className="flex gap-3">
                <div className={cn('mt-1 flex h-9 w-9 items-center justify-center rounded-full', index === 0 ? 'bg-emerald-50 text-[#16A34A]' : 'bg-orange-50 text-[#FF6A00]')}>
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">{title}</p>
                  <p className="text-xs font-semibold text-[#64748B]">{client}</p>
                </div>
                <span className="text-xs font-semibold text-[#64748B]">{time}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </section>
    </div>
  )
}

function MetricCard({ title, value, helper, icon: Icon, tone }: any) {
  return (
    <div className="rounded-2xl border border-[#EAECEF] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#64748B]">{title}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl text-white', tone === 'purple' ? 'bg-violet-500' : 'bg-gradient-to-r from-[#FF3C00] via-[#FF6A00] to-[#FFB000]')}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold text-[#64748B]">{helper}</p>
    </div>
  )
}

function FinancialMetricCard({ title, value, helper, icon: Icon, canView }: any) {
  return (
    <div className={cn('rounded-2xl border p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]', canView ? 'border-[#EAECEF] bg-white' : 'border-orange-100 bg-orange-50/45')}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#64748B]">{title}</p>
          <p className="mt-2 text-2xl font-black">
            <RestrictedFinancialValue value={value} canView={canView} />
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#FF3C00] shadow-sm">
          {canView ? <Icon className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold text-[#64748B]">
        {canView ? helper : 'Dados financeiros restritos'}
      </p>
    </div>
  )
}

function DashboardCard({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#EAECEF] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-black">{title}</h2>
        {action ? <span className="text-xs font-black text-[#FF3C00]">{action}</span> : null}
      </div>
      {children}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#F7F8FA] px-3 py-2">
      <span className="font-semibold text-[#64748B]">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function StatusPill({ status }: { status: BillingClient['status'] }) {
  const classes = {
    Ativo: 'bg-emerald-50 text-[#16A34A]',
    'Em atraso': 'bg-orange-50 text-[#FF6A00]',
    Bloqueado: 'bg-red-50 text-[#FF3C00]',
    Cancelado: 'bg-slate-100 text-[#64748B]',
  }

  return <span className={cn('rounded-full px-2.5 py-1 text-xs font-black', classes[status])}>{status}</span>
}

function StatusLegend({ active, overdue, blocked, canceled, total }: { active: number; overdue: number; blocked: number; canceled: number; total: number }) {
  return (
    <div className="space-y-2 text-sm">
      <LegendRow color="#16A34A" label="Ativos" value={`${active} (${percent(active, total)}%)`} />
      <LegendRow color="#FF6A00" label="Em atraso" value={`${overdue} (${percent(overdue, total)}%)`} />
      <LegendRow color="#FF3C00" label="Bloqueados" value={`${blocked} (${percent(blocked, total)}%)`} />
      <LegendRow color="#CBD5E1" label="Cancelados" value={`${canceled} (${percent(canceled, total)}%)`} />
    </div>
  )
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 font-bold">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-semibold text-[#64748B]">{value}</span>
    </div>
  )
}

function percent(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}
