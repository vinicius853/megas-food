import {
  SendWhatsAppMessageInput,
  SendWhatsAppMessageResult,
} from '../types/whatsapp.types';

export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');

export interface WhatsAppProviderAdapter {
  isConfigured(): boolean;
  sendText(input: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult>;
}
