import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EvolutionApiAdapter } from './providers/evolution-api.adapter';
import { WHATSAPP_PROVIDER } from './providers/whatsapp-provider.interface';
import { WhatsAppConnectionService } from './whatsapp-connection.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppManualService } from './whatsapp-manual.service';
import { WhatsAppNotificationService } from './whatsapp-notification.service';
import { WhatsAppOutboxService } from './whatsapp-outbox.service';
import { WhatsAppPublicController } from './whatsapp-public.controller';
import { WhatsAppTemplateService } from './whatsapp-template.service';
import { WhatsAppWorkerService } from './whatsapp-worker.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WhatsAppController, WhatsAppPublicController],
  providers: [
    EvolutionApiAdapter,
    WhatsAppConnectionService,
    WhatsAppManualService,
    WhatsAppNotificationService,
    WhatsAppOutboxService,
    WhatsAppTemplateService,
    WhatsAppWorkerService,
    {
      provide: WHATSAPP_PROVIDER,
      useExisting: EvolutionApiAdapter,
    },
  ],
  exports: [WhatsAppConnectionService, WhatsAppNotificationService],
})
export class WhatsAppModule {}
