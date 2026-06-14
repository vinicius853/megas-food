import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import {
  AuditLogLevel,
  BillingInvoiceStatus,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditLogsService } from '../audit-logs/audit-logs.service'
import {
  commercialTenantWhere,
  withCommercialTenant,
} from '../tenants/commercial-tenant'

import { defaultGracePeriodDays } from './billing.constants'
import { defaultSubscriptionDueDate, toMoneyNumber } from './billing.helpers'
import { BillingPlansService } from './billing-plans.service'
import type { Actor } from './billing.types'
import { ActivateSubscriptionDto } from './dto/activate-subscription.dto'
import { ChangeTenantPlanDto } from './dto/change-tenant-plan.dto'
import { SubscriptionActionDto } from './dto/subscription-action.dto'
import { MercadoPagoService } from './mercado-pago.service'
import { SubscriptionAccessService } from './subscription-access.service'

@Injectable()
export class BillingSubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly subscriptionAccessService: SubscriptionAccessService,
    private readonly billingPlansService: BillingPlansService,
  ) {}

  async listSubscriptions() {
    await this.refreshSubscriptionStatuses('master-list-subscriptions')

    return this.prisma.subscription.findMany({
      where: {
        tenant: commercialTenantWhere,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        plan: true,
        tenant: {
          include: {
            users: {
              where: {
                role: UserRole.CLIENT_OWNER,
              },
              select: {
                id: true,
                name: true,
                email: true,
              },
              take: 1,
            },
          },
        },
      },
    })
  }

  async getMySubscription(tenantId?: string) {
    if (!tenantId) {
      throw new UnauthorizedException('Tenant nao identificado.')
    }

    const plan = await this.billingPlansService.ensureDefaultPlan()
    const access =
      await this.subscriptionAccessService.evaluateTenantAccess(tenantId)

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        plan: true,
      },
    })

    const latestPaidInvoice = await this.prisma.billingInvoice.findFirst({
      where: {
        tenantId,
        status: BillingInvoiceStatus.PAID,
      },
      orderBy: {
        paidAt: 'desc',
      },
      select: {
        id: true,
        paidAt: true,
        amount: true,
        paymentMethod: true,
      },
    })

    const latestOpenInvoice = await this.prisma.billingInvoice.findFirst({
      where: {
        tenantId,
        status: {
          in: [BillingInvoiceStatus.OPEN, BillingInvoiceStatus.OVERDUE],
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      select: {
        id: true,
        dueDate: true,
        status: true,
        amount: true,
        paymentUrl: true,
        sandboxPaymentUrl: true,
      },
    })

    return {
      plan: subscription?.plan ?? plan,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            startedAt: subscription.startedAt,
            nextBillingDate: subscription.nextBillingDate,
            canceledAt: subscription.canceledAt,
            accessUntil: subscription.accessUntil,
            gracePeriodDays: subscription.gracePeriodDays,
            mercadoPagoSubscriptionUrl: subscription.mercadoPagoSubscriptionUrl,
            mercadoPagoSubscriptionStatus:
              subscription.mercadoPagoSubscriptionStatus,
          }
        : {
            id: null,
            status: 'LEGACY',
            startedAt: null,
            nextBillingDate: null,
            canceledAt: null,
            accessUntil: null,
            gracePeriodDays: defaultGracePeriodDays,
            mercadoPagoSubscriptionUrl: null,
            mercadoPagoSubscriptionStatus: null,
          },
      access,
      latestPayment: latestPaidInvoice,
      openInvoice: latestOpenInvoice,
    }
  }

  async activateSubscription(dto: ActivateSubscriptionDto, actor: Actor) {
    const tenant = await this.prisma.tenant.findFirst({
      where: withCommercialTenant({ id: dto.tenantId }),
    })

    if (!tenant) {
      throw new NotFoundException('Cliente nao encontrado.')
    }

    const plan = dto.planId
      ? await this.prisma.plan.findUnique({ where: { id: dto.planId } })
      : await this.billingPlansService.ensureDefaultPlan()

    if (!plan || !plan.isActive) {
      throw new BadRequestException('Plano invalido ou inativo.')
    }

    const currentSubscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId: tenant.id,
        status: {
          in: [
            SubscriptionStatus.PENDING,
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.CANCEL_SCHEDULED,
            SubscriptionStatus.BLOCKED,
          ],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const nextBillingDate = dto.nextBillingDate
      ? new Date(dto.nextBillingDate)
      : defaultSubscriptionDueDate()
    const accessUntil = dto.accessUntil
      ? new Date(dto.accessUntil)
      : nextBillingDate
    const isContractChange =
      !currentSubscription ||
      currentSubscription.planId !== plan.id ||
      dto.contractedMonthlyPrice !== undefined ||
      dto.contractedAnnualPrice !== undefined ||
      dto.contractedSetupFee !== undefined
    const contractedMonthlyPrice =
      dto.contractedMonthlyPrice ??
      (currentSubscription && currentSubscription.planId === plan.id
        ? currentSubscription.contractedMonthlyPrice
        : plan.monthlyPrice)

    const subscription = currentSubscription
      ? await this.prisma.subscription.update({
          where: { id: currentSubscription.id },
          data: {
            planId: plan.id,
            status: SubscriptionStatus.ACTIVE,
            contractedMonthlyPrice,
            contractedAnnualPrice:
              dto.contractedAnnualPrice ??
              currentSubscription.contractedAnnualPrice,
            contractedSetupFee:
              dto.contractedSetupFee ?? currentSubscription.contractedSetupFee,
            contractedAt: isContractChange
              ? new Date()
              : currentSubscription.contractedAt,
            internalNotes:
              dto.internalNotes ?? currentSubscription.internalNotes,
            startedAt: currentSubscription.startedAt ?? new Date(),
            nextBillingDate,
            accessUntil,
            canceledAt: null,
            blockedAt: null,
            gracePeriodDays: defaultGracePeriodDays,
          },
          include: {
            plan: true,
            tenant: true,
          },
        })
      : await this.prisma.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: plan.id,
            status: SubscriptionStatus.ACTIVE,
            contractedMonthlyPrice,
            contractedAnnualPrice: dto.contractedAnnualPrice,
            contractedSetupFee: dto.contractedSetupFee,
            contractedAt: new Date(),
            internalNotes: dto.internalNotes,
            startedAt: new Date(),
            nextBillingDate,
            accessUntil,
            gracePeriodDays: defaultGracePeriodDays,
          },
          include: {
            plan: true,
            tenant: true,
          },
        })

    await this.auditLogsService.create({
      actor,
      action: 'Ativou assinatura',
      target: tenant.name,
      level: AuditLogLevel.INFO,
      metadata: {
        tenantId: tenant.id,
        subscriptionId: subscription.id,
        planId: plan.id,
      },
    })

    return subscription
  }

  async changeTenantPlan(
    tenantId: string,
    dto: ChangeTenantPlanDto,
    actor: Actor,
  ) {
    const tenant = await this.prisma.tenant.findFirst({
      where: withCommercialTenant({ id: tenantId }),
    })

    if (!tenant) {
      throw new NotFoundException('Cliente nao encontrado.')
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    })

    if (!plan || !plan.isActive) {
      throw new BadRequestException('Plano invalido ou inativo.')
    }

    const currentSubscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId: tenant.id,
        status: {
          in: [
            SubscriptionStatus.PENDING,
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.CANCEL_SCHEDULED,
            SubscriptionStatus.BLOCKED,
          ],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    const defaultDueDate = defaultSubscriptionDueDate()

    const subscription = currentSubscription
      ? await this.prisma.subscription.update({
          where: { id: currentSubscription.id },
          data: {
            planId: plan.id,
            contractedMonthlyPrice: dto.contractedMonthlyPrice,
            contractedAnnualPrice: dto.contractedAnnualPrice,
            contractedSetupFee: dto.contractedSetupFee,
            contractedAt: new Date(),
            internalNotes:
              dto.internalNotes ?? currentSubscription.internalNotes,
          },
          include: {
            plan: true,
            tenant: true,
          },
        })
      : await this.prisma.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: plan.id,
            status: SubscriptionStatus.ACTIVE,
            contractedMonthlyPrice: dto.contractedMonthlyPrice,
            contractedAnnualPrice: dto.contractedAnnualPrice,
            contractedSetupFee: dto.contractedSetupFee,
            contractedAt: new Date(),
            internalNotes: dto.internalNotes,
            startedAt: new Date(),
            nextBillingDate: defaultDueDate,
            accessUntil: defaultDueDate,
            gracePeriodDays: defaultGracePeriodDays,
          },
          include: {
            plan: true,
            tenant: true,
          },
        })

    await this.auditLogsService.create({
      actor,
      action: 'Alterou plano do cliente',
      target: tenant.name,
      level: AuditLogLevel.INFO,
      metadata: {
        tenantId: tenant.id,
        subscriptionId: subscription.id,
        planId: plan.id,
        contractedMonthlyPrice: dto.contractedMonthlyPrice,
        previousPlanId: currentSubscription?.planId,
      },
    })

    return subscription
  }

  async scheduleSubscriptionCancellation(
    subscriptionId: string,
    dto: SubscriptionActionDto,
    actor: Actor,
  ) {
    const subscription = await this.getSubscription(subscriptionId)
    const accessUntil = dto.accessUntil
      ? new Date(dto.accessUntil)
      : subscription.accessUntil || subscription.nextBillingDate || new Date()

    if (subscription.mercadoPagoSubscriptionId) {
      await this.mercadoPagoService.updatePreapprovalStatus(
        subscription.mercadoPagoSubscriptionId,
        'cancelled',
      )
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.CANCEL_SCHEDULED,
        mercadoPagoSubscriptionStatus: subscription.mercadoPagoSubscriptionId
          ? 'cancelled'
          : subscription.mercadoPagoSubscriptionStatus,
        canceledAt: new Date(),
        accessUntil,
        blockedAt: null,
      },
      include: {
        plan: true,
        tenant: true,
      },
    })

    await this.auditLogsService.create({
      actor,
      action: 'Agendou cancelamento de assinatura',
      target: subscription.tenant.name,
      level: AuditLogLevel.WARNING,
      metadata: {
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        accessUntil,
        reason: dto.reason,
      },
    })

    return updated
  }

  async blockSubscription(
    subscriptionId: string,
    dto: SubscriptionActionDto,
    actor: Actor,
  ) {
    const subscription = await this.getSubscription(subscriptionId)
    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.BLOCKED,
        blockedAt: new Date(),
      },
      include: {
        plan: true,
        tenant: true,
      },
    })

    await this.auditLogsService.create({
      actor,
      action: 'Bloqueou assinatura',
      target: subscription.tenant.name,
      level: AuditLogLevel.CRITICAL,
      metadata: {
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        reason: dto.reason,
      },
    })

    return updated
  }

  async unblockSubscription(
    subscriptionId: string,
    dto: SubscriptionActionDto,
    actor: Actor,
  ) {
    const subscription = await this.getSubscription(subscriptionId)
    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        blockedAt: null,
        accessUntil: dto.accessUntil
          ? new Date(dto.accessUntil)
          : subscription.accessUntil,
      },
      include: {
        plan: true,
        tenant: true,
      },
    })

    await this.auditLogsService.create({
      actor,
      action: 'Desbloqueou assinatura',
      target: subscription.tenant.name,
      level: AuditLogLevel.WARNING,
      metadata: {
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
      },
    })

    return updated
  }

  async createMercadoPagoSubscriptionLink(
    subscriptionId: string,
    actor: Actor,
  ) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        tenant: commercialTenantWhere,
      },
      include: {
        plan: true,
        tenant: {
          include: {
            users: {
              where: {
                role: UserRole.CLIENT_OWNER,
              },
              select: {
                email: true,
              },
              take: 1,
            },
          },
        },
      },
    })

    if (!subscription) {
      throw new NotFoundException('Assinatura nao encontrada.')
    }

    const ownerEmail = subscription.tenant.users[0]?.email

    if (!ownerEmail) {
      throw new BadRequestException('Cliente sem email do dono da pizzaria.')
    }

    const preapproval = await this.mercadoPagoService.createPreapproval({
      subscriptionId: subscription.id,
      tenantId: subscription.tenantId,
      tenantName: subscription.tenant.name,
      payerEmail: ownerEmail,
      amount: toMoneyNumber(
        subscription.contractedMonthlyPrice,
        toMoneyNumber(subscription.plan.monthlyPrice),
      ),
    })

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        mercadoPagoSubscriptionId: preapproval.id,
        mercadoPagoSubscriptionUrl: preapproval.initPoint,
        mercadoPagoSubscriptionStatus: preapproval.status,
        status: SubscriptionStatus.PENDING,
        nextBillingDate: preapproval.nextPaymentDate
          ? new Date(preapproval.nextPaymentDate)
          : subscription.nextBillingDate,
      },
      include: {
        plan: true,
        tenant: {
          include: {
            users: {
              where: {
                role: UserRole.CLIENT_OWNER,
              },
              select: {
                id: true,
                name: true,
                email: true,
              },
              take: 1,
            },
          },
        },
      },
    })

    await this.auditLogsService.create({
      actor,
      action: 'Gerou assinatura Mercado Pago',
      target: subscription.tenant.name,
      level: AuditLogLevel.INFO,
      metadata: {
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        mercadoPagoSubscriptionId: preapproval.id,
      },
    })

    return updated
  }

  async refreshSubscriptionStatuses(source = 'system') {
    const now = new Date()

    const subscriptionsToCancel = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.CANCEL_SCHEDULED,
        tenant: commercialTenantWhere,
        accessUntil: {
          lt: now,
        },
      },
      include: {
        tenant: true,
      },
    })

    for (const subscription of subscriptionsToCancel) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELED,
        },
      })

      await this.auditLogsService.create({
        action: 'Cancelamento efetivado',
        target: subscription.tenant.name,
        level: AuditLogLevel.WARNING,
        metadata: {
          source,
          tenantId: subscription.tenantId,
          subscriptionId: subscription.id,
          accessUntil: subscription.accessUntil?.toISOString(),
        },
      })
    }

    const subscriptionsToMarkPastDue = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        tenant: commercialTenantWhere,
        nextBillingDate: {
          lt: now,
        },
      },
      include: {
        tenant: true,
      },
    })

    for (const subscription of subscriptionsToMarkPastDue) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.PAST_DUE,
        },
      })

      await this.auditLogsService.create({
        action: 'Assinatura em atraso',
        target: subscription.tenant.name,
        level: AuditLogLevel.WARNING,
        metadata: {
          source,
          tenantId: subscription.tenantId,
          subscriptionId: subscription.id,
          nextBillingDate: subscription.nextBillingDate?.toISOString(),
          gracePeriodDays: subscription.gracePeriodDays,
        },
      })
    }

    const pastDueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.PAST_DUE,
        tenant: commercialTenantWhere,
        nextBillingDate: {
          not: null,
        },
      },
      include: {
        tenant: true,
      },
    })

    const subscriptionsToBlock = pastDueSubscriptions
      .filter((subscription) => {
        if (!subscription.nextBillingDate) return false
        const blockDate = new Date(subscription.nextBillingDate)
        blockDate.setDate(blockDate.getDate() + subscription.gracePeriodDays)
        return blockDate < now
      })
      .map((subscription) => subscription.id)

    for (const subscriptionId of subscriptionsToBlock) {
      const subscription = pastDueSubscriptions.find(
        (current) => current.id === subscriptionId,
      )

      if (!subscription) continue

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.BLOCKED,
          blockedAt: subscription.blockedAt ?? now,
        },
      })

      await this.auditLogsService.create({
        action: 'Bloqueio automatico por atraso',
        target: subscription.tenant.name,
        level: AuditLogLevel.CRITICAL,
        metadata: {
          source,
          tenantId: subscription.tenantId,
          subscriptionId: subscription.id,
          nextBillingDate: subscription.nextBillingDate?.toISOString(),
          gracePeriodDays: subscription.gracePeriodDays,
        },
      })
    }

    return {
      canceled: subscriptionsToCancel.length,
      pastDue: subscriptionsToMarkPastDue.length,
      blocked: subscriptionsToBlock.length,
    }
  }

  private async getSubscription(id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id,
        tenant: commercialTenantWhere,
      },
      include: {
        plan: true,
        tenant: true,
      },
    })

    if (!subscription) {
      throw new NotFoundException('Assinatura nao encontrada.')
    }

    return subscription
  }
}
