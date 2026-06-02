import Link from 'next/link'
import { CreditCard, ExternalLink, Eye, KeyRound, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatPhone, getPlanName } from './clientes-formatters'
import type { Tenant } from './clientes.types'

type ClientesTableProps = {
  tenants: Tenant[]
  isLoading: boolean
  canCreateClients: boolean
  canManageClients: boolean
  canDeleteClients: boolean
  canResetClientPassword: boolean
  canManagePlans: boolean
  onOpenDetails: (tenant: Tenant) => void
  onOpenEdit: (tenant: Tenant) => void
  onOpenResetPassword: (tenant: Tenant) => void
  onOpenChangePlan: (tenant: Tenant) => void
  onToggleTenant: (tenant: Tenant) => void
  onDeleteTenant: (tenant: Tenant) => void
}

export function ClientesTable({
  tenants,
  isLoading,
  canCreateClients,
  canManageClients,
  canDeleteClients,
  canResetClientPassword,
  canManagePlans,
  onOpenDetails,
  onOpenEdit,
  onOpenResetPassword,
  onOpenChangePlan,
  onToggleTenant,
  onDeleteTenant,
}: ClientesTableProps) {
  return (
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
                        onClick={() => onOpenDetails(tenant)}
                      >
                        <Eye className="h-4 w-4" />
                        Detalhes
                      </Button>
                      {canCreateClients ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenEdit(tenant)}
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
                          onClick={() => onOpenResetPassword(tenant)}
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
                          onClick={() => onOpenChangePlan(tenant)}
                        >
                          <CreditCard className="h-4 w-4" />
                          Plano
                        </Button>
                      ) : null}
                      {canManageClients ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleTenant(tenant)}
                        >
                          {tenant.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                      ) : null}
                      {canDeleteClients ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteTenant(tenant)}
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
  )
}
