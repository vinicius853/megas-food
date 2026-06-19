import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common'
import { UserRole } from '@prisma/client'

import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

import { DashboardSettingsService } from './dashboard-settings.service'
import {
  UpdateCustomizationSettingsDto,
  UpdateDeliverySettingsDto,
} from './dto/update-dashboard-settings.dto'

@Controller('dashboard-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT_OWNER)
export class DashboardSettingsController {
  constructor(
    private readonly dashboardSettingsService: DashboardSettingsService,
  ) {}

  @Get('delivery')
  findDelivery(@Req() req: any) {
    return this.dashboardSettingsService.findDelivery(req.user.tenantId)
  }

  @Put('delivery')
  updateDelivery(@Req() req: any, @Body() dto: UpdateDeliverySettingsDto) {
    return this.dashboardSettingsService.updateDelivery(req.user.tenantId, dto)
  }

  @Get('customization')
  findCustomization(@Req() req: any) {
    return this.dashboardSettingsService.findCustomization(req.user.tenantId)
  }

  @Put('customization')
  updateCustomization(
    @Req() req: any,
    @Body() dto: UpdateCustomizationSettingsDto,
  ) {
    return this.dashboardSettingsService.updateCustomization(
      req.user.tenantId,
      dto,
    )
  }
}
