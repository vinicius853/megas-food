import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import * as bcrypt from 'bcryptjs'
import { AuditLogLevel, Prisma, UserRole } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditLogsService } from '../audit-logs/audit-logs.service'

import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

type CurrentActor = {
  userId?: string
  tenantId?: string
  role?: string
  permissions?: string[]
}

const clientAssignableRoles = new Set<UserRole>([
  UserRole.CLIENT_OWNER,
  UserRole.CLIENT_ADMIN,
  UserRole.CASHIER,
])

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateUserDto, actor?: CurrentActor) {
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

    const tenantId = this.resolveCreateTenantId(dto, actor)
    const permissions = this.resolveClientPermissions(dto.permissions, actor)

    if (actor?.role === UserRole.CLIENT_OWNER) {
      this.assertClientAssignableRole(dto.role)
    }

    const emailAlreadyExists = await this.prisma.user.findFirst({
      where: {
        tenantId,
        email: dto.email,
      },
    })

    if (emailAlreadyExists) {
      throw new BadRequestException('Já existe um usuário com este email.')
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10)

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        permissions,
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

  async findAll(actor?: CurrentActor) {
    return this.prisma.user.findMany({
      where: this.getClientTenantWhere(actor),
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

  async findOne(id: string, actor?: CurrentActor) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...this.getClientTenantWhere(actor),
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
      throw new NotFoundException('Usuário não encontrado.')
    }

    return user
  }

  async update(id: string, dto: UpdateUserDto, actor?: CurrentActor) {
    const currentUser = await this.findOne(id, actor)

    if (actor?.role === 'SUPPORT') {
      const changedFields = Object.keys(dto).filter(
        (key) => dto[key as keyof UpdateUserDto] !== undefined,
      )
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

    if (actor?.role === UserRole.CLIENT_OWNER) {
      if (!clientAssignableRoles.has(currentUser.role)) {
        throw new ForbiddenException(
          'Dono da loja pode administrar apenas usuarios do proprio tenant.',
        )
      }

      if (dto.role) {
        this.assertClientAssignableRole(dto.role)
      }

      this.resolveClientPermissions(dto.permissions, actor)
    }

    const data: Prisma.UserUncheckedUpdateInput = {
      name: dto.name,
      email: dto.email,
      role: dto.role,
      permissions: dto.permissions,
      isActive: dto.isActive,
    }

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10)
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
      level:
        action === 'Desativou usuario'
          ? AuditLogLevel.WARNING
          : AuditLogLevel.INFO,
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

  private resolveCreateTenantId(dto: CreateUserDto, actor?: CurrentActor) {
    if (actor?.role === UserRole.CLIENT_OWNER) {
      if (!actor.tenantId) {
        throw new ForbiddenException(
          'Tenant do usuario autenticado nao encontrado.',
        )
      }

      return actor.tenantId
    }

    if (!dto.tenantId) {
      throw new BadRequestException('Tenant e obrigatorio para criar usuario.')
    }

    return dto.tenantId
  }

  private resolveClientPermissions(
    permissions: string[] | undefined,
    actor?: CurrentActor,
  ) {
    if (actor?.role !== UserRole.CLIENT_OWNER) {
      return permissions || []
    }

    if (permissions?.length) {
      throw new ForbiddenException(
        'Dono da loja nao pode atribuir permissoes administrativas.',
      )
    }

    return []
  }

  private assertClientAssignableRole(role: UserRole) {
    if (!clientAssignableRoles.has(role)) {
      throw new ForbiddenException(
        'Dono da loja nao pode atribuir funcoes administrativas da plataforma.',
      )
    }
  }

  private getClientTenantWhere(actor?: CurrentActor) {
    if (actor?.role !== UserRole.CLIENT_OWNER) {
      return {}
    }

    if (!actor.tenantId) {
      throw new ForbiddenException(
        'Tenant do usuario autenticado nao encontrado.',
      )
    }

    return {
      tenantId: actor.tenantId,
    }
  }
}
