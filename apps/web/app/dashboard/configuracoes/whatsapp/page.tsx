"use client";

import { PageContainer, PageHeader } from "@/components/layout/page-container";

import { WhatsAppSettingsContent } from "./whatsapp-settings-content";

export default function WhatsAppSettingsPage() {
  return (
    <PageContainer size="narrow">
      <PageHeader
        title="WhatsApp"
        description="Automatize atualizacoes de pedido sem interromper a operacao."
      />

      <WhatsAppSettingsContent />
    </PageContainer>
  );
}
