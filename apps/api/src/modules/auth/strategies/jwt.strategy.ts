import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'

import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../../../prisma/prisma.service'

type JwtPayload = {
  sub?: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET')

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: jwtSecret,
    })
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Sessão inválida ou expirada.')
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
        tenantId: true,
        role: true,
        permissions: true,
        isActive: true,
        tenant: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    })

    if (!user || !user.isActive || !user.tenant || !user.tenant.isActive) {
      throw new UnauthorizedException('Sessão inválida ou expirada.')
    }

    return {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      permissions: user.permissions ?? [],
    }
  }
}
