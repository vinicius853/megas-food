import Link from "next/link";
import { ArrowLeft, MessageCircle, ShieldCheck } from "lucide-react";

import {
  LEGAL_CONTACT_URL,
  LEGAL_LAST_UPDATED_LABEL,
  PRIVACY_POLICY_VERSION,
  type LegalSection,
} from "@/lib/legal";

type LegalPageProps = {
  title: string;
  description: string;
  sections: LegalSection[];
};

export function LegalPage({ title, description, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:py-12">
      <article className="mx-auto w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-950 px-6 py-8 text-white sm:px-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="mt-7 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-orange-400">
                Megas Food
              </p>
              <h1 className="mt-1 text-3xl font-black">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                {description}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Versão {PRIVACY_POLICY_VERSION} · Atualizada em{" "}
                {LEGAL_LAST_UPDATED_LABEL}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-black text-slate-950">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 text-sm leading-7 text-slate-600"
                >
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
            <p className="font-black text-slate-950">
              Adequação inicial para o MVP
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Este documento descreve a implementação técnica atual e deverá
              passar por revisão jurídica antes da operação em escala.
            </p>
            <a
              href={LEGAL_CONTACT_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 font-bold text-orange-700"
            >
              <MessageCircle className="h-4 w-4" />
              Falar sobre privacidade
            </a>
          </div>
        </div>
      </article>
    </main>
  );
}
