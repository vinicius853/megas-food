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
    @Headers('x-evolution-webhook-secret') headerSecret?: string,
    @Headers('apikey') apiKeyHeader?: string,
    @Query('token') queryToken?: string,
  ) {
    return this.webhookService.handle(
      payload,
      headerSecret ?? apiKeyHeader ?? queryToken,
    );
  }
}
