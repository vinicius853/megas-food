import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  SendWhatsAppMessageInput,
  SendWhatsAppMessageResult,
} from '../types/whatsapp.types';
import {
  EvolutionConnectionState,
  EvolutionInstance,
  EvolutionQrCode,
} from './evolution-api.types';
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
    const payload = await this.request<Record<string, any>>(
      `/message/sendText/${encodeURIComponent(input.instanceName)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          number: input.recipient,
          text: input.text,
        }),
      },
    );

    return {
      messageId:
        String(payload?.key?.id ?? payload?.messageId ?? '') || undefined,
    };
  }

  async createInstance(instanceName: string) {
    return this.request<Record<string, any>>('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: this.sanitizeInstanceName(instanceName),
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      }),
    });
  }

  async connectInstance(instanceName: string): Promise<EvolutionQrCode> {
    const payload = await this.request<Record<string, any>>(
      `/instance/connect/${encodeURIComponent(
        this.sanitizeInstanceName(instanceName),
      )}`,
    );

    return this.normalizeQrCode(payload);
  }

  async fetchInstances(instanceName?: string): Promise<EvolutionInstance[]> {
    const query = instanceName
      ? `?instanceName=${encodeURIComponent(
          this.sanitizeInstanceName(instanceName),
        )}`
      : '';
    const payload = await this.request<unknown>(
      `/instance/fetchInstances${query}`,
    );
    const records = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as any)?.response)
        ? (payload as any).response
        : [];

    return records
      .map((record: any) => record?.instance ?? record)
      .map((instance: any) => ({
        instanceName: String(
          instance?.instanceName ?? instance?.name ?? '',
        ).trim(),
        status: this.readOptionalString(
          instance?.status ?? instance?.connectionStatus,
        ),
        owner: this.readOptionalString(
          instance?.owner ?? instance?.ownerJid ?? instance?.number,
        ),
      }))
      .filter((instance) => Boolean(instance.instanceName));
  }

  async getConnectionStatus(
    instanceName: string,
  ): Promise<EvolutionConnectionState> {
    const payload = await this.request<Record<string, any>>(
      `/instance/connectionState/${encodeURIComponent(
        this.sanitizeInstanceName(instanceName),
      )}`,
    );
    const instance = payload?.instance ?? payload;

    return {
      state: String(
        instance?.state ?? instance?.status ?? instance?.connectionStatus ?? '',
      ).toLowerCase(),
      connectedPhone: this.normalizeConnectedPhone(
        instance?.owner ?? instance?.ownerJid ?? instance?.number,
      ),
    };
  }

  sanitizeInstanceName(value: string) {
    const sanitized = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^[-_]+|[-_]+$/g, '')
      .slice(0, 50);

    if (!sanitized) {
      throw new Error('Nome da instancia do WhatsApp invalido.');
    }

    return sanitized;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    if (!baseUrl || !apiKey) {
      throw new Error('Evolution API nao configurada.');
    }

    let response: Response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha de conexao.';
      throw new Error(`Evolution API indisponivel: ${message}`);
    }

    const payload = (await response.json().catch(() => null)) as T | null;

    if (!response.ok) {
      const providerMessage = this.extractErrorMessage(payload);
      throw new Error(
        providerMessage || `Evolution API respondeu ${response.status}.`,
      );
    }

    return (payload ?? ({} as T)) as T;
  }

  private normalizeQrCode(payload: Record<string, any>): EvolutionQrCode {
    const qrPayload = payload?.qrcode ?? payload?.qrCode ?? payload;
    const base64 = this.readOptionalString(
      qrPayload?.base64 ??
        payload?.base64 ??
        qrPayload?.qrCodeBase64 ??
        payload?.qrCodeBase64,
    );
    const code = this.readOptionalString(
      qrPayload?.code ?? payload?.code ?? qrPayload?.qrCode ?? payload?.qrCode,
    );

    return {
      qrCodeBase64: base64
        ? base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
        : undefined,
      qrCode: code,
    };
  }

  private extractErrorMessage(payload: unknown) {
    if (!payload || typeof payload !== 'object') return '';
    const record = payload as Record<string, any>;
    const message =
      record.message ?? record.error ?? record.response?.message ?? '';

    return Array.isArray(message)
      ? message.map(String).join(', ')
      : String(message || '');
  }

  private normalizeConnectedPhone(value: unknown) {
    const phone = this.readOptionalString(value);
    if (!phone) return undefined;
    return phone.split('@')[0]?.replace(/\D/g, '') || undefined;
  }

  private readOptionalString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
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
