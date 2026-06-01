'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

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

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Tenant = {
  id: string
  name: string
  slug: string
  phone?: string | null
  whatsapp?: string | null
  logoUrl?: string | null
  isActive: boolean
}

type OpeningHourRange = {
  enabled?: boolean
  open: string
  close: string
}

type DeliveryOpeningHours = {
  monday?: OpeningHourRange
  tuesday?: OpeningHourRange
  wednesday?: OpeningHourRange
  thursday?: OpeningHourRange
  friday?: OpeningHourRange
  weekday?: OpeningHourRange
  saturday?: OpeningHourRange
  sunday?: OpeningHourRange
}

type DeliverySettings = {
  isDeliveryOpen?: boolean
  openingHours?: DeliveryOpeningHours
}

const fallbackOpeningHours: Required<DeliveryOpeningHours> = {
  monday: { enabled: true, open: '18:00', close: '23:30' },
  tuesday: { enabled: true, open: '18:00', close: '23:30' },
  wednesday: { enabled: true, open: '18:00', close: '23:30' },
  thursday: { enabled: true, open: '18:00', close: '23:30' },
  friday: { enabled: true, open: '18:00', close: '23:30' },
  weekday: { enabled: true, open: '18:00', close: '23:30' },
  saturday: { enabled: true, open: '18:00', close: '23:30' },
  sunday: { enabled: true, open: '18:00', close: '23:30' },
}

function timeToMinutes(value?: string) {
  const [hours, minutes] = String(value ?? '')
    .split(':')
    .map((part) => Number(part))

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0

  return hours * 60 + minutes
}

function getTodayOpeningRange(openingHours?: DeliveryOpeningHours) {
  const day = new Date().getDay()

  if (day === 1) return openingHours?.monday ?? openingHours?.weekday ?? fallbackOpeningHours.monday
  if (day === 2) return openingHours?.tuesday ?? openingHours?.weekday ?? fallbackOpeningHours.tuesday
  if (day === 3) return openingHours?.wednesday ?? openingHours?.weekday ?? fallbackOpeningHours.wednesday
  if (day === 4) return openingHours?.thursday ?? openingHours?.weekday ?? fallbackOpeningHours.thursday
  if (day === 5) return openingHours?.friday ?? openingHours?.weekday ?? fallbackOpeningHours.friday
  if (day === 0) return openingHours?.sunday ?? fallbackOpeningHours.sunday
  if (day === 6) return openingHours?.saturday ?? fallbackOpeningHours.saturday

  return fallbackOpeningHours.weekday
}

function isOpenNow(delivery?: DeliverySettings | null) {
  if (delivery?.isDeliveryOpen === false) return false

  const range = getTodayOpeningRange(delivery?.openingHours)

  if (range.enabled === false) return false

  const openMinutes = timeToMinutes(range.open)
  const closeMinutes = timeToMinutes(range.close)
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
  }

  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes
}

export default function ConfiguracoesPizzariaPage() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [delivery, setDelivery] = useState<DeliverySettings | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadTenant() {
    try {
      setLoading(true)
      setError('')
      setMessage('')

      const [tenant, deliverySettings] = await Promise.all([
        apiFetch<Tenant>('/tenants/me'),
        apiFetch<DeliverySettings>('/dashboard-settings/delivery'),
      ])

      setName(tenant.name || '')
      setSlug(tenant.slug || '')
      setPhone(tenant.phone || '')
      setWhatsapp(tenant.whatsapp || '')
      setDelivery({
        ...deliverySettings,
        openingHours: {
          ...fallbackOpeningHours,
          ...(deliverySettings.openingHours ?? {}),
        },
      })
    } catch (err: any) {
      setError(
        err.message ||
          'Erro ao carregar configurações.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      if (!name.trim()) {
        throw new Error(
          'Informe o nome da pizzaria.',
        )
      }

      if (!slug.trim()) {
        throw new Error(
          'Informe o slug do cardápio.',
        )
      }

      const updatedTenant =
        await apiFetch<Tenant>(
          '/tenants/me',
          {
            method: 'PATCH',
            body: JSON.stringify({
              name: name.trim(),
              slug: slug.trim(),
              phone:
                phone.trim() || undefined,
              whatsapp:
                whatsapp.trim() ||
                undefined,
            }),
          },
        )

      localStorage.setItem(
        'tenantName',
        updatedTenant.name,
      )

      localStorage.setItem(
        'tenantSlug',
        updatedTenant.slug,
      )

      window.dispatchEvent(new Event('dashboard-brand-updated'))

      setMessage(
        'Configurações salvas com sucesso.',
      )
    } catch (err: any) {
      setError(
        err.message ||
          'Erro ao salvar configurações.',
      )
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadTenant()
  }, [])

  const openNow = useMemo(() => isOpenNow(delivery), [delivery])
  const currentRange = useMemo(
    () => getTodayOpeningRange(delivery?.openingHours),
    [delivery?.openingHours],
  )

  return (
    <PageContainer size="narrow">
      <PageHeader
        title="Configurações"
        description="Dados e preferências da sua pizzaria."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              Dados da pizzaria
            </CardTitle>

            <CardDescription>
              Informações exibidas no
              cardápio público e nos
              pedidos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">
                Carregando
                configurações...
              </p>
            ) : (
              <>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Nome
                  </label>

                  <Input
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value,
                      )
                    }
                    placeholder="Ex: Pizzaria Bella Napoli"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Slug do cardápio
                    público
                  </label>

                  <Input
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value,
                      )
                    }
                    placeholder="ex: bella-napoli"
                  />

                  <p className="text-xs text-slate-500">
                    URL: /c/
                    {slug ||
                      'sua-pizzaria'}
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Telefone
                  </label>

                  <Input
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value,
                      )
                    }
                    placeholder="Ex: (24) 99999-9999"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    WhatsApp para
                    receber pedidos
                  </label>

                  <Input
                    value={whatsapp}
                    onChange={(e) =>
                      setWhatsapp(
                        e.target.value,
                      )
                    }
                    placeholder="Ex: 24999999999"
                  />

                  <p className="text-xs text-slate-500">
                    Use DDD + número.
                    Ex: 24999999999.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>
                  Horários de
                  funcionamento
                </CardTitle>

                <CardDescription>
                  Quando o cardápio
                  aceita pedidos.
                </CardDescription>
              </div>

              <Badge variant={openNow ? 'success' : 'warning'}>
                {openNow ? 'Aberto agora' : 'Fechado agora'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">
                Carregando horarios...
              </p>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <ScheduleSummaryItem
                    label="Segunda"
                    range={delivery?.openingHours?.monday ?? delivery?.openingHours?.weekday}
                  />
                  <ScheduleSummaryItem
                    label="Terca"
                    range={delivery?.openingHours?.tuesday ?? delivery?.openingHours?.weekday}
                  />
                  <ScheduleSummaryItem
                    label="Quarta"
                    range={delivery?.openingHours?.wednesday ?? delivery?.openingHours?.weekday}
                  />
                  <ScheduleSummaryItem
                    label="Quinta"
                    range={delivery?.openingHours?.thursday ?? delivery?.openingHours?.weekday}
                  />
                  <ScheduleSummaryItem
                    label="Sexta"
                    range={delivery?.openingHours?.friday ?? delivery?.openingHours?.weekday}
                  />
                  <ScheduleSummaryItem
                    label="Sabado"
                    range={delivery?.openingHours?.saturday}
                  />
                  <ScheduleSummaryItem
                    label="Domingo"
                    range={delivery?.openingHours?.sunday}
                  />
                </div>

                <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                  <p>
                    Hoje:{' '}
                    <strong className="text-slate-950">
                      {currentRange.enabled === false
                        ? 'Fechado'
                        : `${currentRange.open} - ${currentRange.close}`}
                    </strong>
                  </p>

                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/entregas">
                      Editar horarios
                    </Link>
                  </Button>
                </div>
              </>
            )}
            <p className="hidden text-sm text-slate-500">
              Configuração detalhada
              será adicionada em etapa
              futura.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Assinatura
            </CardTitle>

            <CardDescription>
              Acompanhe seu plano, vencimento, status de acesso e suporte de cancelamento.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-3 rounded-b-3xl md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Plano Megas Food
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                R$ 150,00 / mes
              </p>
            </div>

            <Button asChild variant="outline">
              <Link href="/dashboard/configuracoes/assinatura">
                Gerenciar assinatura
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={loadTenant}
            disabled={loading || saving}
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving
              ? 'Salvando...'
              : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}

function ScheduleSummaryItem({
  label,
  range,
}: {
  label: string
  range?: OpeningHourRange
}) {
  const safeRange = range ?? { enabled: true, open: '18:00', close: '23:30' }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-base font-black text-slate-950">
        {safeRange.enabled === false
          ? 'Fechado'
          : `${safeRange.open} - ${safeRange.close}`}
      </p>
    </div>
  )
}
