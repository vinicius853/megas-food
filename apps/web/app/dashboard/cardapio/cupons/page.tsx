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
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState(false)
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
      setFormError('')
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
      setFormOpen(false)
      setMessage(editingId ? 'Cupom atualizado.' : 'Cupom criado.')
      await loadCoupons()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar cupom.')
    } finally {
      setSaving(false)
    }
  }

  async function removeCoupon(coupon: Coupon) {
    try {
      setDeleting(true)
      setError('')
      setMessage('')
      await apiFetch(`/coupons/${coupon.id}`, { method: 'DELETE' })
      setCouponToDelete(null)
      setMessage('Cupom excluido.')
      await loadCoupons()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir cupom.')
    } finally {
      setDeleting(false)
    }
  }

  function openCreateCoupon() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
    setFormOpen(true)
  }

  function editCoupon(coupon: Coupon) {
    setEditingId(coupon.id)
    setFormError('')
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
    setFormOpen(true)
  }

  function closeForm() {
    if (saving) return

    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
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
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openCreateCoupon}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Criar cupom
            </Button>

            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/cardapio">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao cardapio
              </Link>
            </Button>
          </div>
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

      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <MiniCouponStat icon={Percent} label="Cupons" value={coupons.length} />
          <MiniCouponStat icon={CheckCircle2} label="Ativos" value={activeCoupons} />
          <MiniCouponStat icon={Calendar} label="Modo" value="Seguro" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Cupons cadastrados</CardTitle>
                <CardDescription>
                  Esses cupons ficam disponiveis no carrinho do cardapio publico.
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={openCreateCoupon}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Criar cupom
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-sm font-bold text-slate-500">
                Carregando cupons...
              </div>
            ) : coupons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-base font-black text-slate-800">
                  Nenhum cupom cadastrado ainda.
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
                  Crie seu primeiro cupom para oferecer descontos no cardapio publico.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  className="mt-4"
                  onClick={openCreateCoupon}
                >
                  <Plus className="h-4 w-4" />
                  Criar cupom
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <article
                    key={coupon.id}
                    className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-all text-lg font-black text-slate-950">
                          {coupon.code}
                        </h3>
                        <Badge variant={coupon.isActive ? 'success' : 'default'}>
                          {coupon.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                        <CouponDetail label="Tipo" value={coupon.type === 'PERCENTAGE' ? 'Percentual' : 'Valor fixo'} />
                        <CouponDetail label="Desconto" value={couponValueLabel(coupon)} />
                        <CouponDetail
                          label="Pedido minimo"
                          value={
                            Number(coupon.minimumOrderValue ?? 0) > 0
                              ? formatMoney(coupon.minimumOrderValue)
                              : 'Sem minimo'
                          }
                        />
                        <CouponDetail
                          label="Periodo"
                          value={formatCouponPeriod(coupon)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 lg:w-56">
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
                        onClick={() => setCouponToDelete(coupon)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {formOpen && (
        <CouponFormModal
          form={form}
          editingCode={
            editingId
              ? coupons.find((coupon) => coupon.id === editingId)?.code
              : undefined
          }
          saving={saving}
          error={formError}
          onChange={setForm}
          onCancel={closeForm}
          onSave={saveCoupon}
        />
      )}

      {couponToDelete && (
        <DeleteCouponModal
          coupon={couponToDelete}
          deleting={deleting}
          onCancel={() => {
            if (!deleting) setCouponToDelete(null)
          }}
          onConfirm={() => removeCoupon(couponToDelete)}
        />
      )}
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

function CouponFormModal({
  form,
  editingCode,
  saving,
  error,
  onChange,
  onCancel,
  onSave,
}: {
  form: CouponForm
  editingCode?: string
  saving: boolean
  error: string
  onChange: (updater: (current: CouponForm) => CouponForm) => void
  onCancel: () => void
  onSave: () => void
}) {
  const isEditing = Boolean(editingCode)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={onCancel}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-xl font-black text-slate-950">
            {isEditing ? 'Editar cupom' : 'Criar cupom'}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {isEditing
              ? `Editando ${editingCode}`
              : 'Use codigos simples, como PIZZA10 ou FRETE5.'}
          </p>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-600">
              Codigo
            </span>
            <Input
              value={form.code}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
              placeholder="PIZZA10"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-bold text-slate-600">
              Tipo de desconto
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    type: 'PERCENTAGE',
                  }))
                }
                className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                  form.type === 'PERCENTAGE'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Percentual
              </button>

              <button
                type="button"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    type: 'FIXED_AMOUNT',
                  }))
                }
                className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                  form.type === 'FIXED_AMOUNT'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Valor fixo
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-600">
                Desconto {form.type === 'PERCENTAGE' ? '(%)' : '(R$)'}
              </span>
              <Input
                value={form.value}
                onChange={(event) =>
                  onChange((current) => ({
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
                  onChange((current) => ({
                    ...current,
                    minimumOrderValue: event.target.value,
                  }))
                }
                placeholder="Ex: 50,00"
                inputMode="decimal"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-600">
                Inicio
              </span>
              <Input
                type="date"
                value={form.startsAt}
                onChange={(event) =>
                  onChange((current) => ({
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
                  onChange((current) => ({
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
                onChange((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
              className="h-5 w-5 accent-orange-600"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-slate-100 p-5 sm:grid-cols-[auto_auto] sm:justify-end sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving
              ? 'Salvando...'
              : isEditing
                ? 'Salvar alteracoes'
                : 'Salvar cupom'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function DeleteCouponModal({
  coupon,
  deleting,
  onCancel,
  onConfirm,
}: {
  coupon: Coupon
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-black text-slate-950">
          Excluir cupom?
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          O cupom {coupon.code} deixara de ficar disponivel no cardapio publico.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CouponDetail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-black uppercase text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 break-words font-bold text-slate-700">{value}</p>
    </div>
  )
}

function formatCouponPeriod(coupon: Coupon) {
  const startsAt = formatDisplayDate(coupon.startsAt)
  const expiresAt = formatDisplayDate(coupon.expiresAt)

  if (startsAt && expiresAt) return `${startsAt} ate ${expiresAt}`
  if (startsAt) return `Inicio ${startsAt}`
  if (expiresAt) return `Valido ate ${expiresAt}`

  return 'Sem periodo'
}

function formatDisplayDate(value?: string | null) {
  if (!value) return ''

  return new Date(value).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
  })
}
