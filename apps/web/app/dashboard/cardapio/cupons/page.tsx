'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Percent,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'

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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api'

type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT'

type Coupon = {
  id: string
  code: string
  type: CouponType
  value: string | number
  minimumOrderValue?: string | number | null
  startsAt?: string | null
  expiresAt?: string | null
  isActive: boolean
}

type CouponForm = {
  code: string
  type: CouponType
  value: string
  minimumOrderValue: string
  startsAt: string
  expiresAt: string
  isActive: boolean
}

const emptyForm: CouponForm = {
  code: '',
  type: 'PERCENTAGE',
  value: '',
  minimumOrderValue: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
}

function parseMoneyInput(value: string) {
  if (!value.trim()) return undefined

  const parsed = Number(
    value
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.'),
  )

  return Number.isFinite(parsed) ? parsed : undefined
}

function formatMoney(value: string | number | null | undefined) {
  return Number(value ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDateInput(value?: string | null) {
  if (!value) return ''

  return new Date(value).toISOString().slice(0, 10)
}

function couponValueLabel(coupon: Coupon) {
  if (coupon.type === 'PERCENTAGE') {
    return `${Number(coupon.value).toLocaleString('pt-BR')}%`
  }

  return formatMoney(coupon.value)
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [form, setForm] = useState<CouponForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const activeCoupons = useMemo(
    () => coupons.filter((coupon) => coupon.isActive).length,
    [coupons],
  )

  async function loadCoupons() {
    try {
      setLoading(true)
      setError('')

      const data = await apiFetch<Coupon[]>('/coupons')
      setCoupons(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cupons.')
    } finally {
      setLoading(false)
    }
  }

  async function saveCoupon() {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      const value = parseMoneyInput(form.value)

      if (!form.code.trim()) {
        throw new Error('Informe o codigo do cupom.')
      }

      if (!value || value <= 0) {
        throw new Error('Informe um desconto valido.')
      }

      const payload = {
        code: form.code.trim(),
        type: form.type,
        value,
        minimumOrderValue: parseMoneyInput(form.minimumOrderValue),
        startsAt: form.startsAt ? `${form.startsAt}T00:00:00.000Z` : undefined,
        expiresAt: form.expiresAt ? `${form.expiresAt}T23:59:59.999Z` : undefined,
        isActive: form.isActive,
      }

      if (editingId) {
        await apiFetch(`/coupons/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/coupons', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      setForm(emptyForm)
      setEditingId(null)
      setMessage(editingId ? 'Cupom atualizado.' : 'Cupom criado.')
      await loadCoupons()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cupom.')
    } finally {
      setSaving(false)
    }
  }

  async function removeCoupon(id: string) {
    if (!confirm('Deseja excluir este cupom?')) return

    try {
      setError('')
      setMessage('')
      await apiFetch(`/coupons/${id}`, { method: 'DELETE' })
      setMessage('Cupom excluido.')
      await loadCoupons()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir cupom.')
    }
  }

  function editCoupon(coupon: Coupon) {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value).replace('.', ','),
      minimumOrderValue: coupon.minimumOrderValue
        ? String(coupon.minimumOrderValue).replace('.', ',')
        : '',
      startsAt: formatDateInput(coupon.startsAt),
      expiresAt: formatDateInput(coupon.expiresAt),
      isActive: coupon.isActive,
    })
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  return (
    <PageContainer size="full">
      <PageHeader
        title="Cupons de desconto"
        description="Crie cupons seguros para o cardapio publico. O desconto sempre sera validado no backend."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/cardapio">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao cardapio
            </Link>
          </Button>
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

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar cupom' : 'Novo cupom'}</CardTitle>
            <CardDescription>
              Use codigos simples, como PIZZA10 ou FRETE5.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-600">
                Codigo
              </span>
              <Input
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="PIZZA10"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({ ...current, type: 'PERCENTAGE' }))
                }
                className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                  form.type === 'PERCENTAGE'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Percentual
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({ ...current, type: 'FIXED_AMOUNT' }))
                }
                className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                  form.type === 'FIXED_AMOUNT'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Valor fixo
              </button>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-600">
                Desconto {form.type === 'PERCENTAGE' ? '(%)' : '(R$)'}
              </span>
              <Input
                value={form.value}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    value: event.target.value,
                  }))
                }
                placeholder={form.type === 'PERCENTAGE' ? '10' : '5,00'}
                inputMode="decimal"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-600">
                Pedido minimo opcional
              </span>
              <Input
                value={form.minimumOrderValue}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    minimumOrderValue: event.target.value,
                  }))
                }
                placeholder="Ex: 50,00"
                inputMode="decimal"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-600">
                  Inicio
                </span>
                <Input
                  type="date"
                  value={form.startsAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startsAt: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-600">
                  Validade
                </span>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      expiresAt: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              Cupom ativo
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="h-5 w-5 accent-orange-600"
              />
            </label>

            <div className="flex gap-2">
              <Button
                onClick={saveCoupon}
                disabled={saving}
                variant="primary"
                className="flex-1"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar cupom'}
              </Button>

              {editingId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null)
                    setForm(emptyForm)
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <MiniCouponStat icon={Percent} label="Cupons" value={coupons.length} />
            <MiniCouponStat icon={CheckCircle2} label="Ativos" value={activeCoupons} />
            <MiniCouponStat icon={Calendar} label="Modo" value="Seguro" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cupons cadastrados</CardTitle>
              <CardDescription>
                Esses cupons ficam disponiveis no carrinho do cardapio publico.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-sm font-bold text-slate-500">
                  Carregando cupons...
                </div>
              ) : coupons.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  Nenhum cupom cadastrado ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {coupons.map((coupon) => (
                    <article
                      key={coupon.id}
                      className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto] lg:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-slate-950">
                            {coupon.code}
                          </h3>
                          <Badge variant={coupon.isActive ? 'success' : 'default'}>
                            {coupon.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          Desconto: <strong>{couponValueLabel(coupon)}</strong>
                          {Number(coupon.minimumOrderValue ?? 0) > 0
                            ? ` | Minimo: ${formatMoney(coupon.minimumOrderValue)}`
                            : ''}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editCoupon(coupon)}
                      >
                        Editar
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCoupon(coupon.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

function MiniCouponStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Percent
  label: string
  value: string | number
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p className="text-xl font-black text-slate-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
