import { Controller, Get, UseGuards } from '@nestjs/common'

import { AuditLogsService } from './audit-logs.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('MASTER_OWNER', 'MASTER_ADMIN')
  findAll() {
    return this.auditLogsService.findAll()
  }
}
