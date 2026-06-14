import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  SendWhatsAppMessageInput,
  SendWhatsAppMessageResult,
} from '../types/whatsapp.types';
import {
  EvolutionConnectionState,
  EvolutionInstance,
  EvolutionInstanceProvisionResult,
  EvolutionQrCode,
} from './evolution-api.types';
import { WhatsAppProviderAdapter } from './whatsapp-provider.interface';

type JsonRecord = Record<string, unknown>;

@Injectable()
export class EvolutionApiAdapter implements WhatsAppProviderAdapter {
  constructor(private readonly configService: ConfigService) {}

  isConfigured() {
    return Boolean(this.getBaseUrl() && this.getApiKey());
  }

  async sendText(
    input: SendWhatsAppMessageInput,
  ): Promise<SendWhatsAppMessageResult> {
    const response = await this.request(
      `/message/sendText/${encodeURIComponent(input.instanceName)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          number: input.recipient,
          text: input.text,
        }),
      },
    );

    const payload = this.readRecord(response) ?? {};
    const key = this.readRecord(payload.key);
    const messageId = key?.id ?? payload.messageId;

    return { messageId: this.readOptionalScalarString(messageId) };
  }

  sendTextMessage(instanceName: string, phone: string, message: string) {
    return this.sendText({
      instanceName: this.sanitizeInstanceName(instanceName),
      recipient: phone,
      text: message,
    });
  }

  async createInstance(
    instanceName: string,
  ): Promise<EvolutionInstanceProvisionResult> {
    const sanitizedInstanceName = this.sanitizeInstanceName(instanceName);
    const response = await this.request('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: sanitizedInstanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      }),
    });
    const payload = this.readRecord(response) ?? {};

    const instance = this.readRecord(payload.instance) ?? payload;

    return {
      instance: {
        instanceName:
          this.readOptionalScalarString(
            instance.instanceName ?? instance.name,
          ) ?? sanitizedInstanceName,
        status: this.readOptionalString(
          instance.status ?? instance.connectionStatus,
        ),
        owner: this.readOptionalString(
          instance.owner ?? instance.ownerJid ?? instance.number,
        ),
      },
      qrCode: this.normalizeQrCode(payload),
    };
  }

  async connectInstance(instanceName: string): Promise<EvolutionQrCode> {
    const response = await this.request(
      `/instance/connect/${encodeURIComponent(
        this.sanitizeInstanceName(instanceName),
      )}`,
    );
    const payload = this.readRecord(response) ?? {};

    return this.normalizeQrCode(payload);
  }

  async fetchInstances(instanceName?: string): Promise<EvolutionInstance[]> {
    const expectedInstanceName = instanceName
      ? this.sanitizeInstanceName(instanceName)
      : undefined;
    const payload = await this.request('/instance/fetchInstances');
    const payloadRecord = this.readRecord(payload);
    const response = payloadRecord?.response;
    const records = Array.isArray(payload)
      ? payload
      : Array.isArray(response)
        ? response
        : [];

    return records
      .map((record) => this.readRecord(record))
      .map((record) => this.readRecord(record?.instance) ?? record)
      .filter((instance): instance is JsonRecord => Boolean(instance))
      .map((instance) => this.toEvolutionInstance(instance))
      .filter((instance) => Boolean(instance.instanceName))
      .filter(
        (instance) =>
          !expectedInstanceName ||
          instance.instanceName === expectedInstanceName,
      );
  }

  async getConnectionStatus(
    instanceName: string,
  ): Promise<EvolutionConnectionState> {
    const response = await this.request(
      `/instance/connectionState/${encodeURIComponent(
        this.sanitizeInstanceName(instanceName),
      )}`,
    );
    const payload = this.readRecord(response) ?? {};
    const instance = this.readRecord(payload.instance) ?? payload;

    return {
      state: (
        this.readOptionalScalarString(
          instance.state ?? instance.status ?? instance.connectionStatus,
        ) ?? ''
      ).toLowerCase(),
      connectedPhone: this.normalizeConnectedPhone(
        instance.owner ?? instance.ownerJid ?? instance.number,
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

  private async request(
    path: string,
    init: RequestInit = {},
  ): Promise<unknown> {
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

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const providerMessage = this.extractErrorMessage(payload);
      throw new Error(
        providerMessage || `Evolution API respondeu ${response.status}.`,
      );
    }

    return payload ?? {};
  }

  private normalizeQrCode(payload: JsonRecord): EvolutionQrCode {
    const instance = this.readRecord(payload.instance);
    const qrPayload =
      this.readRecord(payload.qrcode) ??
      this.readRecord(payload.qrCode) ??
      this.readRecord(payload.qr) ??
      this.readRecord(instance?.qrcode) ??
      payload;
    const base64 = this.readOptionalString(
      qrPayload.base64 ??
        payload.base64 ??
        instance?.base64 ??
        qrPayload.qrCodeBase64 ??
        payload.qrCodeBase64,
    );
    const code = this.readOptionalString(
      qrPayload.code ??
        payload.code ??
        instance?.code ??
        qrPayload.qrCode ??
        payload.qrCode,
    );

    return {
      qrCodeBase64: base64
        ? base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
        : undefined,
      qrCode: code,
    };
  }

  private extractErrorMessage(payload: unknown) {
    const record = this.readRecord(payload);
    if (!record) return '';
    const response = this.readRecord(record.response);
    const message = record.message ?? record.error ?? response?.message ?? '';

    return Array.isArray(message)
      ? message
          .map((item) => this.readOptionalScalarString(item))
          .filter((item): item is string => Boolean(item))
          .join(', ')
      : (this.readOptionalScalarString(message) ?? '');
  }

  private normalizeConnectedPhone(value: unknown) {
    const phone = this.readOptionalString(value);
    if (!phone) return undefined;
    return phone.split('@')[0]?.replace(/\D/g, '') || undefined;
  }

  private readOptionalString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private readOptionalScalarString(value: unknown) {
    if (typeof value === 'string') return value.trim() || undefined;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return undefined;
  }

  private readRecord(value: unknown): JsonRecord | undefined {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as JsonRecord)
      : undefined;
  }

  private toEvolutionInstance(instance: JsonRecord): EvolutionInstance {
    return {
      instanceName:
        this.readOptionalScalarString(instance.instanceName ?? instance.name) ??
        '',
      status: this.readOptionalString(
        instance.status ?? instance.connectionStatus,
      ),
      owner: this.readOptionalString(
        instance.owner ?? instance.ownerJid ?? instance.number,
      ),
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
