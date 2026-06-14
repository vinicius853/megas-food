'use client'

import * as React from 'react'
import { Plus, RefreshCw } from 'lucide-react'

import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal'
import { apiFetch } from '@/lib/api'
import { canViewFinancialData, getStoredPermissions, hasPermission } from '../components/master-permissions'
import { ClienteCreateModal } from './cliente-create-modal'
import { ClienteDetailsModal } from './cliente-details-modal'
import { ClienteEditModal } from './cliente-edit-modal'
import {
  formatCep,
  formatCpfCnpj,
  formatDocumentInput,
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
import { ClientesTable } from './clientes-table'
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
import type { TenantSegment } from '@/lib/segments/segment-types'

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
      const data = await apiFetch<Tenant[]>('/tenants/commercial')
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

  function updateForm(
    field: keyof TenantForm,
    value: string | TenantSegment[],
  ) {
    if (field === 'enabledSegments') {
      setForm((current) => ({
        ...current,
        enabledSegments: value as TenantSegment[],
      }))
      return
    }

    const textValue = value as string
    const nextValue =
      field === 'document'
        ? formatDocumentInput(textValue)
        : field === 'zipCode'
          ? formatZipInput(textValue)
          : field === 'whatsapp' || field === 'phone'
            ? formatWhatsappInput(textValue)
            : field === 'state'
              ? textValue.toUpperCase().slice(0, 2)
              : textValue

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

  function updateEditForm(
    field: keyof TenantEditForm,
    value: string | TenantSegment[],
  ) {
    if (field === 'enabledSegments') {
      setEditForm((current) => ({
        ...current,
        enabledSegments: value as TenantSegment[],
      }))
      return
    }

    const textValue = value as string
    const nextValue =
      field === 'document'
        ? formatDocumentInput(textValue)
        : field === 'zipCode'
          ? formatZipInput(textValue)
          : field === 'whatsapp' || field === 'phone'
            ? formatWhatsappInput(textValue)
            : field === 'state'
              ? textValue.toUpperCase().slice(0, 2)
              : textValue

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
          enabledSegments: form.enabledSegments,
        }),
      })

      setSuccess('Cliente criado com sucesso.')
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
      enabledSegments: tenant.enabledSegments || ['PIZZARIA'],
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
          enabledSegments: editForm.enabledSegments,
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
      `Excluir ${tenant.name}? Esta acao remove o cliente e seus dados vinculados.`,
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
        description="Operacoes cadastradas na plataforma e seus segmentos habilitados."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={loadTenants}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            {canCreateClients ? (
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Novo cliente
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

      <ClientesTable
        tenants={tenants}
        isLoading={isLoading}
        canCreateClients={canCreateClients}
        canManageClients={canManageClients}
        canDeleteClients={canDeleteClients}
        canResetClientPassword={canResetClientPassword}
        canManagePlans={canManagePlans}
        onOpenDetails={(tenant) => setDetailsTenant(tenant)}
        onOpenEdit={openEditModal}
        onOpenResetPassword={openResetPasswordModal}
        onOpenChangePlan={openChangePlanModal}
        onToggleTenant={toggleTenant}
        onDeleteTenant={removeTenant}
      />

      <ClienteCreateModal
        isOpen={isModalOpen}
        form={form}
        isSaving={isSaving}
        onOpenChange={setIsModalOpen}
        onChange={updateForm}
        onSubmit={createTenant}
        onClose={() => setIsModalOpen(false)}
      />

      <ClienteEditModal
        tenant={editTenant}
        form={editForm}
        isSaving={isSaving}
        onClose={() => setEditTenant(null)}
        onChange={updateEditForm}
        onSubmit={updateTenant}
      />

      <ClienteDetailsModal
        tenant={detailsTenant}
        canCreateClients={canCreateClients}
        canManagePlans={canManagePlans}
        onClose={() => setDetailsTenant(null)}
        onOpenEdit={openEditModal}
        onOpenChangePlan={openChangePlanModal}
      />

      <Modal open={Boolean(resetPasswordTenant)} onOpenChange={(open) => !open && setResetPasswordTenant(null)}>
        <ModalContent className="max-w-lg">
          <form onSubmit={resetOwnerPassword}>
            <ModalHeader>
              <ModalTitle>Redefinir senha do cliente</ModalTitle>
              <ModalDescription>
                Crie uma senha nova para o responsavel principal. A senha sera valida imediatamente e esta acao ficara registrada na auditoria.
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
                Defina o plano e o valor contratado deste cliente. Alterar a tabela de planos depois nao muda este contrato automaticamente.
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
