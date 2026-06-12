import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

import { PrismaService } from '../../prisma/prisma.service'
import { SubscriptionAccessService } from '../billing/subscription-access.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly subscriptionAccessService: SubscriptionAccessService,
  ) {}

  async register(dto: RegisterDto) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    })

    if (existingTenant) {
      throw new UnauthorizedException('Slug já cadastrado')
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10)

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.businessName,
        slug: dto.slug,
        whatsapp: dto.whatsapp,
        users: {
          create: {
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            role: 'CLIENT_OWNER',
          },
        },
      },
      include: {
        users: true,
      },
    })

    const user = tenant.users[0]

    const token = this.generateToken(user.id, tenant.id, user.role, user.permissions)

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        enabledSegments: tenant.enabledSegments,
      },
    }
  }

  async login(dto: LoginDto) {
    const users = await this.prisma.user.findMany({
      where: {
        email: dto.email,
        isActive: true,
      },
      include: {
        tenant: true,
      },
    })

    if (users.length !== 1) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const user = users[0]

    if (!user.tenant) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password)

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    await this.subscriptionAccessService.assertClientDashboardAccess(
      user.tenant.id,
      user.role,
    )

    const token = this.generateToken(user.id, user.tenant.id, user.role, user.permissions)

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        enabledSegments: user.tenant.enabledSegments,
      },
    }
  }

  async verifyPassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas')
    }

    const passwordMatches = await bcrypt.compare(password, user.password)

    if (!passwordMatches) {
      throw new UnauthorizedException('Senha de confirmacao invalida')
    }

    return { ok: true }
  }

  private generateToken(userId: string, tenantId: string, role: string, permissions: string[] = []) {
    return this.jwtService.sign({
      sub: userId,
      tenantId,
      role,
      permissions,
    })
  }
}
