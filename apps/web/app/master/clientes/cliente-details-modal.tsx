import { CreditCard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { DetailItem } from './clientes-detail-item'
import { formatCep, maskCpfCnpj, formatDate, formatFullDate, formatMoney, formatPhone, getCurrentSubscription, getPlanName } from './clientes-formatters'
import type { Tenant } from './clientes.types'
import { SEGMENT_REGISTRY } from '@/lib/segments/segment-registry'

type ClienteDetailsModalProps = {
  tenant: Tenant | null
  canCreateClients: boolean
  canManagePlans: boolean
  onClose: () => void
  onOpenEdit: (tenant: Tenant) => void
  onOpenChangePlan: (tenant: Tenant) => void
}

export function ClienteDetailsModal({ tenant, canCreateClients, canManagePlans, onClose, onOpenEdit, onOpenChangePlan }: ClienteDetailsModalProps) {
  return (
    <Modal open={Boolean(tenant)} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto p-4 sm:p-6">
        {tenant ? (
          <>
            <ModalHeader>
              <ModalTitle>{tenant.name}</ModalTitle>
              <ModalDescription>Dados administrativos internos para suporte, cobranca e auditoria.</ModalDescription>
            </ModalHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Codigo interno" value={tenant.internalCode || 'Sem codigo'} />
              <DetailItem label="Slug" value={`/c/${tenant.slug}`} />
              <DetailItem label="Responsavel" value={tenant.responsibleName || tenant.users?.find((user) => user.role === 'CLIENT_OWNER')?.name || '-'} />
              <DetailItem label="Email" value={tenant.users?.find((user) => user.role === 'CLIENT_OWNER')?.email || '-'} />
              <DetailItem label="WhatsApp" value={formatPhone(tenant.whatsapp)} />
              <DetailItem label="CPF/CNPJ" value={maskCpfCnpj(tenant.document)} />
              <DetailItem label="Cidade" value={tenant.city || '-'} />
              <DetailItem label="Estado" value={tenant.state || '-'} />
              <DetailItem label="Endereco completo" value={tenant.address || '-'} />
              <DetailItem label="CEP" value={formatCep(tenant.zipCode)} />
              <DetailItem label="Status" value={tenant.isActive ? 'Ativo' : 'Inativo'} />
              <DetailItem
                label="Segmentos"
                value={(tenant.enabledSegments || ['PIZZARIA'])
                  .map((segment) => SEGMENT_REGISTRY[segment].label)
                  .join(', ')}
              />
              <DetailItem label="Data de cadastro" value={formatDate(tenant.createdAt)} />
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 sm:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-orange-700">Plano atual</p>
                    <p className="mt-1 text-base font-black text-slate-950">{getPlanName(tenant)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">Valor contratado: {getCurrentSubscription(tenant) ? formatMoney(getCurrentSubscription(tenant)?.contractedMonthlyPrice) : '-'}</p>
                  </div>
                  {canManagePlans ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClose()
                        onOpenChangePlan(tenant)
                      }}
                    >
                      <CreditCard className="h-4 w-4" />
                      Alterar plano
                    </Button>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <DetailItem label="Valor atual do plano" value={getCurrentSubscription(tenant)?.plan ? formatMoney(getCurrentSubscription(tenant)?.plan?.monthlyPrice) : '-'} />
                  <DetailItem label="Status da assinatura" value={getCurrentSubscription(tenant)?.status || 'Sem assinatura'} />
                  <DetailItem label="Contratado em" value={formatFullDate(getCurrentSubscription(tenant)?.contractedAt)} />
                  <DetailItem label="Proximo vencimento" value={formatFullDate(getCurrentSubscription(tenant)?.nextBillingDate)} />
                  <DetailItem label="Acesso ate" value={formatFullDate(getCurrentSubscription(tenant)?.accessUntil)} />
                  <DetailItem label="Valor de implantacao" value={getCurrentSubscription(tenant)?.contractedSetupFee ? formatMoney(getCurrentSubscription(tenant)?.contractedSetupFee) : '-'} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs font-black uppercase text-slate-400">Observacoes internas</p>
                <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-700">{tenant.internalNotes || 'Sem observacoes.'}</p>
              </div>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Fechar
              </Button>
              {canCreateClients ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    onClose()
                    onOpenEdit(tenant)
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
  )
}
