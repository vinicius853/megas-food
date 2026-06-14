import { WhatsAppConnectionStatus, WhatsAppEventType } from '@prisma/client';

type WhatsAppAutomationConnection = {
  automationEnabled: boolean;
  status: WhatsAppConnectionStatus;
  instanceName: string | null;
  enabledEvents: WhatsAppEventType[];
};

export function canUseAutomaticWhatsAppNotification(
  connection: WhatsAppAutomationConnection | null | undefined,
  eventType: WhatsAppEventType,
  providerConfigured: boolean,
) {
  return Boolean(
    providerConfigured &&
    connection?.automationEnabled &&
    connection.status === WhatsAppConnectionStatus.CONNECTED &&
    connection.instanceName?.trim() &&
    connection.enabledEvents.includes(eventType),
  );
}
