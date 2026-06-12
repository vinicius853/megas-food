import type { FormEvent } from 'react'

import { TenantSegmentSelector } from '@/components/segments/tenant-segment-selector'
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
import type { Tenant, TenantEditForm } from './clientes.types'

type ClienteEditModalProps = {
  tenant: Tenant | null
  form: TenantEditForm
  isSaving: boolean
  onClose: () => void
  onChange: (
    field: keyof TenantEditForm,
    value: string | TenantEditForm['enabledSegments'],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ClienteEditModal({
  tenant,
  form,
  isSaving,
  onClose,
  onChange,
  onSubmit,
}: ClienteEditModalProps) {
  return (
    <Modal open={Boolean(tenant)} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={onSubmit}>
          <ModalHeader>
            <ModalTitle>Editar cliente</ModalTitle>
            <ModalDescription>
              Atualize os dados administrativos e os segmentos habilitados.
            </ModalDescription>
          </ModalHeader>

          <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
              Codigo interno
            </p>
            <p className="mt-1 text-lg font-black text-slate-900">
              {tenant?.internalCode || 'Sem codigo'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do cliente">
              <Input
                value={form.name}
                onChange={(event) => onChange('name', event.target.value)}
                required
              />
            </Field>
            <Field label="Slug publico">
              <Input
                value={form.slug}
                onChange={(event) => onChange('slug', event.target.value)}
                required
              />
            </Field>
            <Field label="Responsavel">
              <Input
                value={form.responsibleName}
                onChange={(event) =>
                  onChange('responsibleName', event.target.value)
                }
                required
              />
            </Field>
            <Field label="CPF ou CNPJ">
              <Input
                value={form.document}
                onChange={(event) => onChange('document', event.target.value)}
                required
              />
            </Field>
            <Field label="WhatsApp">
              <Input
                value={form.whatsapp}
                onChange={(event) => onChange('whatsapp', event.target.value)}
                required
              />
            </Field>
            <Field label="Telefone">
              <Input
                value={form.phone}
                onChange={(event) => onChange('phone', event.target.value)}
              />
            </Field>
            <Field label="Cidade">
              <Input
                value={form.city}
                onChange={(event) => onChange('city', event.target.value)}
                required
              />
            </Field>
            <Field label="Estado">
              <Input
                value={form.state}
                onChange={(event) => onChange('state', event.target.value)}
                required
                maxLength={2}
              />
            </Field>
            <Field label="CEP">
              <Input
                value={form.zipCode}
                onChange={(event) => onChange('zipCode', event.target.value)}
              />
            </Field>
            <Field label="Endereco completo" wide>
              <Input
                value={form.address}
                onChange={(event) => onChange('address', event.target.value)}
              />
            </Field>

            <TenantSegmentSelector
              value={form.enabledSegments}
              onChange={(segments) => onChange('enabledSegments', segments)}
            />

            <Field label="Observacoes internas" wide>
              <textarea
                value={form.internalNotes}
                onChange={(event) =>
                  onChange('internalNotes', event.target.value)
                }
                className="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-orange-500"
              />
            </Field>
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar alteracoes'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`grid gap-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <label className="text-sm font-bold text-slate-700">{label}</label>
      {children}
    </div>
  )
}
