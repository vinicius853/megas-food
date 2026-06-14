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

import { TenantsService } from './tenants.service'

import { CreateTenantDto } from './dto/create-tenant.dto'
import { ResetOwnerPasswordDto } from './dto/reset-owner-password.dto'
import { UpdateTenantDto } from './dto/update-tenant.dto'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  @Roles('CLIENT_OWNER', 'CLIENT_ADMIN')
  findMe(@CurrentTenant() tenantId: string) {
    return this.tenantsService.findOne(tenantId)
  }

  @Patch('me')
  @Roles('CLIENT_OWNER', 'CLIENT_ADMIN')
  updateMe(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(tenantId, dto)
  }

  @Post()
  @Roles('MASTER_OWNER', 'MASTER_ADMIN')
  create(
    @Body() dto: CreateTenantDto,
    @CurrentUser() user: { userId?: string },
  ) {
    return this.tenantsService.create(dto, user)
  }

  @Get()
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT')
  findAll() {
    return this.tenantsService.findAll()
  }

  @Get('commercial')
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT')
  findCommercial() {
    return this.tenantsService.findCommercial()
  }

  @Get(':id')
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id)
  }

  @Post(':id/reset-owner-password')
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'SUPPORT')
  resetOwnerPassword(
    @Param('id') id: string,
    @Body() dto: ResetOwnerPasswordDto,
    @CurrentUser() user: { userId?: string; role?: string; permissions?: string[] },
  ) {
    return this.tenantsService.resetOwnerPassword(id, dto, user)
  }

  @Patch(':id')
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'SUPPORT')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: { userId?: string; role?: string; permissions?: string[] },
  ) {
    return this.tenantsService.update(id, dto, user)
  }

  @Delete(':id')
  @Roles('MASTER_OWNER')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId?: string },
  ) {
    return this.tenantsService.remove(id, user)
  }
}
