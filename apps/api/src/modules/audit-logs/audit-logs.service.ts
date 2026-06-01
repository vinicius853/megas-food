import { Injectable } from '@nestjs/common'
import { AuditLogLevel, Prisma } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'

type Actor = {
  userId?: string
  email?: string
}

type CreateAuditLogInput = {
  actor?: Actor
  action: string
  target: string
  level?: AuditLogLevel
  metadata?: Prisma.InputJsonValue
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAuditLogInput) {
    let actorEmail = input.actor?.email

    if (!actorEmail && input.actor?.userId) {
      const actor = await this.prisma.user.findUnique({
        where: {
          id: input.actor.userId,
        },
        select: {
          email: true,
        },
      })

      actorEmail = actor?.email
    }

    return this.prisma.auditLog.create({
      data: {
        actorId: input.actor?.userId,
        actorEmail,
        action: input.action,
        target: input.target,
        level: input.level ?? AuditLogLevel.INFO,
        metadata: input.metadata,
      },
    })
  }

  async findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })
  }
}
