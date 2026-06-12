export type WhatsAppEvent =
  | "ORDER_CREATED"
  | "ORDER_CONFIRMED"
  | "ORDER_CANCELLED"
  | "ORDER_READY"
  | "ORDER_OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED";

export type WhatsAppSettings = {
  automationEnabled: boolean;
  enabledEvents: WhatsAppEvent[];
  status: "DISCONNECTED" | "AWAITING_CONFIGURATION" | "CONNECTED" | "ERROR";
  connectedPhone: string | null;
  recipientPhone: string | null;
  lastError: string | null;
  lastConnectedAt: string | null;
  provider: "EVOLUTION_API";
  providerConfigured: boolean;
  qrCodeAvailable: boolean;
};
