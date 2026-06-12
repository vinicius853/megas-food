import Link from "next/link";
import { ShieldCheck } from "lucide-react";

type CheckoutPrivacyConsentProps = {
  accepted: boolean;
  error?: string;
  onChange: (accepted: boolean) => void;
};

export function CheckoutPrivacyConsent({
  accepted,
  error,
  onChange,
}: CheckoutPrivacyConsentProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        error ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-slate-950"
          aria-invalid={Boolean(error)}
        />
        <span className="text-xs leading-5 text-slate-600">
          <span className="mb-1 flex items-center gap-2 font-black text-slate-900">
            <ShieldCheck className="h-4 w-4" />
            Consentimento para o pedido
          </span>
          Li e aceito a{" "}
          <Link
            href="/privacidade"
            target="_blank"
            className="font-bold text-slate-950 underline underline-offset-2"
          >
            Política de Privacidade
          </Link>{" "}
          e autorizo o uso dos meus dados para processamento do pedido.
        </span>
      </label>
      {error ? (
        <p className="mt-3 text-xs font-bold text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
