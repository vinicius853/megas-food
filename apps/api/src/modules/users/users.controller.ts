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

import { UsersService } from './users.service'

import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'SUPPORT', 'CLIENT_OWNER')
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: { userId?: string; role?: string; permissions?: string[] },
  ) {
    return this.usersService.create(dto, user)
  }

  @Get()
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT', 'CLIENT_OWNER')
  findAll() {
    return this.usersService.findAll()
  }

  @Get(':id')
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT', 'CLIENT_OWNER')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  @Patch(':id')
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'SUPPORT', 'CLIENT_OWNER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { userId?: string; role?: string; permissions?: string[] },
  ) {
    return this.usersService.update(id, dto, user)
  }

  @Delete(':id')
  @Roles('MASTER_OWNER')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId?: string },
  ) {
    return this.usersService.remove(id, user)
  }
}
