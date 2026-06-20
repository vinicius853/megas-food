import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentTenant } from './decorators/current-tenant.decorator';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('verify-password')
  async verifyPassword(
    @CurrentUser() user: { userId: string },
    @Body() dto: VerifyPasswordDto,
  ) {
    return this.authService.verifyPassword(user.userId, dto.password || '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('tenant-test')
  async tenantTest(@CurrentTenant() tenantId: string) {
    return {
      tenantId,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT_OWNER)
  @Get('owner-test')
  async ownerTest(@CurrentUser() user: any) {
    return {
      message: 'Acesso permitido para dono da pizzaria',
      user,
    };
  }
}
