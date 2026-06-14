import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { TenantSegmentSelector } from "@/components/segments/tenant-segment-selector";
import type { TenantForm } from "./clientes.types";
import type { TenantSegment } from "@/lib/segments/segment-types";

type ClienteCreateModalProps = {
  isOpen: boolean;
  form: TenantForm;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (field: keyof TenantForm, value: string | TenantSegment[]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

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
      <ModalContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)]">
        <form
          onSubmit={onSubmit}
          className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col sm:max-h-[calc(100dvh-3rem)]"
        >
          <ModalHeader className="mb-0 shrink-0 border-b border-slate-100 px-5 py-5 pr-12 sm:px-6">
            <ModalTitle>Novo cliente</ModalTitle>
            <ModalDescription>
              Crie a operacao, habilite os segmentos e defina o primeiro acesso.
            </ModalDescription>
          </ModalHeader>

          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-5 py-5 pb-28 overscroll-contain sm:grid-cols-2 sm:px-6 sm:pb-28">
            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Nome da operacao
              </label>
              <Input
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                URL publica gerada
              </label>
              <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 shadow-sm">
                /c/{form.slug || "nome-da-operacao"}
              </div>
              <p className="text-xs font-medium text-slate-500">
                O sistema gera automaticamente pelo nome da operacao.
              </p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Nome do dono
              </label>
              <Input
                value={form.ownerName}
                onChange={(event) => onChange("ownerName", event.target.value)}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Email do dono
              </label>
              <Input
                type="email"
                value={form.ownerEmail}
                onChange={(event) => onChange("ownerEmail", event.target.value)}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Senha inicial
              </label>
              <Input
                type="password"
                value={form.ownerPassword}
                onChange={(event) =>
                  onChange("ownerPassword", event.target.value)
                }
                required
                minLength={6}
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                WhatsApp
              </label>
              <Input
                value={form.whatsapp}
                onChange={(event) => onChange("whatsapp", event.target.value)}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                CPF ou CNPJ
              </label>
              <Input
                value={form.document}
                onChange={(event) => onChange("document", event.target.value)}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">Cidade</label>
              <Input
                value={form.city}
                onChange={(event) => onChange("city", event.target.value)}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">Estado</label>
              <Input
                value={form.state}
                onChange={(event) => onChange("state", event.target.value)}
                required
                maxLength={2}
                placeholder="RJ"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">CEP</label>
              <Input
                value={form.zipCode}
                onChange={(event) => onChange("zipCode", event.target.value)}
                placeholder="27320-360"
              />
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700">
                Endereco completo
              </label>
              <Input
                value={form.address}
                onChange={(event) => onChange("address", event.target.value)}
                placeholder="Rua, numero, bairro"
              />
            </div>

            <TenantSegmentSelector
              value={form.enabledSegments}
              onChange={(segments) => onChange("enabledSegments", segments)}
            />

            <div className="grid gap-1.5 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700">
                Observacoes internas
              </label>
              <textarea
                value={form.internalNotes}
                onChange={(event) =>
                  onChange("internalNotes", event.target.value)
                }
                className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-orange-500"
                placeholder="Informacoes administrativas visiveis apenas no Master."
              />
            </div>
          </div>

          <ModalFooter className="sticky bottom-0 z-10 mt-0 shrink-0 border-t border-slate-200 bg-white/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Criando..." : "Criar cliente"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
