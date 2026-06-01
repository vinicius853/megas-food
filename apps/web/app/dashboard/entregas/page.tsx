'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  MapPin,
  Plus,
  Save,
  Trash2,
  Truck,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'

type DeliveryZone = {
  id: string
  name: string
  fee: number
  eta: string
  isActive: boolean
}

type OpeningHourRange = {
  enabled?: boolean
  open: string
  close: string
}

type DeliveryOpeningHours = {
  monday: OpeningHourRange
  tuesday: OpeningHourRange
  wednesday: OpeningHourRange
  thursday: OpeningHourRange
  friday: OpeningHourRange
  saturday: OpeningHourRange
  sunday: OpeningHourRange
  weekday?: OpeningHourRange
}

type DeliverySettings = {
  isDeliveryOpen: boolean
  city: string
  state: string
  storeCep: string
  storeAddress: string
  whatsapp: string
  zones: DeliveryZone[]
  openingHours: DeliveryOpeningHours
}

const fallbackSettings: DeliverySettings = {
  isDeliveryOpen: true,
  city: 'Barra Mansa',
  state: 'RJ',
  storeCep: '27320-360',
  storeAddress: 'Rua Presidente Tancredo Neves, 1105 - Vista Alegre',
  whatsapp: '24998508308',
  zones: [
    { id: 'centro', name: 'Centro', fee: 5, eta: '30-40 min', isActive: true },
    { id: 'vista-alegre', name: 'Vista Alegre', fee: 6, eta: '35-45 min', isActive: true },
    { id: 'ano-bom', name: 'Ano Bom', fee: 7, eta: '40-50 min', isActive: true },
    { id: 'saudade', name: 'Saudade', fee: 8, eta: '45-55 min', isActive: true },
    { id: 'santa-clara', name: 'Santa Clara', fee: 6, eta: '35-45 min', isActive: false },
  ],
  openingHours: {
    monday: { enabled: true, open: '18:00', close: '23:30' },
    tuesday: { enabled: true, open: '18:00', close: '23:30' },
    wednesday: { enabled: true, open: '18:00', close: '23:30' },
    thursday: { enabled: true, open: '18:00', close: '23:30' },
    friday: { enabled: true, open: '18:00', close: '23:30' },
    saturday: { enabled: true, open: '18:00', close: '23:30' },
    sunday: { enabled: true, open: '18:00', close: '23:30' },
  },
}

const tabs = ['Areas de entrega', 'Horarios de funcionamento', 'Configuracoes']

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeOpeningHours(
  openingHours?: Partial<DeliveryOpeningHours>,
): DeliveryOpeningHours {
  const weekday = openingHours?.weekday

  return {
    monday: {
      ...fallbackSettings.openingHours.monday,
      ...(weekday ?? {}),
      ...(openingHours?.monday ?? {}),
    },
    tuesday: {
      ...fallbackSettings.openingHours.tuesday,
      ...(weekday ?? {}),
      ...(openingHours?.tuesday ?? {}),
    },
    wednesday: {
      ...fallbackSettings.openingHours.wednesday,
      ...(weekday ?? {}),
      ...(openingHours?.wednesday ?? {}),
    },
    thursday: {
      ...fallbackSettings.openingHours.thursday,
      ...(weekday ?? {}),
      ...(openingHours?.thursday ?? {}),
    },
    friday: {
      ...fallbackSettings.openingHours.friday,
      ...(weekday ?? {}),
      ...(openingHours?.friday ?? {}),
    },
    saturday: {
      ...fallbackSettings.openingHours.saturday,
      ...(openingHours?.saturday ?? {}),
    },
    sunday: {
      ...fallbackSettings.openingHours.sunday,
      ...(openingHours?.sunday ?? {}),
    },
  }
}

export default function EntregasPage() {
  const [settings, setSettings] = useState<DeliverySettings>(fallbackSettings)
  const [tenantSlug, setTenantSlug] = useState('parada-pizza')
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const summary = useMemo(() => {
    const activeZones = settings.zones.filter((zone) => zone.isActive)
    const inactiveZones = settings.zones.filter((zone) => !zone.isActive)
    const fees = activeZones.map((zone) => zone.fee)

    return {
      activeCount: activeZones.length,
      inactiveCount: inactiveZones.length,
      minFee: fees.length ? Math.min(...fees) : 0,
      maxFee: fees.length ? Math.max(...fees) : 0,
      etaRange: activeZones.length ? '35 - 55 min' : 'Sem entregas',
    }
  }, [settings.zones])

  async function loadSettings() {
    try {
      setLoading(true)
      setError('')
      setMessage('')

      const [delivery, tenant] = await Promise.all([
        apiFetch<DeliverySettings>('/dashboard-settings/delivery'),
        apiFetch<{ slug: string }>('/tenants/me'),
      ])

      setSettings({
        ...fallbackSettings,
        ...delivery,
        zones: delivery.zones?.length ? delivery.zones : fallbackSettings.zones,
        openingHours: normalizeOpeningHours(delivery.openingHours),
      })
      setTenantSlug(tenant.slug || 'parada-pizza')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar entregas.')
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      await apiFetch('/dashboard-settings/delivery', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })

      setMessage('Configuracoes de entrega salvas com sucesso.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar entregas.')
    } finally {
      setSaving(false)
    }
  }

  function updateField(field: keyof DeliverySettings, value: string | boolean) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateZone(id: string, patch: Partial<DeliveryZone>) {
    setSettings((current) => ({
      ...current,
      zones: current.zones.map((zone) =>
        zone.id === id ? { ...zone, ...patch } : zone,
      ),
    }))
  }

  function updateOpeningHours(
    key: keyof Omit<DeliveryOpeningHours, 'weekday'>,
    patch: Partial<OpeningHourRange>,
  ) {
    setSettings((current) => ({
      ...current,
      openingHours: {
        ...current.openingHours,
        [key]: {
          ...current.openingHours[key],
          ...patch,
        },
      },
    }))
  }

  function addZone() {
    setSettings((current) => ({
      ...current,
      zones: [
        ...current.zones,
        {
          id: crypto.randomUUID(),
          name: 'Novo bairro',
          fee: 5,
          eta: '35-45 min',
          isActive: true,
        },
      ],
    }))
  }

  function removeZone(id: string) {
    setSettings((current) => ({
      ...current,
      zones: current.zones.filter((zone) => zone.id !== id),
    }))
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title="Entregas"
        description="Gerencie suas areas de entrega, taxas e horarios de funcionamento."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/c/${tenantSlug}`} target="_blank">
                <Eye className="h-4 w-4" />
                Ver cardapio publico
              </Link>
            </Button>

            <Button onClick={saveSettings} disabled={saving || loading} variant="primary" size="sm">
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar alteracoes'}
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      )}

      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto_auto_auto_auto] lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-600">
                <Truck className="h-8 w-8" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-emerald-600">
                    {settings.isDeliveryOpen ? 'Entregas ativas' : 'Entregas fechadas'}
                  </h2>
                  <Badge variant={settings.isDeliveryOpen ? 'success' : 'warning'}>
                    {settings.isDeliveryOpen ? 'Recebendo pedidos' : 'Pausado'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {settings.isDeliveryOpen
                    ? 'Sua pizzaria esta recebendo pedidos para entrega.'
                    : 'Pedidos para entrega estao temporariamente pausados.'}
                </p>
              </div>
            </div>

            <StatusMetric icon={MapPin} value={summary.activeCount} label="Bairros atendidos" />
            <StatusMetric icon={CheckCircle2} value={`${formatMoney(summary.minFee)} - ${formatMoney(summary.maxFee)}`} label="Taxa de entrega" />
            <StatusMetric icon={Clock} value={summary.etaRange} label="Tempo medio" />

            <Button
              variant={settings.isDeliveryOpen ? 'outline' : 'primary'}
              onClick={() => updateField('isDeliveryOpen', !settings.isDeliveryOpen)}
            >
              {settings.isDeliveryOpen ? 'Fechar entregas' : 'Abrir entregas'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-5 py-4 text-sm font-black transition ${
              activeTab === tab
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div>
          {activeTab === 'Areas de entrega' && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Areas de entrega</CardTitle>
                    <CardDescription>
                      Gerencie bairros atendidos pela sua pizzaria e os valores de frete.
                    </CardDescription>
                  </div>

                  <Button onClick={addZone} variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                    Adicionar bairro
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {settings.zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1.2fr_150px_150px_auto_auto] lg:items-center"
                  >
                    <Input
                      value={zone.name}
                      onChange={(event) => updateZone(zone.id, { name: event.target.value })}
                      aria-label="Nome do bairro"
                    />

                    <FeeInput
                      value={zone.fee}
                      onChange={(fee) => updateZone(zone.id, { fee })}
                    />

                    <Input
                      value={zone.eta}
                      onChange={(event) => updateZone(zone.id, { eta: event.target.value })}
                      aria-label="Tempo estimado"
                    />

                    <button
                      type="button"
                      onClick={() => updateZone(zone.id, { isActive: !zone.isActive })}
                      className={`rounded-2xl px-4 py-3 text-xs font-black transition ${
                        zone.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {zone.isActive ? 'Ativo' : 'Inativo'}
                    </button>

                    <div className="flex gap-2">
                      <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500">
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => removeZone(zone.id)}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-100 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'Horarios de funcionamento' && (
            <ScheduleCard
              openingHours={settings.openingHours}
              updateOpeningHours={updateOpeningHours}
            />
          )}
          {activeTab === 'Configuracoes' && <DeliveryOptionsCard />}
        </div>

        <aside className="space-y-5">
          <DeliveryInfoCard settings={settings} updateField={updateField} />
          <DeliverySummaryCard summary={summary} />
        </aside>
      </div>
    </PageContainer>
  )
}

function StatusMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof MapPin
  value: string | number
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-black text-slate-950">{value}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function DeliveryInfoCard({
  settings,
  updateField,
}: {
  settings: DeliverySettings
  updateField: (field: keyof DeliverySettings, value: string | boolean) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacoes da entrega</CardTitle>
        <CardDescription>Dados usados no atendimento ao cliente.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <LabeledInput label="Cidade" value={settings.city} onChange={(value) => updateField('city', value)} />
        <LabeledInput label="Estado" value={settings.state} onChange={(value) => updateField('state', value)} />
        <LabeledInput label="CEP da loja" value={settings.storeCep} onChange={(value) => updateField('storeCep', value)} />
        <LabeledInput label="Endereco da loja" value={settings.storeAddress} onChange={(value) => updateField('storeAddress', value)} />
        <LabeledInput label="WhatsApp para pedidos" value={settings.whatsapp} onChange={(value) => updateField('whatsapp', value)} />
      </CardContent>
    </Card>
  )
}

function DeliverySummaryCard({
  summary,
}: {
  summary: {
    activeCount: number
    inactiveCount: number
    minFee: number
    maxFee: number
    etaRange: string
  }
}) {
  return (
    <Card className="bg-gradient-to-br from-orange-50 to-white">
      <CardHeader>
        <CardTitle>Resumo das entregas</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <SummaryRow label="Bairros ativos" value={summary.activeCount} />
        <SummaryRow label="Bairros inativos" value={summary.inactiveCount} />
        <SummaryRow label="Menor taxa de entrega" value={formatMoney(summary.minFee)} />
        <SummaryRow label="Maior taxa de entrega" value={formatMoney(summary.maxFee)} />
        <SummaryRow label="Tempo medio de entrega" value={summary.etaRange} />
      </CardContent>
    </Card>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-500">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function formatFeeInput(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function FeeInput({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState(formatFeeInput(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setDraft(formatFeeInput(value))
    }
  }, [focused, value])

  function handleChange(nextValue: string) {
    setDraft(nextValue)

    if (!nextValue.trim()) {
      onChange(0)
      return
    }

    onChange(parseMoney(nextValue))
  }

  return (
    <Input
      value={draft}
      onFocus={(event) => {
        setFocused(true)
        event.currentTarget.select()
      }}
      onBlur={() => {
        setFocused(false)
        setDraft(formatFeeInput(value))
      }}
      onChange={(event) => handleChange(event.target.value)}
      inputMode="decimal"
      placeholder="0,00"
      aria-label="Taxa de entrega"
    />
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <strong className="text-slate-950">{value}</strong>
    </div>
  )
}

function ScheduleCard({
  openingHours,
  updateOpeningHours,
}: {
  openingHours: DeliveryOpeningHours
  updateOpeningHours: (
    key: keyof Omit<DeliveryOpeningHours, 'weekday'>,
    patch: Partial<OpeningHourRange>,
  ) => void
}) {
  const days: Array<{
    key: keyof Omit<DeliveryOpeningHours, 'weekday'>
    label: string
  }> = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terca-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sabado' },
    { key: 'sunday', label: 'Domingo' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horarios de funcionamento</CardTitle>
        <CardDescription>
          Configure quando sua pizzaria aceita pedidos de entrega.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {days.map((day) => (
          <div
            key={day.key}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">{day.label}</p>
              <button
                type="button"
                onClick={() =>
                  updateOpeningHours(day.key, {
                    enabled: openingHours[day.key].enabled === false,
                  })
                }
                className={`rounded-full px-3 py-1 text-xs font-black transition ${
                  openingHours[day.key].enabled === false
                    ? 'bg-slate-200 text-slate-500'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {openingHours[day.key].enabled === false ? 'Fechado' : 'Aberto'}
              </button>
            </div>
            <div
              className={`mt-3 grid grid-cols-2 gap-2 ${
                openingHours[day.key].enabled === false ? 'opacity-45' : ''
              }`}
            >
              <Input
                type="time"
                value={openingHours[day.key].open}
                disabled={openingHours[day.key].enabled === false}
                onChange={(event) =>
                  updateOpeningHours(day.key, { open: event.target.value })
                }
              />
              <Input
                type="time"
                value={openingHours[day.key].close}
                disabled={openingHours[day.key].enabled === false}
                onChange={(event) =>
                  updateOpeningHours(day.key, { close: event.target.value })
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function DeliveryOptionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracoes</CardTitle>
        <CardDescription>
          Ajustes simples para deixar a operacao clara para o cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {['Mostrar tempo estimado no checkout', 'Aplicar taxa por bairro automaticamente', 'Permitir retirada no balcao'].map((option) => (
          <label key={option} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700">
            {option}
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-orange-600" />
          </label>
        ))}
      </CardContent>
    </Card>
  )
}
