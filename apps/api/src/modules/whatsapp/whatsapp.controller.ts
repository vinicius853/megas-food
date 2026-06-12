import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WhatsAppEventType } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TestWhatsAppDto } from './dto/test-whatsapp.dto';
import { UpdateWhatsAppSettingsDto } from './dto/update-whatsapp-settings.dto';
import { WhatsAppConnectionService } from './whatsapp-connection.service';
import { WhatsAppManualService } from './whatsapp-manual.service';
import { WhatsAppNotificationService } from './whatsapp-notification.service';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WhatsAppController {
  constructor(
    private readonly connections: WhatsAppConnectionService,
    private readonly notifications: WhatsAppNotificationService,
    private readonly manual: WhatsAppManualService,
  ) {}

  @Get('settings')
  getSettings(@Req() req: any) {
    return this.connections.getSettings(req.user.tenantId);
  }

  @Put('settings')
  updateSettings(@Req() req: any, @Body() dto: UpdateWhatsAppSettingsDto) {
    return this.connections.updateSettings(req.user.tenantId, dto);
  }

  @Post('test')
  test(@Req() req: any, @Body() dto: TestWhatsAppDto) {
    return this.notifications.enqueueTest(req.user.tenantId, dto);
  }

  @Get('connection/qr')
  getQrCode() {
    return {
      available: false,
      message:
        'QR Code sera disponibilizado quando o provisionamento da instancia estiver habilitado.',
    };
  }

  @Get('orders/:orderId/manual-link')
  getManualLink(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Query('event') event: string,
  ) {
    if (
      !Object.values(WhatsAppEventType).includes(event as WhatsAppEventType)
    ) {
      throw new BadRequestException('Evento de WhatsApp invalido.');
    }
    return this.manual.getOrderLink(
      req.user.tenantId,
      orderId,
      event as WhatsAppEventType,
    );
  }
}
