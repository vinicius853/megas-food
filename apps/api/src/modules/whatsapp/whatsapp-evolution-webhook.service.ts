import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppConnectionStatus } from '@prisma/client';
import { timingSafeEqual } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { EvolutionApiAdapter } from './providers/evolution-api.adapter';
import {
  normalizeIncomingText,
  parseEvolutionWebhook,
} from './types/evolution-webhook.types';
import {
  ORDERING_PAUSED_MESSAGE,
  resolveDeliveryOrderingStatus,
} from '../dashboard-settings/delivery-ordering-status';

const menuCommands = new Set(['oi', 'ola', 'menu', 'cardapio']);
const messageDedupeTtlMs = 10 * 60 * 1000;

@Injectable()
export class WhatsAppEvolutionWebhookService {
  private readonly logger = new Logger(WhatsAppEvolutionWebhookService.name);
  private readonly processedMessages = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly evolutionApi: EvolutionApiAdapter,
    private readonly configService: ConfigService,
  ) {}

  accept(payload: unknown, suppliedCredentials?: string | readonly string[]) {
    this.assertAuthorized(suppliedCredentials);
    this.logReceivedPayload(payload);

    setImmediate(() => {
      void this.handle(payload, suppliedCredentials).catch((error) => {
        const message =
          error instanceof Error ? error.message : 'Falha desconhecida.';
        this.logger.warn(
          `Falha ao processar webhook Evolution em background: ${message}`,
        );
      });
    });

    return { received: true };
  }

  async handle(
    payload: unknown,
    suppliedCredentials?: string | readonly string[],
  ) {
    const event = parseEvolutionWebhook(payload);
    this.assertAuthorized(suppliedCredentials ?? event?.apiKey);

    if (!event) {
      return { received: true, ignored: 'INVALID_PAYLOAD' };
    }

    const connection = await this.prisma.whatsAppConnection.findFirst({
      where: { instanceName: event.instanceName },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            settings: true,
          },
        },
      },
    });

    if (!connection) {
      this.logger.warn(
        `Webhook ignorado para instancia desconhecida: ${event.instanceName}`,
      );
      return { received: true, ignored: 'UNKNOWN_INSTANCE' };
    }

    if (event.event === 'CONNECTION_UPDATE') {
      await this.updateConnectionStatus(
        connection.tenantId,
        event.connectionState,
        event.connectedPhone,
      );
      return { received: true, handled: 'CONNECTION_UPDATE' };
    }

    if (event.event !== 'MESSAGES_UPSERT') {
      return { received: true, ignored: 'UNSUPPORTED_EVENT' };
    }

    if (!connection.automationEnabled) {
      return { received: true, ignored: 'AUTOMATION_DISABLED' };
    }

    const remoteJid = event.remoteJid ?? event.sender ?? '';
    if (
      event.fromMe ||
      remoteJid.endsWith('@g.us') ||
      remoteJid === 'status@broadcast'
    ) {
      return { received: true, ignored: 'NON_CUSTOMER_MESSAGE' };
    }

    const normalizedText = normalizeIncomingText(event.text);
    if (!menuCommands.has(normalizedText)) {
      return { received: true, ignored: 'NO_MATCHING_COMMAND' };
    }

    if (event.messageId && this.isDuplicate(event.messageId)) {
      return { received: true, ignored: 'DUPLICATE_MESSAGE' };
    }

    const phone = this.normalizePhone(remoteJid);
    if (!phone) {
      return { received: true, ignored: 'INVALID_PHONE' };
    }

    const orderingStatus = resolveDeliveryOrderingStatus(
      connection.tenant.settings,
    );
    if (orderingStatus.reason === 'MANUAL_PAUSE') {
      return this.sendAutomaticReply(
        connection.instanceName ?? event.instanceName,
        phone,
        ORDERING_PAUSED_MESSAGE,
        connection.tenantId,
      );
    }

    const menuUrl = `${this.getPublicWebUrl()}/c/${connection.tenant.slug}`;
    const message = [
      `Olá! Seja bem-vindo(a) à ${connection.tenant.name}.`,
      'Para fazer seu pedido, acesse nosso cardápio digital:',
      menuUrl,
    ].join('\n');

    try {
      await this.evolutionApi.sendTextMessage(
        connection.instanceName ?? event.instanceName,
        phone,
        message,
      );
      this.logger.log(
        `Resposta automática enviada pelo tenant ${connection.tenantId}.`,
      );
      return { received: true, handled: 'AUTO_REPLY_SENT' };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha desconhecida.';
      this.logger.warn(
        `Resposta automática falhou no tenant ${connection.tenantId}: ${message}`,
      );
      return { received: true, handled: 'AUTO_REPLY_FAILED' };
    }
  }

  private async sendAutomaticReply(
    instanceName: string,
    phone: string,
    message: string,
    tenantId: string,
  ) {
    try {
      await this.evolutionApi.sendTextMessage(instanceName, phone, message);
      this.logger.log(`Resposta automÃ¡tica enviada pelo tenant ${tenantId}.`);
      return { received: true, handled: 'AUTO_REPLY_SENT' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Falha desconhecida.';
      this.logger.warn(
        `Resposta automÃ¡tica falhou no tenant ${tenantId}: ${errorMessage}`,
      );
      return { received: true, handled: 'AUTO_REPLY_FAILED' };
    }
  }

  private async updateConnectionStatus(
    tenantId: string,
    rawState?: string,
    rawPhone?: string,
  ) {
    const state = String(rawState ?? '').toLowerCase();
    const connected = ['open', 'connected'].includes(state);
    const disconnected = ['close', 'closed', 'disconnected'].includes(state);

    await this.prisma.whatsAppConnection.update({
      where: { tenantId },
      data: {
        status: connected
          ? WhatsAppConnectionStatus.CONNECTED
          : disconnected
            ? WhatsAppConnectionStatus.DISCONNECTED
            : undefined,
        connectedPhone: connected
          ? this.normalizePhone(rawPhone ?? '')
          : disconnected
            ? null
            : undefined,
        lastConnectedAt: connected ? new Date() : undefined,
        lastError: connected ? null : undefined,
      },
    });
  }

  private assertAuthorized(suppliedCredentials?: string | readonly string[]) {
    const expectedCredential = this.configService
      .get<string>('EVOLUTION_WEBHOOK_SECRET')
      ?.trim();
    const candidates = (
      Array.isArray(suppliedCredentials)
        ? suppliedCredentials
        : [suppliedCredentials]
    ).filter((credential): credential is string => Boolean(credential));

    if (!expectedCredential || !candidates.length) {
      throw new UnauthorizedException('Webhook Evolution nao autorizado.');
    }

    const authorized = candidates.some((candidate) =>
      this.credentialsMatch(expectedCredential, candidate),
    );
    if (!authorized) {
      throw new UnauthorizedException('Webhook Evolution nao autorizado.');
    }
  }

  private credentialsMatch(expected: string, supplied: string) {
    const expectedBuffer = Buffer.from(expected.trim());
    const suppliedBuffer = Buffer.from(supplied.trim());
    return (
      expectedBuffer.length === suppliedBuffer.length &&
      timingSafeEqual(expectedBuffer, suppliedBuffer)
    );
  }

  private logReceivedPayload(payload: unknown) {
    try {
      this.logger.log(`Webhook Evolution recebido: ${JSON.stringify(payload)}`);
    } catch {
      this.logger.log(
        'Webhook Evolution recebido com payload nao serializavel.',
      );
    }
  }

  private isDuplicate(messageId: string) {
    const now = Date.now();
    for (const [id, expiresAt] of this.processedMessages) {
      if (expiresAt <= now) this.processedMessages.delete(id);
    }
    if (this.processedMessages.has(messageId)) return true;
    this.processedMessages.set(messageId, now + messageDedupeTtlMs);
    return false;
  }

  private normalizePhone(value: string) {
    return value.split('@')[0]?.replace(/\D/g, '') || '';
  }

  private getPublicWebUrl() {
    return (
      this.configService.get<string>('PUBLIC_WEB_URL')?.replace(/\/+$/, '') ||
      'https://megasfood.tech'
    );
  }
}
