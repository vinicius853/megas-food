import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  SendWhatsAppMessageInput,
  SendWhatsAppMessageResult,
} from '../types/whatsapp.types';
import { WhatsAppProviderAdapter } from './whatsapp-provider.interface';

@Injectable()
export class EvolutionApiAdapter implements WhatsAppProviderAdapter {
  constructor(private readonly configService: ConfigService) {}

  isConfigured() {
    return Boolean(this.getBaseUrl() && this.getApiKey());
  }

  async sendText(
    input: SendWhatsAppMessageInput,
  ): Promise<SendWhatsAppMessageResult> {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    if (!baseUrl || !apiKey) {
      throw new Error('Evolution API nao configurada.');
    }

    const response = await fetch(
      `${baseUrl}/message/sendText/${encodeURIComponent(input.instanceName)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: input.recipient,
          text: input.text,
        }),
      },
    );

    const payload = (await response.json().catch(() => null)) as Record<
      string,
      any
    > | null;

    if (!response.ok) {
      throw new Error(
        String(
          payload?.message ?? `Evolution API respondeu ${response.status}.`,
        ),
      );
    }

    return {
      messageId:
        String(payload?.key?.id ?? payload?.messageId ?? '') || undefined,
    };
  }

  private getBaseUrl() {
    return this.configService
      .get<string>('EVOLUTION_API_URL')
      ?.trim()
      .replace(/\/+$/, '');
  }

  private getApiKey() {
    return this.configService.get<string>('EVOLUTION_API_KEY')?.trim();
  }
}
