import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import * as bcrypt from 'bcryptjs'
import { AuditLogLevel } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditLogsService } from '../audit-logs/audit-logs.service'

import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    dto: CreateUserDto,
    actor?: { userId?: string; role?: string; permissions?: string[] },
  ) {
    if (
      actor?.role === 'SUPPORT' &&
      (!actor.permissions?.includes('CREATE_USERS') ||
        dto.role === 'MASTER_OWNER' ||
        dto.role === 'MASTER_ADMIN' ||
        dto.role === 'FINANCE_ADMIN')
    ) {
      throw new ForbiddenException(
        'Suporte pode criar apenas usuarios sem permissao administrativa.',
      )
    }

    const emailAlreadyExists =
      await this.prisma.user.findFirst({
        where: {
          tenantId: dto.tenantId,
          email: dto.email,
        },
      })

    if (emailAlreadyExists) {
      throw new BadRequestException(
        'Já existe um usuário com este email.',
      )
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      10,
    )

    const user = await this.prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        permissions: dto.permissions || [],
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    })

    await this.auditLogsService.create({
      actor,
      action: 'Criou usuario',
      target: user.email,
      level: AuditLogLevel.INFO,
      metadata: {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
      },
    })

    return user
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException(
        'Usuário não encontrado.',
      )
    }

    return user
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actor?: { userId?: string; role?: string; permissions?: string[] },
  ) {
    const currentUser = await this.findOne(id)

    if (actor?.role === 'SUPPORT') {
      const changedFields = Object.keys(dto).filter((key) => dto[key as keyof UpdateUserDto] !== undefined)
      const canOnlyResetPassword =
        actor.permissions?.includes('RESET_PASSWORDS') &&
        changedFields.length === 1 &&
        changedFields[0] === 'password' &&
        currentUser.role !== 'MASTER_OWNER' &&
        currentUser.role !== 'MASTER_ADMIN' &&
        currentUser.role !== 'FINANCE_ADMIN'

      if (!canOnlyResetPassword) {
        throw new ForbiddenException(
          'Suporte pode apenas redefinir senha de usuarios de suporte ou clientes.',
        )
      }
    }

    const data: any = {
      name: dto.name,
      email: dto.email,
      role: dto.role,
      permissions: dto.permissions,
      isActive: dto.isActive,
    }

    if (dto.password) {
      data.password = await bcrypt.hash(
        dto.password,
        10,
      )
    }

    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    })

    const action =
      typeof dto.isActive === 'boolean' && dto.isActive !== currentUser.isActive
        ? dto.isActive
          ? 'Ativou usuario'
          : 'Desativou usuario'
        : 'Alterou usuario'

    await this.auditLogsService.create({
      actor,
      action,
      target: user.email,
      level: action === 'Desativou usuario' ? AuditLogLevel.WARNING : AuditLogLevel.INFO,
      metadata: {
        userId: user.id,
        changedFields: Object.keys(dto),
      },
    })

    return user
  }

  async remove(id: string, actor?: { userId?: string }) {
    const user = await this.findOne(id)

    await this.auditLogsService.create({
      actor,
      action: 'Excluiu usuario',
      target: user.email,
      level: AuditLogLevel.CRITICAL,
      metadata: {
        userId: user.id,
        tenantId: user.tenantId,
      },
    })

    return this.prisma.user.delete({
      where: {
        id,
      },
    })
  }
}
