import { LegalPage } from "@/components/legal/legal-page";
import { privacySections } from "@/lib/legal";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      description="Como a Megas Food e os estabelecimentos que utilizam a plataforma tratam dados pessoais no cardápio, nos pedidos e na administração do serviço."
      sections={privacySections}
    />
  );
}
