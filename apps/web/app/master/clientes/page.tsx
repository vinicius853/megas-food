'use client'

import * as React from 'react'
import Link from 'next/link'
import { CreditCard, ExternalLink, Eye, KeyRound, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { canViewFinancialData, getStoredPermissions, hasPermission } from '../components/master-permissions'
import {
  formatCep,
  formatCpfCnpj,
  formatDate,
  formatDocumentInput,
  formatFullDate,
  formatMoney,
  formatPhone,
  formatWhatsappInput,
  formatZipInput,
  getCurrentSubscription,
  getErrorMessage,
  getPlanName,
  parseMoneyInput,
  slugify,
} from './clientes-formatters'
import {
  type ChangePlanForm,
  type Plan,
  type ResetPasswordForm,
  type Tenant,
  type TenantEditForm,
  type TenantForm,
  initialChangePlanForm,
  initialEditForm,
  initialForm,
  initialResetPasswordForm,
} from './clientes.types'

export default function ClientesPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>([])
  const [plans, setPlans] = React.useState<Plan[]>([])
  const [currentRole, setCurrentRole] = React.useState('MASTER_ADMIN')
  const [currentPermissions, setCurrentPermissions] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isResettingPassword, setIsResettingPassword] = React.useState(false)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [detailsTenant, setDetailsTenant] = React.useState<Tenant | null>(null)
  const [editTenant, setEditTenant] = React.useState<Tenant | null>(null)
  const [resetPasswordTenant, setResetPasswordTenant] = React.useState<Tenant | null>(null)
  const [changePlanTenant, setChangePlanTenant] = React.useState<Tenant | null>(null)
  const [form, setForm] = React.useState<TenantForm>(initialForm)
  const [editForm, setEditForm] = React.useState<TenantEditForm>(initialEditForm)
  const [resetPasswordForm, setResetPasswordForm] = React.useState<ResetPasswordForm>(initialResetPasswordForm)
  const [changePlanForm, setChangePlanForm] = React.useState<ChangePlanForm>(initialChangePlanForm)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const canManageClients = hasPermission('MANAGE_CLIENT_STATUS', {
    role: currentRole,
    permissions: currentPermissions,
  })
  const canCreateClients = currentRole === 'MASTER_OWNER' || currentRole === 'MASTER_ADMIN'
  const canDeleteClients = currentRole === 'MASTER_OWNER'
  const canResetClientPassword = hasPermission('RESET_CLIENT_PASSWORDS', {
    role: currentRole,
    permissions: currentPermissions,
  })
  const canManagePlans = canViewFinancialData({
    role: currentRole,
    permissions: currentPermissions,
  })

  const loadTenants = React.useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await apiFetch<Tenant[]>('/tenants')
      setTenants(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadPlans = React.useCallback(async () => {
    try {
      const data = await apiFetch<Plan[]>('/billing/plans')
      setPlans(data)
    } catch {
      setPlans([])
    }
  }, [])

  React.useEffect(() => {
    setCurrentRole(localStorage.getItem('userRole') || 'MASTER_ADMIN')
    setCurrentPermissions(getStoredPermissions())
    loadTenants()
    loadPlans()

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setIsModalOpen(params.get('novo') === '1')
    }
  }, [loadPlans, loadTenants])

  function updateForm(field: keyof TenantForm, value: string) {
    const nextValue =
      field === 'document'
        ? formatDocumentInput(value)
        : field === 'zipCode'
          ? formatZipInput(value)
          : field === 'whatsapp' || field === 'phone'
            ? formatWhatsappInput(value)
            : field === 'state'
              ? value.toUpperCase().slice(0, 2)
              : value

    setForm((current) => ({
      ...current,
      [field]: nextValue,
      ...(field === 'name'
        ? {
            slug: slugify(nextValue),
          }
        : {}),
    }))
  }

  function updateEditForm(field: keyof TenantEditForm, value: string) {
    const nextValue =
      field === 'document'
        ? formatDocumentInput(value)
        : field === 'zipCode'
          ? formatZipInput(value)
          : field === 'whatsapp' || field === 'phone'
            ? formatWhatsappInput(value)
            : field === 'state'
              ? value.toUpperCase().slice(0, 2)
              : value

    setEditForm((current) => ({
      ...current,
      [field]: nextValue,
      ...(field === 'name'
        ? {
            slug: slugify(nextValue),
          }
        : {}),
    }))
  }

  async function createTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch('/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          slug: slugify(form.name),
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          ownerPassword: form.ownerPassword,
          document: form.document,
          phone: form.phone || undefined,
          whatsapp: form.whatsapp,
          city: form.city,
          state: form.state,
          address: form.address || undefined,
          zipCode: form.zipCode || undefined,
          internalNotes: form.internalNotes || undefined,
          isActive: true,
        }),
      })

      setSuccess('Pizzaria criada com sucesso.')
      setForm(initialForm)
      setIsModalOpen(false)
      await loadTenants()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  function openEditModal(tenant: Tenant) {
    setError('')
    setSuccess('')
    setEditTenant(tenant)
    setEditForm({
      name: tenant.name,
      slug: tenant.slug,
      responsibleName:
        tenant.responsibleName ||
        tenant.users?.find((user) => user.role === 'CLIENT_OWNER')?.name ||
        '',
      document: tenant.document ? formatCpfCnpj(tenant.document) : '',
      phone: tenant.phone ? formatPhone(tenant.phone) : '',
      whatsapp: tenant.whatsapp ? formatPhone(tenant.whatsapp) : '',
      city: tenant.city || '',
      state: tenant.state || '',
      address: tenant.address || '',
      zipCode: tenant.zipCode ? formatCep(tenant.zipCode) : '',
      internalNotes: tenant.internalNotes || '',
    })
  }

  async function updateTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editTenant) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/tenants/${editTenant.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name,
          slug: editForm.slug,
          responsibleName: editForm.responsibleName,
          document: editForm.document,
          phone: editForm.phone || undefined,
          whatsapp: editForm.whatsapp,
          city: editForm.city,
          state: editForm.state,
          address: editForm.address || undefined,
          zipCode: editForm.zipCode || undefined,
          internalNotes: editForm.internalNotes || undefined,
        }),
      })

      setSuccess('Dados administrativos atualizados.')
      setEditTenant(null)
      await loadTenants()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleTenant(tenant: Tenant) {
    setError('')
    setSuccess('')

    try {
      const confirmationPassword = tenant.isActive
        ? window.prompt('Confirme sua senha para desativar este cliente:')
        : ''

      if (tenant.isActive && !confirmationPassword) {
        setError('Senha de confirmacao obrigatoria para desativar cliente.')
        return
      }

      await apiFetch(`/tenants/${tenant.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isActive: !tenant.isActive,
          ...(confirmationPassword
            ? {
                confirmationPassword,
              }
            : {}),
        }),
      })

      setSuccess(
        tenant.isActive
          ? 'Cliente desativado.'
          : 'Cliente ativado.',
      )
      await loadTenants()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function removeTenant(tenant: Tenant) {
    const confirmed = window.confirm(
      `Excluir ${tenant.name}? Esta acao remove a pizzaria e seus dados vinculados.`,
    )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await apiFetch(`/tenants/${tenant.id}`, {
        method: 'DELETE',
      })
      setSuccess('Cliente excluido.')
      await loadTenants()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  function openResetPasswordModal(tenant: Tenant) {
    setError('')
    setSuccess('')
    setResetPasswordTenant(tenant)
    setResetPasswordForm(initialResetPasswordForm)
  }

  async function resetOwnerPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!resetPasswordTenant) return

    setIsResettingPassword(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/tenants/${resetPasswordTenant.id}/reset-owner-password`, {
        method: 'POST',
        body: JSON.stringify(resetPasswordForm),
      })

      const owner = resetPasswordTenant.users?.find((user) => user.role === 'CLIENT_OWNER')
      setSuccess(`Senha de ${owner?.email || resetPasswordTenant.name} redefinida com sucesso.`)
      setResetPasswordTenant(null)
      setResetPasswordForm(initialResetPasswordForm)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsResettingPassword(false)
    }
  }

  function openChangePlanModal(tenant: Tenant) {
    const subscription = getCurrentSubscription(tenant)
    const plan = subscription?.plan

    setError('')
    setSuccess('')
    setChangePlanTenant(tenant)
    setChangePlanForm({
      planId: subscription?.planId || plan?.id || plans[0]?.id || '',
      contractedMonthlyPrice:
        subscription?.contractedMonthlyPrice !== undefined
          ? String(subscription.contractedMonthlyPrice)
          : plan?.monthlyPrice !== undefined
            ? String(plan.monthlyPrice)
            : plans[0]?.monthlyPrice !== undefined
              ? String(plans[0].monthlyPrice)
              : '',
      contractedAnnualPrice:
        subscription?.contractedAnnualPrice !== undefined &&
        subscription?.contractedAnnualPrice !== null
          ? String(subscription.contractedAnnualPrice)
          : '',
      contractedSetupFee:
        subscription?.contractedSetupFee !== undefined &&
        subscription?.contractedSetupFee !== null
          ? String(subscription.contractedSetupFee)
          : '',
      internalNotes: subscription?.internalNotes || '',
    })
  }

  function updateChangePlanForm(field: keyof ChangePlanForm, value: string) {
    setChangePlanForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'planId'
        ? {
            contractedMonthlyPrice:
              plans.find((plan) => plan.id === value)?.monthlyPrice?.toString() ||
              current.contractedMonthlyPrice,
            contractedAnnualPrice:
              plans.find((plan) => plan.id === value)?.annualPrice?.toString() || '',
            contractedSetupFee:
              plans.find((plan) => plan.id === value)?.setupFee?.toString() || '',
          }
        : {}),
    }))
  }

  async function changeTenantPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!changePlanTenant) return

    const contractedMonthlyPrice = parseMoneyInput(changePlanForm.contractedMonthlyPrice)

    if (!changePlanForm.planId || contractedMonthlyPrice === undefined) {
      setError('Escolha um plano e informe o valor contratado.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/billing/tenants/${changePlanTenant.id}/change-plan`, {
        method: 'POST',
        body: JSON.stringify({
          planId: changePlanForm.planId,
          contractedMonthlyPrice,
          contractedAnnualPrice: parseMoneyInput(changePlanForm.contractedAnnualPrice),
          contractedSetupFee: parseMoneyInput(changePlanForm.contractedSetupFee),
          internalNotes: changePlanForm.internalNotes || undefined,
        }),
      })

      setSuccess('Plano do cliente atualizado. O valor contratado ficou salvo na assinatura.')
      setChangePlanTenant(null)
      setChangePlanForm(initialChangePlanForm)
      await loadTenants()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Clientes"
        description="Pizzarias cadastradas na plataforma."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={loadTenants}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            {canCreateClients ? (
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Nova pizzaria
              </Button>
            ) : null}
          </div>
        }
      />

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      ) : null}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codigo</TableHead>
              <TableHead>Pizzaria</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Responsavel</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Cliente desde</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                  Carregando clientes...
                </TableCell>
              </TableRow>
            ) : tenants.length ? (
              tenants.map((tenant) => {
                const owner = tenant.users?.find((user) => user.role === 'CLIENT_OWNER')

                return (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {tenant.internalCode || 'Sem codigo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-slate-900">{tenant.name}</p>
                      <p className="text-xs text-slate-500">/c/{tenant.slug}</p>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {tenant.city && tenant.state ? `${tenant.city}/${tenant.state}` : '-'}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {tenant.responsibleName || owner?.name || 'Sem responsavel'}
                      {owner?.email ? (
                        <p className="text-xs text-slate-400">{owner.email}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatPhone(tenant.whatsapp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.isActive ? 'success' : 'default'}>
                        {tenant.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {getPlanName(tenant)}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(tenant.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailsTenant(tenant)}
                        >
                          <Eye className="h-4 w-4" />
                          Detalhes
                        </Button>
                        {canCreateClients ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(tenant)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                        ) : null}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/c/${tenant.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                            Cardapio
                          </Link>
                        </Button>
                        {canResetClientPassword ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResetPasswordModal(tenant)}
                            disabled={!owner}
                          >
                            <KeyRound className="h-4 w-4" />
                            Senha
                          </Button>
                        ) : null}
                        {canManagePlans ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openChangePlanModal(tenant)}
                          >
                            <CreditCard className="h-4 w-4" />
                            Plano
                          </Button>
                        ) : null}
                        {canManageClients ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTenant(tenant)}
                          >
                            {tenant.isActive ? 'Desativar' : 'Ativar'}
                          </Button>
                        ) : null}
                        {canDeleteClients ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeTenant(tenant)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                  Nenhuma pizzaria cadastrada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent className="max-w-2xl">
          <form onSubmit={createTenant}>
            <ModalHeader>
              <ModalTitle>Nova pizzaria</ModalTitle>
              <ModalDescription>
                Crie o cliente e o primeiro acesso do dono da pizzaria.
              </ModalDescription>
            </ModalHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Nome da pizzaria</label>
                <Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">URL publica gerada</label>
                <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 shadow-sm">
                  /c/{form.slug || 'nome-da-pizzaria'}
                </div>
                <p className="text-xs font-medium text-slate-500">
                  O sistema gera automaticamente pelo nome da pizzaria.
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Nome do dono</label>
                <Input value={form.ownerName} onChange={(event) => updateForm('ownerName', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Email do dono</label>
                <Input type="email" value={form.ownerEmail} onChange={(event) => updateForm('ownerEmail', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Senha inicial</label>
                <Input type="password" value={form.ownerPassword} onChange={(event) => updateForm('ownerPassword', event.target.value)} required minLength={6} />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">WhatsApp</label>
                <Input value={form.whatsapp} onChange={(event) => updateForm('whatsapp', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">CPF ou CNPJ</label>
                <Input value={form.document} onChange={(event) => updateForm('document', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Cidade</label>
                <Input value={form.city} onChange={(event) => updateForm('city', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Estado</label>
                <Input value={form.state} onChange={(event) => updateForm('state', event.target.value)} required maxLength={2} placeholder="RJ" />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">CEP</label>
                <Input value={form.zipCode} onChange={(event) => updateForm('zipCode', event.target.value)} placeholder="27320-360" />
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-slate-700">Endereco completo</label>
                <Input value={form.address} onChange={(event) => updateForm('address', event.target.value)} placeholder="Rua, numero, bairro" />
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-slate-700">Observacoes internas</label>
                <textarea
                  value={form.internalNotes}
                  onChange={(event) => updateForm('internalNotes', event.target.value)}
                  className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-orange-500"
                  placeholder="Informacoes administrativas visiveis apenas no Master."
                />
              </div>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? 'Criando...' : 'Criar pizzaria'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal open={Boolean(editTenant)} onOpenChange={(open) => !open && setEditTenant(null)}>
        <ModalContent className="max-w-2xl">
          <form onSubmit={updateTenant}>
            <ModalHeader>
              <ModalTitle>Editar pizzaria</ModalTitle>
              <ModalDescription>
                Atualize dados administrativos internos do cliente.
              </ModalDescription>
            </ModalHeader>

            <div className="mb-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
                Codigo interno
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">
                {editTenant?.internalCode || 'Sem codigo'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Nome da pizzaria</label>
                <Input value={editForm.name} onChange={(event) => updateEditForm('name', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Slug publico</label>
                <Input value={editForm.slug} onChange={(event) => updateEditForm('slug', slugify(event.target.value))} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Responsavel</label>
                <Input value={editForm.responsibleName} onChange={(event) => updateEditForm('responsibleName', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">CPF ou CNPJ</label>
                <Input value={editForm.document} onChange={(event) => updateEditForm('document', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">WhatsApp</label>
                <Input value={editForm.whatsapp} onChange={(event) => updateEditForm('whatsapp', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Telefone</label>
                <Input value={editForm.phone} onChange={(event) => updateEditForm('phone', event.target.value)} />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Cidade</label>
                <Input value={editForm.city} onChange={(event) => updateEditForm('city', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Estado</label>
                <Input value={editForm.state} onChange={(event) => updateEditForm('state', event.target.value)} required maxLength={2} />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">CEP</label>
                <Input value={editForm.zipCode} onChange={(event) => updateEditForm('zipCode', event.target.value)} />
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-slate-700">Endereco completo</label>
                <Input value={editForm.address} onChange={(event) => updateEditForm('address', event.target.value)} />
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-slate-700">Observacoes internas</label>
                <textarea
                  value={editForm.internalNotes}
                  onChange={(event) => updateEditForm('internalNotes', event.target.value)}
                  className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setEditTenant(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar alteracoes'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal open={Boolean(detailsTenant)} onOpenChange={(open) => !open && setDetailsTenant(null)}>
        <ModalContent className="max-w-2xl">
          {detailsTenant ? (
            <>
              <ModalHeader>
                <ModalTitle>{detailsTenant.name}</ModalTitle>
                <ModalDescription>
                  Dados administrativos internos para suporte, cobranca e auditoria.
                </ModalDescription>
              </ModalHeader>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem label="Codigo interno" value={detailsTenant.internalCode || 'Sem codigo'} />
                <DetailItem label="Slug" value={`/c/${detailsTenant.slug}`} />
                <DetailItem label="Responsavel" value={detailsTenant.responsibleName || detailsTenant.users?.find((user) => user.role === 'CLIENT_OWNER')?.name || '-'} />
                <DetailItem label="Email" value={detailsTenant.users?.find((user) => user.role === 'CLIENT_OWNER')?.email || '-'} />
                <DetailItem label="WhatsApp" value={formatPhone(detailsTenant.whatsapp)} />
                <DetailItem label="CPF/CNPJ" value={formatCpfCnpj(detailsTenant.document)} />
                <DetailItem label="Cidade" value={detailsTenant.city || '-'} />
                <DetailItem label="Estado" value={detailsTenant.state || '-'} />
                <DetailItem label="Endereco completo" value={detailsTenant.address || '-'} />
                <DetailItem label="CEP" value={formatCep(detailsTenant.zipCode)} />
                <DetailItem label="Status" value={detailsTenant.isActive ? 'Ativo' : 'Inativo'} />
                <DetailItem label="Data de cadastro" value={formatDate(detailsTenant.createdAt)} />
                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 sm:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-orange-700">Plano atual</p>
                      <p className="mt-1 text-base font-black text-slate-950">
                        {getPlanName(detailsTenant)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Valor contratado:{' '}
                        {getCurrentSubscription(detailsTenant)
                          ? formatMoney(getCurrentSubscription(detailsTenant)?.contractedMonthlyPrice)
                          : '-'}
                      </p>
                    </div>
                    {canManagePlans ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDetailsTenant(null)
                          openChangePlanModal(detailsTenant)
                        }}
                      >
                        <CreditCard className="h-4 w-4" />
                        Alterar plano
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <DetailItem
                      label="Valor atual do plano"
                      value={
                        getCurrentSubscription(detailsTenant)?.plan
                          ? formatMoney(getCurrentSubscription(detailsTenant)?.plan?.monthlyPrice)
                          : '-'
                      }
                    />
                    <DetailItem
                      label="Status da assinatura"
                      value={getCurrentSubscription(detailsTenant)?.status || 'Sem assinatura'}
                    />
                    <DetailItem
                      label="Contratado em"
                      value={formatFullDate(getCurrentSubscription(detailsTenant)?.contractedAt)}
                    />
                    <DetailItem
                      label="Proximo vencimento"
                      value={formatFullDate(getCurrentSubscription(detailsTenant)?.nextBillingDate)}
                    />
                    <DetailItem
                      label="Acesso ate"
                      value={formatFullDate(getCurrentSubscription(detailsTenant)?.accessUntil)}
                    />
                    <DetailItem
                      label="Valor de implantacao"
                      value={
                        getCurrentSubscription(detailsTenant)?.contractedSetupFee
                          ? formatMoney(getCurrentSubscription(detailsTenant)?.contractedSetupFee)
                          : '-'
                      }
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-xs font-black uppercase text-slate-400">Observacoes internas</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-700">
                    {detailsTenant.internalNotes || 'Sem observacoes.'}
                  </p>
                </div>
              </div>

              <ModalFooter>
                <Button type="button" variant="outline" onClick={() => setDetailsTenant(null)}>
                  Fechar
                </Button>
                {canCreateClients ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      setDetailsTenant(null)
                      openEditModal(detailsTenant)
                    }}
                  >
                    Editar dados
                  </Button>
                ) : null}
              </ModalFooter>
            </>
          ) : null}
        </ModalContent>
      </Modal>

      <Modal open={Boolean(resetPasswordTenant)} onOpenChange={(open) => !open && setResetPasswordTenant(null)}>
        <ModalContent className="max-w-lg">
          <form onSubmit={resetOwnerPassword}>
            <ModalHeader>
              <ModalTitle>Redefinir senha do cliente</ModalTitle>
              <ModalDescription>
                Crie uma senha nova para o dono da pizzaria. A senha sera valida imediatamente e esta acao ficara registrada na auditoria.
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                <p className="text-sm font-black text-slate-900">
                  {resetPasswordTenant?.name}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Dono: {resetPasswordTenant?.users?.find((user) => user.role === 'CLIENT_OWNER')?.email || 'Nao encontrado'}
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Nova senha do cliente</label>
                <Input
                  type="password"
                  value={resetPasswordForm.newPassword}
                  onChange={(event) =>
                    setResetPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  required
                  minLength={6}
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Sua senha de operador</label>
                <Input
                  type="password"
                  value={resetPasswordForm.confirmationPassword}
                  onChange={(event) =>
                    setResetPasswordForm((current) => ({
                      ...current,
                      confirmationPassword: event.target.value,
                    }))
                  }
                  required
                />
                <p className="text-xs font-medium text-slate-500">
                  Confirmamos sua senha para evitar alteracoes acidentais ou indevidas.
                </p>
              </div>

              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium leading-relaxed text-slate-500">
                Nao compartilhe esta senha em canais publicos. O sistema nunca salva a senha em texto puro e o log registra somente a acao.
              </p>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setResetPasswordTenant(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isResettingPassword}>
                {isResettingPassword ? 'Redefinindo...' : 'Redefinir senha'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal open={Boolean(changePlanTenant)} onOpenChange={(open) => !open && setChangePlanTenant(null)}>
        <ModalContent className="max-w-2xl">
          <form onSubmit={changeTenantPlan}>
            <ModalHeader>
              <ModalTitle>Alterar plano</ModalTitle>
              <ModalDescription>
                Defina o plano e o valor contratado desta pizzaria. Alterar a tabela de planos depois nao muda este contrato automaticamente.
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
                  Cliente
                </p>
                <p className="mt-1 text-base font-black text-slate-950">
                  {changePlanTenant?.name}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {changePlanTenant?.internalCode || 'Sem codigo interno'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Plano</label>
                  <select
                    value={changePlanForm.planId}
                    onChange={(event) => updateChangePlanForm('planId', event.target.value)}
                    required
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 shadow-sm outline-none focus:border-orange-500"
                  >
                    <option value="">Selecione um plano</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id} disabled={!plan.isActive}>
                        {plan.name} - {formatMoney(plan.monthlyPrice)}
                        {plan.isActive ? '' : ' (inativo)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Valor contratado mensal</label>
                  <Input
                    value={changePlanForm.contractedMonthlyPrice}
                    onChange={(event) =>
                      updateChangePlanForm('contractedMonthlyPrice', event.target.value)
                    }
                    inputMode="decimal"
                    required
                  />
                  <p className="text-xs font-medium text-slate-500">
                    Este valor fica salvo na assinatura do cliente.
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Valor anual contratado</label>
                  <Input
                    value={changePlanForm.contractedAnnualPrice}
                    onChange={(event) =>
                      updateChangePlanForm('contractedAnnualPrice', event.target.value)
                    }
                    inputMode="decimal"
                    placeholder="Opcional"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Taxa de implantacao contratada</label>
                  <Input
                    value={changePlanForm.contractedSetupFee}
                    onChange={(event) =>
                      updateChangePlanForm('contractedSetupFee', event.target.value)
                    }
                    inputMode="decimal"
                    placeholder="Opcional"
                  />
                </div>

                <div className="grid gap-1.5 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Observacoes internas da assinatura</label>
                  <textarea
                    value={changePlanForm.internalNotes}
                    onChange={(event) =>
                      updateChangePlanForm('internalNotes', event.target.value)
                    }
                    className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-orange-500"
                    placeholder="Ex: cliente manteve valor promocional de entrada."
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-relaxed text-amber-800">
                Esta acao altera apenas a assinatura deste cliente. Os demais clientes vinculados ao mesmo plano nao serao alterados.
              </div>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setChangePlanTenant(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving || !plans.length}>
                {isSaving ? 'Salvando...' : 'Salvar plano do cliente'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </PageContainer>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}
