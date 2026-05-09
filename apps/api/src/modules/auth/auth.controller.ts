import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common'
import { UserRole } from '@prisma/client'

import { AuthService } from './auth.service'

import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { RolesGuard } from './guards/roles.guard'

import { CurrentUser } from './decorators/current-user.decorator'
import { CurrentTenant } from './decorators/current-tenant.decorator'
import { Roles } from './decorators/roles.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return user
  }

  @UseGuards(JwtAuthGuard)
  @Get('tenant-test')
  async tenantTest(@CurrentTenant() tenantId: string) {
    return {
      tenantId,
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT_OWNER)
  @Get('owner-test')
  async ownerTest(@CurrentUser() user: any) {
    return {
      message: 'Acesso permitido para dono da pizzaria',
      user,
    }
  }
}