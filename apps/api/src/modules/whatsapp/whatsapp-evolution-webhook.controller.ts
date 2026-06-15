import { Body, Controller, Headers, Post, Query } from '@nestjs/common';

import { WhatsAppEvolutionWebhookService } from './whatsapp-evolution-webhook.service';

@Controller('whatsapp/evolution')
export class WhatsAppEvolutionWebhookController {
  constructor(
    private readonly webhookService: WhatsAppEvolutionWebhookService,
  ) {}

  @Post('webhook')
  handleWebhook(
    @Body() payload: unknown,
    @Headers('apikey') apiKeyHeader?: string,
    @Headers('x-api-key') alternateApiKeyHeader?: string,
    @Headers('x-evolution-webhook-secret') headerSecret?: string,
    @Query('token') queryToken?: string,
  ) {
    const { apiKey: bodyApiKey, payload: sanitizedPayload } =
      sanitizeWebhookPayload(payload);

    return this.webhookService.accept(
      sanitizedPayload,
      [
        apiKeyHeader,
        alternateApiKeyHeader,
        bodyApiKey,
        headerSecret,
        queryToken,
      ].filter((credential): credential is string => Boolean(credential)),
    );
  }
}

function sanitizeWebhookPayload(payload: unknown) {
  if (!isRecord(payload)) {
    return { apiKey: undefined, payload };
  }

  const apiKey =
    typeof payload.apikey === 'string' && payload.apikey.trim()
      ? payload.apikey.trim()
      : undefined;
  const sanitizedPayload = { ...payload };
  delete sanitizedPayload.apikey;

  return { apiKey, payload: sanitizedPayload };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
