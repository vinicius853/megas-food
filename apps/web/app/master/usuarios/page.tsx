'use client'

import * as React from 'react'
import { KeyRound, Plus, RefreshCw, Trash2 } from 'lucide-react'

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
import { cn } from '@/lib/utils'
import { getStoredPermissions, hasPermission } from '../components/master-permissions'

type TenantOption = {
  id: string
  name: string
  slug: string
}

type User = {
  id: string
  tenantId: string
  name: string
  email: string
  role: string
  permissions?: string[]
  isActive: boolean
  createdAt: string
  tenant?: TenantOption
}

type UserForm = {
  tenantId: string
  name: string
  email: string
  password: string
  role: string
  permissions: string[]
}

const roles = [
  'MASTER_OWNER',
  'MASTER_ADMIN',
  'FINANCE_ADMIN',
  'SUPPORT',
]

const roleLabels: Record<string, string> = {
  MASTER_OWNER: 'Master owner',
  MASTER_ADMIN: 'Master admin',
  FINANCE_ADMIN: 'Financeiro',
  SUPPORT: 'Suporte',
}

const roleDescriptions: Record<string, string> = {
  MASTER_OWNER: 'Controle total da plataforma, incluindo exclusoes e configuracoes criticas.',
  MASTER_ADMIN: 'Gerencia clientes, usuarios e configuracoes operacionais do Master.',
  FINANCE_ADMIN: 'Acessa dados financeiros e cobrancas, sem permissoes destrutivas.',
  SUPPORT: 'Atende clientes, cria usuarios de suporte e redefine senhas, sem acesso financeiro.',
}

const permissionOptions = [
  {
    id: 'VIEW_CLIENTS',
    label: 'Ver clientes',
    description: 'Acessa a listagem de pizzarias e dados de atendimento.',
  },
  {
    id: 'MANAGE_CLIENT_STATUS',
    label: 'Ativar/desativar clientes',
    description: 'Pode bloquear ou reativar clientes com confirmacao de senha.',
  },
  {
    id: 'CREATE_USERS',
    label: 'Criar usuarios',
    description: 'Cria novos usuarios de suporte ou operacao.',
  },
  {
    id: 'RESET_PASSWORDS',
    label: 'Redefinir senhas',
    description: 'Troca senha de usuarios sem permissoes administrativas.',
  },
  {
    id: 'RESET_CLIENT_PASSWORDS',
    label: 'Redefinir senha de clientes',
    description: 'Troca a senha do dono da pizzaria mediante confirmacao do operador.',
  },
  {
    id: 'VIEW_FINANCIAL_DATA',
    label: 'Ver financeiro',
    description: 'Libera dados de mensalidades, MRR e cobrancas.',
  },
]

const rolePermissionTemplates: Record<string, string[]> = {
  MASTER_OWNER: permissionOptions.map((permission) => permission.id),
  MASTER_ADMIN: permissionOptions.map((permission) => permission.id),
  FINANCE_ADMIN: ['VIEW_CLIENTS', 'VIEW_FINANCIAL_DATA'],
  SUPPORT: ['VIEW_CLIENTS', 'MANAGE_CLIENT_STATUS', 'CREATE_USERS', 'RESET_PASSWORDS', 'RESET_CLIENT_PASSWORDS'],
}

const initialForm: UserForm = {
  tenantId: '',
  name: '',
  email: '',
  password: '123456',
  role: 'MASTER_ADMIN',
  permissions: rolePermissionTemplates.MASTER_ADMIN,
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Nao foi possivel concluir a acao.'
  }

  try {
    const parsed = JSON.parse(error.message)
    return Array.isArray(parsed.message)
      ? parsed.message.join(', ')
      : parsed.message || error.message
  } catch {
    return error.message
  }
}

function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/15',
        className,
      )}
      {...props}
    />
  )
}

export default function UsuariosPage() {
  const [users, setUsers] = React.useState<User[]>([])
  const [tenants, setTenants] = React.useState<TenantOption[]>([])
  const [form, setForm] = React.useState<UserForm>(initialForm)
  const [currentRole, setCurrentRole] = React.useState('MASTER_ADMIN')
  const [currentPermissions, setCurrentPermissions] = React.useState<string[]>([])
  const [resetTarget, setResetTarget] = React.useState<User | null>(null)
  const [resetPassword, setResetPassword] = React.useState('123456')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isResetting, setIsResetting] = React.useState(false)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  const canDeleteUsers = currentRole === 'MASTER_OWNER'
  const canToggleUsers = hasPermission('CREATE_USERS', { role: currentRole, permissions: currentPermissions })
  const canResetPassword =
    hasPermission('RESET_PASSWORDS', { role: currentRole, permissions: currentPermissions })
  const creatableRoles =
    currentRole === 'MASTER_OWNER'
      ? roles
      : currentRole === 'MASTER_ADMIN'
        ? roles.filter((role) => role !== 'MASTER_OWNER')
        : currentRole === 'SUPPORT'
          ? ['SUPPORT']
          : []

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [usersData, tenantsData] = await Promise.all([
        apiFetch<User[]>('/users'),
        apiFetch<TenantOption[]>('/tenants'),
      ])

      setUsers(usersData)
      setTenants(tenantsData)

      const masterTenant =
        tenantsData.find((tenant) => tenant.slug === 'megastech-master') ??
        tenantsData.find((tenant) => tenant.name.toLowerCase().includes('master'))

      setForm((current) => ({
        ...current,
        tenantId: current.tenantId || masterTenant?.id || '',
      }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const storedRole = localStorage.getItem('userRole') || 'MASTER_ADMIN'
    const storedPermissions = getStoredPermissions()
    setCurrentRole(storedRole)
    setCurrentPermissions(storedPermissions)
    setForm((current) => ({
      ...current,
      role: storedRole === 'SUPPORT' ? 'SUPPORT' : current.role,
      permissions:
        storedRole === 'SUPPORT'
          ? rolePermissionTemplates.SUPPORT
          : current.permissions,
    }))
    loadData()
  }, [loadData])

  function updateForm(field: keyof UserForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'role'
        ? {
            permissions: rolePermissionTemplates[value] || [],
          }
        : {}),
    }))
  }

  function togglePermission(permission: string) {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }))
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      if (!form.tenantId) {
        throw new Error('Tenant master nao encontrado. Crie ou verifique o tenant megastech-master.')
      }

      if (!creatableRoles.includes(form.role)) {
        throw new Error('Seu perfil nao permite criar usuario com este nivel.')
      }

      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: form.tenantId,
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          permissions: form.permissions,
          isActive: true,
        }),
      })

      setSuccess('Usuario criado com sucesso.')
      setForm({
        ...initialForm,
        tenantId: form.tenantId,
        permissions: rolePermissionTemplates[form.role] || [],
      })
      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleUser(user: User) {
    if (!canToggleUsers) {
      setError('Seu perfil nao permite ativar ou desativar usuarios.')
      return
    }

    setError('')
    setSuccess('')

    try {
      await apiFetch(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      })

      setSuccess(user.isActive ? 'Usuario desativado.' : 'Usuario ativado.')
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function removeUser(user: User) {
    if (!canDeleteUsers) {
      setError('Seu perfil nao permite excluir usuarios.')
      return
    }

    const confirmed = window.confirm(`Excluir o usuario ${user.email}?`)

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await apiFetch(`/users/${user.id}`, {
        method: 'DELETE',
      })
      setSuccess('Usuario excluido.')
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function resetUserPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!resetTarget) return

    setIsResetting(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/users/${resetTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          password: resetPassword,
        }),
      })

      setSuccess(`Senha de ${resetTarget.email} redefinida.`)
      setResetTarget(null)
      setResetPassword('123456')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Usuarios"
        description="Equipe interna da Megas Food com acesso ao painel master."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Convidar usuario
            </Button>
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
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  Carregando usuarios...
                </TableCell>
              </TableRow>
            ) : users.filter((user) => roles.includes(user.role)).length ? (
              users.filter((user) => roles.includes(user.role)).map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
                  <TableCell className="text-slate-500">{user.email}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-900">{roleLabels[user.role] || user.role}</p>
                      <p className="max-w-xs text-xs text-slate-500">{roleDescriptions[user.role]}</p>
                      {user.permissions?.length ? (
                        <p className="mt-1 text-[11px] font-semibold text-slate-400">
                          {user.permissions.length} permissoes
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'success' : 'default'}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {canResetPassword ? (
                        <Button variant="outline" size="sm" onClick={() => setResetTarget(user)}>
                          <KeyRound className="h-4 w-4" />
                          Senha
                        </Button>
                      ) : null}
                      {canToggleUsers ? (
                        <Button variant="outline" size="sm" onClick={() => toggleUser(user)}>
                          {user.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                      ) : null}
                      {canDeleteUsers ? (
                        <Button variant="destructive" size="sm" onClick={() => removeUser(user)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  Nenhum usuario interno cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent className="max-w-2xl">
          <form onSubmit={createUser}>
            <ModalHeader>
              <ModalTitle>Convidar usuario</ModalTitle>
              <ModalDescription>
                Crie um funcionario interno da Megas Food com acesso ao painel master.
              </ModalDescription>
            </ModalHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Papel</label>
                <Select value={form.role} onChange={(event) => updateForm('role', event.target.value)}>
                  {creatableRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </Select>
                <p className="text-xs font-medium leading-relaxed text-slate-500">
                  {roleDescriptions[form.role]}
                </p>
              </div>

              <div className="grid gap-3 sm:col-span-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">Permissoes deste funcionario</label>
                  <p className="text-xs font-medium text-slate-500">
                    Ajuste exatamente o que este funcionario pode acessar ou alterar.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {permissionOptions.map((permission) => {
                    const checked = form.permissions.includes(permission.id)
                    const disabled =
                      currentRole === 'SUPPORT' &&
                      (permission.id === 'VIEW_FINANCIAL_DATA' ||
                        form.role !== 'SUPPORT')

                    return (
                      <label
                        key={permission.id}
                        className={cn(
                          'flex cursor-pointer gap-3 rounded-2xl border p-3 transition',
                          checked
                            ? 'border-orange-300 bg-orange-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50',
                          disabled && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1 h-4 w-4 accent-orange-600"
                        />
                        <span>
                          <span className="block text-sm font-black text-slate-900">
                            {permission.label}
                          </span>
                          <span className="block text-xs font-medium leading-relaxed text-slate-500">
                            {permission.description}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Nome</label>
                <Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Email</label>
                <Input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} required />
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-slate-700">Senha inicial</label>
                <Input type="password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} required />
              </div>

              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium leading-relaxed text-slate-500 sm:col-span-2">
                Usuarios de pizzarias clientes ficam fora desta tela. Eles devem ser gerenciados dentro do cadastro de cada cliente.
              </p>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving || !tenants.length || !form.tenantId || !creatableRoles.length}>
                {isSaving ? 'Criando...' : 'Criar usuario'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal open={Boolean(resetTarget)} onOpenChange={(open) => !open && setResetTarget(null)}>
        <ModalContent className="max-w-md">
          <form onSubmit={resetUserPassword}>
            <ModalHeader>
              <ModalTitle>Redefinir senha</ModalTitle>
              <ModalDescription>
                Defina uma nova senha inicial para {resetTarget?.email}.
              </ModalDescription>
            </ModalHeader>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">Nova senha</label>
              <Input
                type="password"
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setResetTarget(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isResetting}>
                {isResetting ? 'Salvando...' : 'Redefinir senha'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </PageContainer>
  )
}
