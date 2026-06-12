import { LegalPage } from "@/components/legal/legal-page";
import { termsSections } from "@/lib/legal";

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      description="Condições básicas para uso do cardápio digital, envio de pedidos e acesso administrativo à plataforma Megas Food."
      sections={termsSections}
    />
  );
}
