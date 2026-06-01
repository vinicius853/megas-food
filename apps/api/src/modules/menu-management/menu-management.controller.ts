import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

import { MenuManagementService } from './menu-management.service'

import { UpdateMenuManagementDto } from './dto/update-menu-management.dto'

@Controller('menu-management')
@UseGuards(JwtAuthGuard)
export class MenuManagementController {
  constructor(
    private readonly menuManagementService: MenuManagementService,
  ) {}

  @Get()
  async findOne(@Req() req: any) {
    return this.menuManagementService.findOne(
      req.user.tenantId,
    )
  }

  @Put()
  async update(
    @Req() req: any,

    @Body()
    dto: UpdateMenuManagementDto,
  ) {
    return this.menuManagementService.update(
      req.user.tenantId,
      dto,
    )
  }
}
