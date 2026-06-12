import Link from "next/link";

export function PublicLegalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-7 text-center sm:px-8">
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
        <Link href="/privacidade" className="hover:text-slate-950">
          Política de Privacidade
        </Link>
        <Link href="/termos" className="hover:text-slate-950">
          Termos de Uso
        </Link>
      </nav>
      <p className="mt-3 text-[11px] text-slate-400">
        Megas Food · Cardápio digital e pedidos online
      </p>
    </footer>
  );
}
