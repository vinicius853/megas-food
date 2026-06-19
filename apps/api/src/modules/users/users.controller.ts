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

type CurrentActor = {
  userId?: string
  tenantId?: string
  role?: string
  permissions?: string[]
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'SUPPORT', 'CLIENT_OWNER')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: CurrentActor) {
    return this.usersService.create(dto, user)
  }

  @Get()
  @Roles(
    'MASTER_OWNER',
    'MASTER_ADMIN',
    'FINANCE_ADMIN',
    'SUPPORT',
    'CLIENT_OWNER',
  )
  findAll(@CurrentUser() user: CurrentActor) {
    return this.usersService.findAll(user)
  }

  @Get(':id')
  @Roles(
    'MASTER_OWNER',
    'MASTER_ADMIN',
    'FINANCE_ADMIN',
    'SUPPORT',
    'CLIENT_OWNER',
  )
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentActor) {
    return this.usersService.findOne(id, user)
  }

  @Patch(':id')
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'SUPPORT', 'CLIENT_OWNER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: CurrentActor,
  ) {
    return this.usersService.update(id, dto, user)
  }

  @Delete(':id')
  @Roles('MASTER_OWNER')
  remove(@Param('id') id: string, @CurrentUser() user: { userId?: string }) {
    return this.usersService.remove(id, user)
  }
}
