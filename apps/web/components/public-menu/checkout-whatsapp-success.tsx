'use client'

import { CheckCircle2, MessageCircle, X } from 'lucide-react'

type CheckoutWhatsAppSuccessProps = {
  orderNumber?: number
  whatsappUrl?: string
  popupBlocked: boolean
  primaryColor: string
  textOnPrimary: string
  onConfirm: () => void
  onClose: () => void
}

export function CheckoutWhatsAppSuccess({
  orderNumber,
  whatsappUrl,
  popupBlocked,
  primaryColor,
  textOnPrimary,
  onConfirm,
  onClose,
}: CheckoutWhatsAppSuccessProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white">
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar confirmação"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-9 w-9" />
        </span>

        <h2 className="mt-5 text-2xl font-black text-slate-900">
          Pedido registrado com sucesso
        </h2>

        {orderNumber && (
          <p className="mt-2 text-sm font-bold text-slate-600">
            Pedido #{orderNumber}
          </p>
        )}

        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
          Agora confirme pelo WhatsApp da loja. A mensagem completa do pedido já
          está preenchida para você enviar.
        </p>

        {popupBlocked && whatsappUrl && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
            O navegador não abriu o WhatsApp automaticamente. Use o botão
            abaixo.
          </p>
        )}

        {!whatsappUrl && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
            O pedido foi registrado, mas o WhatsApp da loja não está
            configurado.
          </p>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-5">
        <button
          type="button"
          onClick={onConfirm}
          disabled={!whatsappUrl}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: primaryColor, color: textOnPrimary }}
        >
          <MessageCircle className="h-5 w-5" />
          Confirmar no WhatsApp
        </button>
      </div>
    </div>
  )
}
