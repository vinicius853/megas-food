import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';

import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { GenericMenuManagementService } from './generic-menu-management.service';
import { UpdateGenericMenuDto } from './dto/update-generic-menu.dto';

@Controller('generic-menu-management')
@UseGuards(JwtAuthGuard)
export class GenericMenuManagementController {
  constructor(
    private readonly genericMenuManagementService: GenericMenuManagementService,
  ) {}

  @Get()
  findOne(@CurrentTenant() tenantId: string) {
    return this.genericMenuManagementService.findOne(tenantId);
  }

  @Put()
  update(
    @CurrentTenant() tenantId: string,
    @Body() payload: UpdateGenericMenuDto,
  ) {
    return this.genericMenuManagementService.update(tenantId, payload);
  }
}
