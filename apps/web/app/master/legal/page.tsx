import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LEGAL_LAST_UPDATED_LABEL, PRIVACY_POLICY_VERSION } from "@/lib/legal";

const legalLinks = [
  {
    label: "Política de Privacidade",
    href: "/privacidade",
    description: "Tratamento de dados no cardápio, pedidos e plataforma.",
  },
  {
    label: "Termos de Uso",
    href: "/termos",
    description: "Condições para clientes, estabelecimentos e administradores.",
  },
];

export default function MasterLegalPage() {
  return (
    <PageContainer size="narrow">
      <PageHeader
        title="LGPD / Legal"
        description="Referência versionada dos documentos públicos da plataforma."
      />

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Versão vigente</CardTitle>
              <CardDescription>
                Configuração técnica inicial para o MVP. Mudanças de conteúdo
                devem gerar uma nova versão e revisão jurídica.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">
                Versão
              </dt>
              <dd className="mt-1 font-black text-slate-950">
                {PRIVACY_POLICY_VERSION}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">
                Última atualização
              </dt>
              <dd className="mt-1 font-black text-slate-950">
                {LEGAL_LAST_UPDATED_LABEL}
              </dd>
            </div>
          </dl>

          <div className="mt-5 grid gap-3">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                target="_blank"
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 hover:border-orange-300 hover:bg-orange-50"
              >
                <span>
                  <span className="block font-black text-slate-950">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    {item.description}
                  </span>
                </span>
                <ExternalLink className="h-5 w-5 shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
