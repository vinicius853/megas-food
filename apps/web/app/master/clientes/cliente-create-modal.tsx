import type { FormEvent } from 'react'

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
import type { TenantForm } from './clientes.types'

type ClienteCreateModalProps = {
  isOpen: boolean
  form: TenantForm
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onChange: (field: keyof TenantForm, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
}

export function ClienteCreateModal({
  isOpen,
  form,
  isSaving,
  onOpenChange,
  onChange,
  onSubmit,
  onClose,
}: ClienteCreateModalProps) {
  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <ModalHeader>
            <ModalTitle>Nova pizzaria</ModalTitle>
            <ModalDescription>
              Crie o cliente e o primeiro acesso do dono da pizzaria.
            </ModalDescription>
          </ModalHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">Nome da pizzaria</label>
              <Input value={form.name} onChange={(event) => onChange('name', event.target.value)} required />
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
              <Input value={form.ownerName} onChange={(event) => onChange('ownerName', event.target.value)} required />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">Email do dono</label>
              <Input type="email" value={form.ownerEmail} onChange={(event) => onChange('ownerEmail', event.target.value)} required />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">Senha inicial</label>
              <Input type="password" value={form.ownerPassword} onChange={(event) => onChange('ownerPassword', event.target.value)} required minLength={6} />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">WhatsApp</label>
              <Input value={form.whatsapp} onChange={(event) => onChange('whatsapp', event.target.value)} required />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">CPF ou CNPJ</label>
              <Input value={form.document} onChange={(event) => onChange('document', event.target.value)} required />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">Cidade</label>
              <Input value={form.city} onChange={(event) => onChange('city', event.target.value)} required />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">Estado</label>
              <Input value={form.state} onChange={(event) => onChange('state', event.target.value)} required maxLength={2} placeholder="RJ" />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">CEP</label>
              <Input value={form.zipCode} onChange={(event) => onChange('zipCode', event.target.value)} placeholder="27320-360" />
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700">Endereco completo</label>
              <Input value={form.address} onChange={(event) => onChange('address', event.target.value)} placeholder="Rua, numero, bairro" />
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700">Observacoes internas</label>
              <textarea
                value={form.internalNotes}
                onChange={(event) => onChange('internalNotes', event.target.value)}
                className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-orange-500"
                placeholder="Informacoes administrativas visiveis apenas no Master."
              />
            </div>
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Criando...' : 'Criar pizzaria'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
