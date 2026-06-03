import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { AuditLogLevel } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditLogsService } from '../audit-logs/audit-logs.service'

import {
  defaultPlanSlug,
  monthlyFee,
} from './billing.constants'
import {
  cleanStringList,
  emptyToNull,
  normalizeSlug,
} from './billing.helpers'
import { CreatePlanDto } from './dto/create-plan.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'
import type { Actor } from './billing.types'

@Injectable()
export class BillingPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async listPlans() {
    await this.ensureDefaultPlan()

    return this.prisma.plan.findMany({
      orderBy: [{ sortOrder: 'asc' }, { monthlyPrice: 'asc' }],
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    })
  }

  async getPlan(planId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: {
        id: planId,
      },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    })

    if (!plan) {
      throw new NotFoundException('Plano nao encontrado.')
    }

    return plan
  }

  async createPlan(dto: CreatePlanDto, actor: Actor) {
    const slug = normalizeSlug(dto.slug)

    const existing = await this.prisma.plan.findUnique({
      where: {
        slug,
      },
    })

    if (existing) {
      throw new BadRequestException('Ja existe um plano com este slug.')
    }

    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: emptyToNull(dto.description),
        monthlyPrice: dto.monthlyPrice,
        annualPrice: dto.annualPrice,
        setupFee: dto.setupFee,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        features: cleanStringList(dto.features),
      },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    })

    await this.auditLogsService.create({
      actor,
      action: 'Criou plano',
      target: plan.name,
      level: AuditLogLevel.INFO,
      metadata: {
        planId: plan.id,
        slug: plan.slug,
        monthlyPrice: plan.monthlyPrice,
      },
    })

    return plan
  }

  async updatePlan(planId: string, dto: UpdatePlanDto, actor: Actor) {
    const current = await this.prisma.plan.findUnique({
      where: {
        id: planId,
      },
    })

    if (!current) {
      throw new NotFoundException('Plano nao encontrado.')
    }

    const slug = dto.slug !== undefined ? normalizeSlug(dto.slug) : undefined

    if (slug && slug !== current.slug) {
      const existing = await this.prisma.plan.findUnique({
        where: {
          slug,
        },
      })

      if (existing) {
        throw new BadRequestException('Ja existe um plano com este slug.')
      }
    }

    const plan = await this.prisma.plan.update({
      where: {
        id: current.id,
      },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(dto.description !== undefined
          ? { description: emptyToNull(dto.description) }
          : {}),
        ...(dto.monthlyPrice !== undefined ? { monthlyPrice: dto.monthlyPrice } : {}),
        ...(dto.annualPrice !== undefined ? { annualPrice: dto.annualPrice } : {}),
        ...(dto.setupFee !== undefined ? { setupFee: dto.setupFee } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.features !== undefined
          ? { features: cleanStringList(dto.features) }
          : {}),
      },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    })

    await this.auditLogsService.create({
      actor,
      action: 'Alterou plano',
      target: plan.name,
      level: AuditLogLevel.INFO,
      metadata: {
        planId: plan.id,
        slug: plan.slug,
        monthlyPrice: plan.monthlyPrice,
        changedSubscriptionContracts: false,
      },
    })

    return plan
  }

  async ensureDefaultPlan() {
    const current = await this.prisma.plan.findUnique({
      where: {
        slug: defaultPlanSlug,
      },
    })

    if (current) {
      return current
    }

    return this.prisma.plan.create({
      data: {
        id: 'plan_megas_food_monthly',
        name: 'Plano Megas Food',
        slug: defaultPlanSlug,
        description: 'Plano mensal principal da plataforma Megas Food.',
        monthlyPrice: monthlyFee,
        isFeatured: true,
        sortOrder: 1,
        features: [
          'Cardapio digital',
          'Pedidos online',
          'Painel operacional',
          'Suporte Megas Food',
        ],
        isActive: true,
      },
    })
  }
}
