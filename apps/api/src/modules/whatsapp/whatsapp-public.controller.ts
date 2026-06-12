import { Controller, Get, Param } from '@nestjs/common';

import { WhatsAppConnectionService } from './whatsapp-connection.service';

@Controller('whatsapp/public')
export class WhatsAppPublicController {
  constructor(private readonly connections: WhatsAppConnectionService) {}

  @Get(':tenantSlug/status')
  getStatus(@Param('tenantSlug') tenantSlug: string) {
    return this.connections.getPublicStatus(tenantSlug);
  }
}
