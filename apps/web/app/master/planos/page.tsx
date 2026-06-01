'use client'

import * as React from 'react'
import {
  CheckCircle2,
  Edit3,
  Layers3,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Star,
  X,
} from 'lucide-react'

import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/api'

type Plan = {
  id: string
  name: string
  slug: string
  description?: string | null
  monthlyPrice: string | number
  annualPrice?: string | number | null
  setupFee?: string | number | null
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  features: string[]
  createdAt: string
  updatedAt: string
  _count?: {
    subscriptions: number
  }
}

type PlanForm = {
  name: string
  slug: string
  description: string
  monthlyPrice: string
  annualPrice: string
  setupFee: string
  sortOrder: string
  isActive: boolean
  isFeatured: boolean
  featuresText: string
}

const emptyForm: PlanForm = {
  name: '',
  slug: '',
  description: '',
  monthlyPrice: '150',
  annualPrice: '',
  setupFee: '',
  sortOrder: '0',
  isActive: true,
  isFeatured: false,
  featuresText: '',
}

function formatMoney(value?: string | number | null) {
  const amount = Number(value || 0)

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(amount) ? amount : 0)
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseOptionalMoney(value: string) {
  const normalized = value.replace(',', '.').trim()

  return normalized ? Number(normalized) : undefined
}

function planToForm(plan: Plan): PlanForm {
  return {
    name: plan.name,
    slug: plan.slug,
    description: plan.description || '',
    monthlyPrice: String(plan.monthlyPrice ?? ''),
    annualPrice: plan.annualPrice ? String(plan.annualPrice) : '',
    setupFee: plan.setupFee ? String(plan.setupFee) : '',
    sortOrder: String(plan.sortOrder ?? 0),
    isActive: plan.isActive,
    isFeatured: plan.isFeatured,
    featuresText: (plan.features || []).join('\n'),
  }
}

export default function PlanosPage() {
  const [plans, setPlans] = React.useState<Plan[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null)
  const [form, setForm] = React.useState<PlanForm>(emptyForm)

  React.useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    setIsLoading(true)
    setError('')

    try {
      const data = await apiFetch<Plan[]>('/billing/plans')
      setPlans(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar os planos.')
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateModal() {
    setEditingPlan(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  function openEditModal(plan: Plan) {
    setEditingPlan(plan)
    setForm(planToForm(plan))
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  function updateForm<K extends keyof PlanForm>(key: K, value: PlanForm[K]) {
    setForm((current) => {
      const next = {
        ...current,
        [key]: value,
      }

      if (key === 'name' && !editingPlan) {
        next.slug = toSlug(String(value))
      }

      return next
    })
  }

  async function savePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    const monthlyPrice = parseOptionalMoney(form.monthlyPrice)

    if (!form.name.trim() || !form.slug.trim() || monthlyPrice === undefined) {
      setError('Informe nome, slug e valor mensal.')
      setIsSaving(false)
      return
    }

    const payload = {
      name: form.name.trim(),
      slug: toSlug(form.slug),
      description: form.description.trim() || undefined,
      monthlyPrice,
      annualPrice: parseOptionalMoney(form.annualPrice),
      setupFee: parseOptionalMoney(form.setupFee),
      sortOrder: Number(form.sortOrder || 0),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      features: form.featuresText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    }

    try {
      if (editingPlan) {
        await apiFetch(`/billing/plans/${editingPlan.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setSuccess('Plano atualizado. Clientes existentes mantiveram seus valores contratados.')
      } else {
        await apiFetch('/billing/plans', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setSuccess('Plano criado com sucesso.')
      }

      setModalOpen(false)
      await loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel salvar o plano.')
    } finally {
      setIsSaving(false)
    }
  }

  async function togglePlan(plan: Plan) {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/billing/plans/${plan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isActive: !plan.isActive,
        }),
      })
      setSuccess(plan.isActive ? 'Plano inativado.' : 'Plano ativado.')
      await loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel alterar o status.')
    } finally {
      setIsSaving(false)
    }
  }

  const activePlans = plans.filter((plan) => plan.isActive).length
  const featuredPlans = plans.filter((plan) => plan.isFeatured).length
  const clientsUsingPlans = plans.reduce(
    (total, plan) => total + (plan._count?.subscriptions || 0),
    0,
  )

  return (
    <PageContainer>
      <PageHeader
        title="Planos"
        description="Gerencie a tabela de precos da Megas Food sem alterar contratos ja existentes."
        actions={
          <>
            <Button variant="outline" onClick={loadPlans} disabled={isLoading}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="primary" onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Novo plano
            </Button>
          </>
        }
      />

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Planos cadastrados</p>
              <p className="text-2xl font-black text-slate-950">{plans.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Planos ativos</p>
              <p className="text-2xl font-black text-slate-950">{activePlans}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Clientes vinculados</p>
              <p className="text-2xl font-black text-slate-950">{clientsUsingPlans}</p>
              <p className="text-xs font-bold text-slate-400">{featuredPlans} em destaque</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabela de planos</CardTitle>
          <p className="text-sm leading-relaxed text-slate-500">
            Alterar um plano muda apenas o preco atual para novas contratacoes. Assinaturas antigas preservam o valor contratado.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Preco mensal</TableHead>
                  <TableHead>Preco anual</TableHead>
                  <TableHead>Implantacao</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Carregando planos...</TableCell>
                  </TableRow>
                ) : plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>Nenhum plano cadastrado.</TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="font-black text-slate-950">{plan.name}</div>
                        <div className="text-xs font-semibold text-slate-500">{plan.slug}</div>
                        {plan.description ? (
                          <div className="mt-1 max-w-md text-xs text-slate-500">
                            {plan.description}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-black text-slate-950">
                        {formatMoney(plan.monthlyPrice)}
                      </TableCell>
                      <TableCell>{plan.annualPrice ? formatMoney(plan.annualPrice) : '-'}</TableCell>
                      <TableCell>{plan.setupFee ? formatMoney(plan.setupFee) : '-'}</TableCell>
                      <TableCell>{plan._count?.subscriptions || 0}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={plan.isActive ? 'success' : 'default'}>
                            {plan.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {plan.isFeatured ? <Badge variant="warning">Destaque</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(plan)}>
                            <Edit3 className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant={plan.isActive ? 'outline' : 'secondary'}
                            size="sm"
                            onClick={() => togglePlan(plan)}
                            disabled={isSaving}
                          >
                            {plan.isActive ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                            {plan.isActive ? 'Inativar' : 'Ativar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-3xl">
          <form onSubmit={savePlan}>
            <ModalHeader>
              <ModalTitle>{editingPlan ? 'Editar plano' : 'Novo plano'}</ModalTitle>
              <ModalDescription>
                Plano e tabela de preco atual. Clientes existentes nao sao alterados automaticamente.
              </ModalDescription>
            </ModalHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-bold text-slate-700">
                Nome
                <Input
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  placeholder="Plano Megas Food"
                />
              </label>

              <label className="space-y-2 text-sm font-bold text-slate-700">
                Slug
                <Input
                  value={form.slug}
                  onChange={(event) => updateForm('slug', event.target.value)}
                  placeholder="plano-megas-food"
                />
              </label>

              <label className="space-y-2 text-sm font-bold text-slate-700 md:col-span-2">
                Descricao
                <Input
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  placeholder="Plano mensal principal da plataforma"
                />
              </label>

              <label className="space-y-2 text-sm font-bold text-slate-700">
                Valor mensal
                <Input
                  value={form.monthlyPrice}
                  onChange={(event) => updateForm('monthlyPrice', event.target.value)}
                  inputMode="decimal"
                  placeholder="150"
                />
              </label>

              <label className="space-y-2 text-sm font-bold text-slate-700">
                Valor anual
                <Input
                  value={form.annualPrice}
                  onChange={(event) => updateForm('annualPrice', event.target.value)}
                  inputMode="decimal"
                  placeholder="Opcional"
                />
              </label>

              <label className="space-y-2 text-sm font-bold text-slate-700">
                Taxa de implantacao
                <Input
                  value={form.setupFee}
                  onChange={(event) => updateForm('setupFee', event.target.value)}
                  inputMode="decimal"
                  placeholder="Opcional"
                />
              </label>

              <label className="space-y-2 text-sm font-bold text-slate-700">
                Ordem
                <Input
                  value={form.sortOrder}
                  onChange={(event) => updateForm('sortOrder', event.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                />
              </label>

              <label className="space-y-2 text-sm font-bold text-slate-700 md:col-span-2">
                Recursos inclusos
                <textarea
                  value={form.featuresText}
                  onChange={(event) => updateForm('featuresText', event.target.value)}
                  rows={6}
                  placeholder={'Cardapio digital\nPedidos online\nSuporte Megas Food'}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => updateForm('isActive', !form.isActive)}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black text-slate-900 transition hover:border-orange-200 hover:bg-orange-50"
              >
                Plano ativo
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    form.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {form.isActive ? 'Sim' : 'Nao'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => updateForm('isFeatured', !form.isFeatured)}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black text-slate-900 transition hover:border-orange-200 hover:bg-orange-50"
              >
                Plano em destaque
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    form.isFeatured
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {form.isFeatured ? 'Sim' : 'Nao'}
                </span>
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-relaxed text-amber-800">
              Alterar o preco do plano nao altera automaticamente o valor contratado dos clientes ja vinculados.
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar plano'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </PageContainer>
  )
}
