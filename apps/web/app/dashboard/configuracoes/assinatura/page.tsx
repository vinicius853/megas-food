'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  MessageCircle,
  ShieldAlert,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'

import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type SubscriptionStatus =
  | 'LEGACY'
  | 'PENDING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCEL_SCHEDULED'
  | 'CANCELED'
  | 'BLOCKED'

type BillingPlan = {
  id: string
  name: string
  slug: string
  monthlyPrice: string | number
  isActive: boolean
}

type MySubscriptionResponse = {
  plan: BillingPlan
  subscription: {
    id: string | null
    status: SubscriptionStatus
    startedAt: string | null
    nextBillingDate: string | null
    canceledAt: string | null
    accessUntil: string | null
    gracePeriodDays: number
    mercadoPagoSubscriptionUrl?: string | null
    mercadoPagoSubscriptionStatus?: string | null
  }
  access: {
    status: SubscriptionStatus
    canAccessDashboard: boolean
    canAcceptOrders: boolean
    accessUntil: string | null
    nextBillingDate: string | null
    message: string | null
  }
  latestPayment: {
    id: string
    paidAt: string | null
    amount: string | number
    paymentMethod: string | null
  } | null
  openInvoice: {
    id: string
    dueDate: string
    status: string
    amount: string | number
    paymentUrl: string | null
    sandboxPaymentUrl: string | null
  } | null
}

const cancelWhatsappNumber = '5524998522102'

const statusLabel: Record<SubscriptionStatus, string> = {
  LEGACY: 'Em ajuste',
  PENDING: 'Pendente',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Em atraso',
  CANCEL_SCHEDULED: 'Cancelamento agendado',
  CANCELED: 'Cancelada',
  BLOCKED: 'Bloqueada',
}

function toNumber(value: unknown) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

function formatMoney(value: unknown) {
  return toNumber(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(value?: string | null) {
  if (!value) return 'Nao informado'

  return new Date(value).toLocaleDateString('pt-BR')
}

function getStatusVariant(status: SubscriptionStatus) {
  if (status === 'ACTIVE' || status === 'LEGACY') return 'success'
  if (status === 'PAST_DUE' || status === 'CANCEL_SCHEDULED') return 'warning'
  if (status === 'BLOCKED' || status === 'CANCELED') return 'danger'

  return 'default'
}

function buildWhatsappUrl(message: string) {
  return `https://wa.me/${cancelWhatsappNumber}?text=${encodeURIComponent(message)}`
}

export default function AssinaturaPage() {
  const [data, setData] = useState<MySubscriptionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadSubscription() {
    try {
      setLoading(true)
      setError('')

      const response = await apiFetch<MySubscriptionResponse>(
        '/billing/my-subscription',
      )

      setData(response)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar assinatura.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscription()
  }, [])

  const status = data?.subscription.status ?? 'PENDING'
  const paymentUrl =
    data?.openInvoice?.paymentUrl ||
    data?.openInvoice?.sandboxPaymentUrl ||
    data?.subscription.mercadoPagoSubscriptionUrl ||
    ''
  const cancelUrl = useMemo(
    () =>
      buildWhatsappUrl(
        'Ola, gostaria de solicitar o cancelamento da minha assinatura Megas Food.',
      ),
    [],
  )
  const updatePaymentUrl = useMemo(
    () =>
      paymentUrl ||
      buildWhatsappUrl(
        'Ola, preciso atualizar o pagamento da minha assinatura Megas Food.',
      ),
    [paymentUrl],
  )

  return (
    <PageContainer>
      <PageHeader
        title="Assinatura"
        description="Acompanhe seu plano, vencimento e status de acesso da Megas Food."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/configuracoes">
              Voltar para configuracoes
            </Link>
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm font-semibold text-slate-500">
            Carregando dados da assinatura...
          </CardContent>
        </Card>
      ) : data ? (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-white to-orange-50/60">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                      <CreditCard className="h-7 w-7" />
                    </div>

                    <CardTitle className="text-3xl">
                      {data.plan.name}
                    </CardTitle>

                    <CardDescription className="mt-2">
                      Plano atual da sua pizzaria na Megas Food.
                    </CardDescription>
                  </div>

                  <Badge variant={getStatusVariant(status)}>
                    {statusLabel[status]}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="grid gap-4 p-6 md:grid-cols-3">
                <InfoTile
                  label="Mensalidade"
                  value={`${formatMoney(data.plan.monthlyPrice)} / mes`}
                />

                <InfoTile
                  label="Proximo vencimento"
                  value={formatDate(data.subscription.nextBillingDate)}
                />

                <InfoTile
                  label="Ultimo pagamento"
                  value={
                    data.latestPayment?.paidAt
                      ? formatDate(data.latestPayment.paidAt)
                      : 'Sem pagamento registrado'
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status da operacao</CardTitle>
                <CardDescription>
                  Como a assinatura impacta o painel e os pedidos online.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-3 md:grid-cols-2">
                <AccessStatusCard
                  title="Acesso ao painel"
                  enabled={data.access.canAccessDashboard}
                  enabledText="Painel liberado"
                  disabledText="Painel bloqueado"
                />

                <AccessStatusCard
                  title="Pedidos no cardapio publico"
                  enabled={data.access.canAcceptOrders}
                  enabledText="Recebendo pedidos"
                  disabledText="Pedidos pausados"
                />

                {data.access.message && (
                  <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                    {data.access.message}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Acoes da assinatura</CardTitle>
                <CardDescription>
                  Use estes atalhos para resolver pagamento ou falar com a Megas Food.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <Button asChild variant="primary" className="w-full justify-center">
                  <a href={updatePaymentUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Atualizar pagamento
                  </a>
                </Button>

                <Button asChild variant="outline" className="w-full justify-center">
                  <a href={cancelUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Solicitar cancelamento
                  </a>
                </Button>

                <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold leading-relaxed text-slate-500">
                  O cancelamento nao remove seu acesso imediatamente. Se aprovado,
                  sua pizzaria continua ativa ate o fim do periodo ja pago.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Politica de atraso</CardTitle>
                <CardDescription>
                  Prazo de tolerancia antes do bloqueio automatico.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <CalendarClock className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-2xl font-black text-slate-950">
                    {data.subscription.gracePeriodDays} dias
                  </p>
                  <p className="text-sm font-semibold text-slate-500">
                    Apos o vencimento, antes do bloqueio.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </PageContainer>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  )
}

function AccessStatusCard({
  title,
  enabled,
  enabledText,
  disabledText,
}: {
  title: string
  enabled: boolean
  enabledText: string
  disabledText: string
}) {
  const Icon = enabled ? CheckCircle2 : ShieldAlert

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className={
            enabled
              ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600'
              : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600'
          }
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-black text-slate-950">{title}</p>
          <p className="text-sm font-semibold text-slate-500">
            {enabled ? enabledText : disabledText}
          </p>
        </div>
      </div>
    </div>
  )
}
