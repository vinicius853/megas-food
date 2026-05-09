import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

import { PrismaService } from '../../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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

    const token = this.generateToken(user.id, tenant.id, user.role)

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    }
  }

  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    })

    if (!tenant) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: dto.email,
        },
      },
    })

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password)

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const token = this.generateToken(user.id, tenant.id, user.role)

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    }
  }

  private generateToken(userId: string, tenantId: string, role: string) {
    return this.jwtService.sign({
      sub: userId,
      tenantId,
      role,
    })
  }
}