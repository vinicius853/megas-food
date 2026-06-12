"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

import { hasCookieConsent, saveCookieConsent } from "./cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasCookieConsent(window.localStorage));
  }, []);

  function acceptCookies() {
    saveCookieConsent(window.localStorage);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-4 shadow-2xl sm:bottom-5 sm:flex sm:items-center sm:gap-5"
    >
      <div className="flex min-w-0 gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
          <Cookie className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-950">
            Privacidade e armazenamento local
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Usamos recursos essenciais para manter preferências, sessão e
            funcionamento do cardápio.
          </p>
        </div>
      </div>
      <div className="mt-4 flex shrink-0 items-center gap-3 sm:mt-0">
        <Link
          href="/privacidade"
          className="text-xs font-bold text-slate-600 underline underline-offset-4"
        >
          Ver política
        </Link>
        <button
          type="button"
          onClick={acceptCookies}
          className="h-10 rounded-lg bg-slate-950 px-5 text-xs font-black text-white hover:bg-slate-800"
        >
          Aceitar
        </button>
      </div>
    </aside>
  );
}
