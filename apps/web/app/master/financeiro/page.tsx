'use client'

import * as React from 'react'
import { ArrowUpRight, Receipt, Wallet } from 'lucide-react'

import { PageContainer, PageHeader } from '@/components/layout/page-container'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { downloadCsv } from '@/lib/download-csv'
import { canViewFinancialData } from '../components/master-permissions'
import { RestrictedFinancialPanel, RestrictedFinancialValue } from '../components/restricted-financial-value'

const stats = [
  {
    label: 'MRR',
    value: 'R$ 0,00',
    helper: 'Pagamentos ainda nao conectados',
    icon: Wallet,
    accent: 'text-emerald-600 bg-emerald-50',
  },
  {
    label: 'ARR',
    value: 'R$ 0,00',
    helper: 'Sem recorrencia calculada',
    icon: ArrowUpRight,
    accent: 'text-orange-600 bg-orange-50',
  },
  {
    label: 'Inadimplencia',
    value: '0%',
    helper: 'Sem gateway financeiro integrado',
    icon: Receipt,
    accent: 'text-sky-600 bg-sky-50',
  },
]

export default function FinanceiroPage() {
  const [role, setRole] = React.useState<string | null>(null)
  const canViewFinance = canViewFinancialData({ role })

  React.useEffect(() => {
    setRole(localStorage.getItem('userRole') || 'MASTER_ADMIN')
  }, [])

  function handleExport() {
    if (!canViewFinance) {
      return
    }

    downloadCsv(
      'master-financeiro.csv',
      stats.map((stat) => ({
        metrica: stat.label,
        valor: stat.value,
        observacao: stat.helper,
      })),
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Financeiro"
        description="Faturamento e cobrancas da plataforma."
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!canViewFinance}>
            Exportar relatorio
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      <RestrictedFinancialValue value={stat.value} canView={canViewFinance} />
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">{stat.helper}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cobrancas</CardTitle>
          <CardDescription>
            Esta area esta pronta para receber dados reais do gateway financeiro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canViewFinance ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <Badge variant="outline">Sem faturas reais conectadas</Badge>
              <p className="mt-3 max-w-md text-sm text-slate-500">
                Quando a integracao de pagamentos for ligada, as faturas dos clientes aparecerao aqui e o relatorio exportado usara estes dados.
              </p>
            </div>
          ) : (
            <RestrictedFinancialPanel canView={canViewFinance}>
              <div />
            </RestrictedFinancialPanel>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
