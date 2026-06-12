import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

import * as bcrypt from 'bcryptjs'

import { AuditLogLevel, Prisma, UserRole } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditLogsService } from '../audit-logs/audit-logs.service'

import { CreateTenantDto } from './dto/create-tenant.dto'
import { ResetOwnerPasswordDto } from './dto/reset-owner-password.dto'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { normalizeTenantSegments } from './tenant-segments'

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateTenantDto, actor?: { userId?: string }) {
    const alreadyExists = await this.prisma.tenant.findUnique({
      where: {
        slug: dto.slug,
      },
    })

    if (alreadyExists) {
      throw new BadRequestException(
        'Ja existe um cliente com este slug.',
      )
    }

    const emailAlreadyExists =
      await this.prisma.user.findFirst({
        where: {
          email: dto.ownerEmail,
        },
      })

    if (emailAlreadyExists) {
      throw new BadRequestException(
        'Já existe um usuário com este email.',
      )
    }

    const hashedPassword = await bcrypt.hash(
      dto.ownerPassword,
      10,
    )

    const tenant = await this.prisma.$transaction(async (tx) => {
      const internalCode = await this.generateInternalCode(tx)

      return tx.tenant.create({
        data: {
          internalCode,
          name: dto.name,
          slug: dto.slug,
          responsibleName: dto.ownerName,
          document: this.onlyDigits(dto.document),
          phone: this.onlyDigits(dto.phone),
          whatsapp: this.onlyDigits(dto.whatsapp),
          city: dto.city,
          state: dto.state.toUpperCase(),
          address: dto.address,
          zipCode: this.onlyDigits(dto.zipCode),
          internalNotes: dto.internalNotes,
          logoUrl: dto.logoUrl,
          isActive: dto.isActive ?? true,
          enabledSegments: normalizeTenantSegments(dto.enabledSegments),

          users: {
            create: {
              name: dto.ownerName,
              email: dto.ownerEmail,
              password: hashedPassword,
              role: UserRole.CLIENT_OWNER,
              isActive: true,
            },
          },
        },

        include: this.tenantInclude(),
      })
    })

    await this.auditLogsService.create({
      actor,
      action: 'Criou cliente',
      target: tenant.name,
      level: AuditLogLevel.INFO,
      metadata: {
        tenantId: tenant.id,
        slug: tenant.slug,
        internalCode: tenant.internalCode,
        ownerEmail: dto.ownerEmail,
      },
    })

    return tenant
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      include: this.tenantInclude(),
    })
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id,
      },

      include: this.tenantInclude(),
    })

    if (!tenant) {
      throw new NotFoundException(
        'Cliente nao encontrado.',
      )
    }

    return tenant
  }

  async update(
    id: string,
    dto: UpdateTenantDto,
    actor?: { userId?: string; role?: string; permissions?: string[] },
  ) {
    const currentTenant = await this.findOne(id)
    const changedFields = Object.keys(dto).filter((field) => field !== 'confirmationPassword')
    const isStatusChange =
      changedFields.length === 1 &&
      typeof dto.isActive === 'boolean' &&
      dto.isActive !== currentTenant.isActive

    if (actor?.role === 'SUPPORT') {
      const canManageClientStatus = actor.permissions?.includes('MANAGE_CLIENT_STATUS')

      if (!isStatusChange || !canManageClientStatus) {
        throw new ForbiddenException(
          'Suporte pode apenas ativar ou desativar clientes quando tiver permissao.',
        )
      }
    }

    if (isStatusChange && dto.isActive === false) {
      await this.verifyCriticalAction(actor?.userId, dto.confirmationPassword)
    }

    if (dto.slug) {
      const slugAlreadyExists =
        await this.prisma.tenant.findFirst({
          where: {
            slug: dto.slug,

            NOT: {
              id,
            },
          },
        })

      if (slugAlreadyExists) {
        throw new BadRequestException(
          'Este slug já está em uso.',
        )
      }
    }

    const tenant = await this.prisma.tenant.update({
      where: {
        id,
      },

      data: {
        name: dto.name,
        slug: dto.slug,
        responsibleName: dto.responsibleName,
        document: this.onlyDigits(dto.document),
        phone: this.onlyDigits(dto.phone),
        whatsapp: this.onlyDigits(dto.whatsapp),
        city: dto.city,
        state: dto.state?.toUpperCase(),
        address: dto.address,
        zipCode: this.onlyDigits(dto.zipCode),
        internalNotes: dto.internalNotes,
        logoUrl: dto.logoUrl,
        isActive: dto.isActive,
        enabledSegments: dto.enabledSegments
          ? normalizeTenantSegments(dto.enabledSegments)
          : undefined,
      },
      include: this.tenantInclude(),
    })

    const action =
      typeof dto.isActive === 'boolean' && dto.isActive !== currentTenant.isActive
        ? dto.isActive
          ? 'Ativou cliente'
          : 'Desativou cliente'
        : 'Alterou cliente'

    await this.auditLogsService.create({
      actor,
      action,
      target: tenant.name,
      level: action === 'Desativou cliente' ? AuditLogLevel.WARNING : AuditLogLevel.INFO,
      metadata: {
        tenantId: tenant.id,
        changedFields: Object.keys(dto),
      },
    })

    return tenant
  }

  async resetOwnerPassword(
    tenantId: string,
    dto: ResetOwnerPasswordDto,
    actor?: { userId?: string; role?: string; permissions?: string[] },
  ) {
    const canReset =
      actor?.role === 'MASTER_OWNER' ||
      actor?.role === 'MASTER_ADMIN' ||
      Boolean(actor?.permissions?.includes('RESET_CLIENT_PASSWORDS'))

    if (!canReset) {
      throw new ForbiddenException(
        'Seu perfil nao permite redefinir senha de clientes.',
      )
    }

    await this.verifyCriticalAction(actor?.userId, dto.confirmationPassword)

    const tenant = await this.findOne(tenantId)
    const owner = tenant.users.find((user) => user.role === UserRole.CLIENT_OWNER)

    if (!owner) {
      throw new NotFoundException(
        'Responsavel principal nao encontrado para este cliente.',
      )
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10)

    const updatedOwner = await this.prisma.user.update({
      where: {
        id: owner.id,
      },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    await this.auditLogsService.create({
      actor,
      action: 'Redefiniu senha do cliente',
      target: tenant.name,
      level: AuditLogLevel.WARNING,
      metadata: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        ownerId: updatedOwner.id,
        ownerEmail: updatedOwner.email,
      },
    })

    return {
      message: 'Senha do responsavel principal redefinida.',
      owner: updatedOwner,
    }
  }

  private async verifyCriticalAction(userId?: string, password?: string) {
    if (!userId || !password) {
      throw new UnauthorizedException(
        'Confirme sua senha para concluir esta acao critica.',
      )
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado.')
    }

    const passwordMatches = await bcrypt.compare(password, user.password)

    if (!passwordMatches) {
      throw new UnauthorizedException('Senha de confirmacao invalida.')
    }
  }

  private async generateInternalCode(tx: Prisma.TransactionClient) {
    const prefix = 'MTF'

    await tx.tenantInternalCodeSequence.upsert({
      where: { prefix },
      create: {
        id: 'tenant_code_sequence_mtf',
        prefix,
        nextValue: 1,
      },
      update: {},
    })

    const sequence = await tx.tenantInternalCodeSequence.update({
      where: { prefix },
      data: {
        nextValue: {
          increment: 1,
        },
      },
    })

    return `${prefix}-${String(sequence.nextValue - 1).padStart(4, '0')}`
  }

  private onlyDigits(value?: string) {
    return value ? value.replace(/\D/g, '') : undefined
  }

  private tenantInclude() {
    return {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
      subscriptions: {
        orderBy: {
          createdAt: 'desc' as const,
        },
        take: 1,
        include: {
          plan: true,
        },
      },
    }
  }

  async remove(id: string, actor?: { userId?: string }) {
    const tenant = await this.findOne(id)

    await this.auditLogsService.create({
      actor,
      action: 'Excluiu cliente',
      target: tenant.name,
      level: AuditLogLevel.CRITICAL,
      metadata: {
        tenantId: tenant.id,
        slug: tenant.slug,
      },
    })

    return this.prisma.tenant.delete({
      where: {
        id,
      },
    })
  }
}
