import { WhatsAppEventType } from '@prisma/client';

export type WhatsAppOrderSnapshot = {
  id: string;
  number: number;
  customerName: string | null;
  customerPhone: string | null;
  type: string;
  total: unknown;
  items: Array<{
    name: string;
    quantity: number;
    modifiers: Array<{
      groupName: string;
      optionName: string;
      fraction: unknown;
      totalDelta: unknown;
    }>;
  }>;
};

export type SendWhatsAppMessageInput = {
  instanceName: string;
  recipient: string;
  text: string;
};

export type SendWhatsAppMessageResult = {
  messageId?: string;
};

export type EnqueueOrderEventInput = {
  tenantId: string;
  orderId: string;
  eventType: WhatsAppEventType;
};
