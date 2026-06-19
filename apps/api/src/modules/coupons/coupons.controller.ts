import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { UserRole } from '@prisma/client'

import { CurrentTenant } from '../auth/decorators/current-tenant.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CouponsService } from './coupons.service'
import { CreateCouponDto } from './dto/create-coupon.dto'
import { UpdateCouponDto } from './dto/update-coupon.dto'

@Controller('coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT_OWNER)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(tenantId, dto)
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.couponsService.findAll(tenantId)
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(tenantId, id, dto)
  }

  @Delete(':id')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.couponsService.remove(tenantId, id)
  }
}
