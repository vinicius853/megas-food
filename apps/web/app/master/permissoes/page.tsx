'use client'

import * as React from 'react'
import { Plus, ShieldCheck } from 'lucide-react'

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
import { Input } from '@/components/ui/input'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal'

type RoleCard = {
  nome: string
  descricao: string
  permissoes: string[]
  usuarios: number
}

const initialRoles: RoleCard[] = [
  {
    nome: 'Owner',
    descricao: 'Acesso irrestrito a todos os modulos da plataforma.',
    permissoes: ['Tudo'],
    usuarios: 1,
  },
  {
    nome: 'Admin',
    descricao: 'Gerencia clientes, usuarios e financeiro.',
    permissoes: ['Clientes', 'Usuarios', 'Financeiro', 'Auditoria'],
    usuarios: 0,
  },
  {
    nome: 'Suporte',
    descricao: 'Visualizacao e suporte aos clientes.',
    permissoes: ['Clientes leitura', 'Auditoria'],
    usuarios: 0,
  },
  {
    nome: 'Financeiro',
    descricao: 'Acesso a faturamento e relatorios financeiros.',
    permissoes: ['Financeiro'],
    usuarios: 0,
  },
]

export default function PermissoesPage() {
  const [roles, setRoles] = React.useState(initialRoles)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [permissions, setPermissions] = React.useState('')
  const [message, setMessage] = React.useState('')

  function createRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setRoles((current) => [
      ...current,
      {
        nome: name,
        descricao: description,
        permissoes: permissions
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        usuarios: 0,
      },
    ])

    setName('')
    setDescription('')
    setPermissions('')
    setIsModalOpen(false)
    setMessage('Papel criado localmente. Persistencia sera ligada quando o modulo de permissoes tiver backend.')
  }

  return (
    <PageContainer>
      <PageHeader
        title="Permissoes"
        description="Papeis e niveis de acesso da equipe interna."
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo papel
          </Button>
        }
      />

      {message ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.nome}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{role.nome}</CardTitle>
                    <CardDescription>{role.descricao}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline">{role.usuarios} usuarios</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {role.permissoes.map((permission) => (
                  <Badge key={permission} variant="default">
                    {permission}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <form onSubmit={createRole}>
            <ModalHeader>
              <ModalTitle>Novo papel</ModalTitle>
              <ModalDescription>
                Crie um papel visual para organizar a equipe. Esta versao ainda nao altera permissoes reais no backend.
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Nome</label>
                <Input value={name} onChange={(event) => setName(event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Descricao</label>
                <Input value={description} onChange={(event) => setDescription(event.target.value)} required />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">Permissoes</label>
                <Input
                  value={permissions}
                  onChange={(event) => setPermissions(event.target.value)}
                  placeholder="Clientes, Financeiro, Auditoria"
                  required
                />
              </div>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Criar papel
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </PageContainer>
  )
}
