import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import {
  AuditLogLevel,
  BillingInvoiceStatus,
  BillingPaymentMethod,
  PaymentWebhookLog,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client'
import * as bcrypt from 'bcryptjs'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditLogsService } from '../audit-logs/audit-logs.service'

import { CreateBillingInvoiceDto } from './dto/create-billing-invoice.dto'
import { ActivateSubscriptionDto } from './dto/activate-subscription.dto'
import { ChangeTenantPlanDto } from './dto/change-tenant-plan.dto'
import { CreatePlanDto } from './dto/create-plan.dto'
import { ManualPaymentDto } from './dto/manual-payment.dto'
import { SubscriptionActionDto } from './dto/subscription-action.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'
import { MercadoPagoService } from './mercado-pago.service'
import { SubscriptionAccessService } from './subscription-access.service'

type Actor = {
  userId?: string
  role?: string
  permissions?: string[]
}

const monthlyFee = 150
const defaultPlanSlug = 'plano-megas-food'
const defaultGracePeriodDays = 5

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly subscriptionAccessService: SubscriptionAccessService,
  ) {}

  async listInvoices(actor: Actor) {
    this.assertFinancialAccess(actor)
    await this.refreshOverdueInvoices()

    return this.prisma.billingInvoice.findMany({
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
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

  async listPlans(actor: Actor) {
    this.assertFinancialAccess(actor)
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

  async getPlan(planId: string, actor: Actor) {
    this.assertFinancialAccess(actor)
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
    this.assertFinancialAccess(actor)
    const slug = this.normalizeSlug(dto.slug)

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
        description: this.emptyToNull(dto.description),
        monthlyPrice: dto.monthlyPrice,
        annualPrice: dto.annualPrice,
        setupFee: dto.setupFee,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        features: this.cleanStringList(dto.features),
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
    this.assertFinancialAccess(actor)
    const current = await this.prisma.plan.findUnique({
      where: {
        id: planId,
      },
    })

    if (!current) {
      throw new NotFoundException('Plano nao encontrado.')
    }

    const slug = dto.slug !== undefined ? this.normalizeSlug(dto.slug) : undefined

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
          ? { description: this.emptyToNull(dto.description) }
          : {}),
        ...(dto.monthlyPrice !== undefined ? { monthlyPrice: dto.monthlyPrice } : {}),
        ...(dto.annualPrice !== undefined ? { annualPrice: dto.annualPrice } : {}),
        ...(dto.setupFee !== undefined ? { setupFee: dto.setupFee } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.features !== undefined
          ? { features: this.cleanStringList(dto.features) }
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

  async listSubscriptions(actor: Actor) {
    this.assertFinancialAccess(actor)
    await this.runSubscriptionMaintenance('master-list-subscriptions')

    return this.prisma.subscription.findMany({
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

  async runSubscriptionMaintenance(source = 'system') {
    return this.refreshSubscriptionStatuses(source)
  }

  async listEvents(actor: Actor) {
    this.assertFinancialAccess(actor)

    const [auditLogs, webhookLogs] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          OR: [
            {
              action: {
                contains: 'assinatura',
              },
            },
            {
              action: {
                contains: 'cobranca',
              },
            },
            {
              action: {
                contains: 'pagamento',
              },
            },
            {
              action: {
                contains: 'Mercado Pago',
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 40,
      }),
      this.prisma.paymentWebhookLog.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 40,
      }),
    ])

    return [
      ...auditLogs.map((event) => ({
        id: event.id,
        source: 'AUDIT' as const,
        title: event.action,
        target: event.target,
        level: event.level,
        processed: true,
        error: null,
        createdAt: event.createdAt,
      })),
      ...webhookLogs.map((event) => ({
        id: event.id,
        source: 'WEBHOOK' as const,
        title: event.eventType || 'Webhook Mercado Pago',
        target: event.resourceId || 'Mercado Pago',
        level: event.error ? AuditLogLevel.WARNING : AuditLogLevel.INFO,
        processed: event.processed,
        error: event.error,
        createdAt: event.createdAt,
      })),
    ]
      .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
      .slice(0, 30)
  }

  async getDiagnostics(actor: Actor) {
    this.assertFinancialAccess(actor)

    const now = new Date()
    const oneDayAgo = new Date(now)
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const oldPendingThreshold = new Date(now)
    oldPendingThreshold.setMinutes(oldPendingThreshold.getMinutes() - 15)

    const [
      pendingWebhooks,
      oldPendingWebhooks,
      failedWebhooks24h,
      latestWebhookError,
      pastDueSubscriptions,
      blockedSubscriptions,
      upcomingRenewals,
    ] = await Promise.all([
      this.prisma.paymentWebhookLog.count({
        where: {
          processed: false,
          error: null,
        },
      }),
      this.prisma.paymentWebhookLog.count({
        where: {
          processed: false,
          error: null,
          createdAt: {
            lt: oldPendingThreshold,
          },
        },
      }),
      this.prisma.paymentWebhookLog.count({
        where: {
          error: {
            not: null,
          },
          createdAt: {
            gte: oneDayAgo,
          },
        },
      }),
      this.prisma.paymentWebhookLog.findFirst({
        where: {
          error: {
            not: null,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          eventType: true,
          resourceId: true,
          error: true,
          createdAt: true,
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: SubscriptionStatus.PAST_DUE,
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: SubscriptionStatus.BLOCKED,
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE],
          },
          nextBillingDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
      }),
    ])

    const hasCriticalIssue =
      oldPendingWebhooks > 0 || failedWebhooks24h > 0 || blockedSubscriptions > 0
    const hasWarning = pendingWebhooks > 0 || pastDueSubscriptions > 0

    return {
      status: hasCriticalIssue ? 'CRITICAL' : hasWarning ? 'WARNING' : 'OK',
      checkedAt: now,
      pendingWebhooks,
      oldPendingWebhooks,
      failedWebhooks24h,
      latestWebhookError,
      pastDueSubscriptions,
      blockedSubscriptions,
      upcomingRenewals,
    }
  }

  async reprocessWebhook(eventId: string, actor: Actor) {
    this.assertFinancialAccess(actor)

    const webhookLog = await this.prisma.paymentWebhookLog.findUnique({
      where: { id: eventId },
    })

    if (!webhookLog) {
      throw new NotFoundException('Webhook nao encontrado.')
    }

    if (webhookLog.provider !== 'MERCADO_PAGO') {
      throw new BadRequestException('Apenas webhooks do Mercado Pago podem ser reprocessados.')
    }

    if (webhookLog.processed && !webhookLog.error) {
      throw new BadRequestException('Este webhook ja foi processado com sucesso.')
    }

    const result = await this.processMercadoPagoWebhookLog(webhookLog)

    await this.auditLogsService.create({
      actor,
      action: 'Reprocessou webhook Mercado Pago',
      target: webhookLog.resourceId || webhookLog.eventType || 'Mercado Pago',
      level: AuditLogLevel.WARNING,
      metadata: {
        webhookLogId: webhookLog.id,
        eventType: webhookLog.eventType,
        resourceId: webhookLog.resourceId,
      },
    })

    return result
  }

  async getMySubscription(tenantId?: string) {
    if (!tenantId) {
      throw new UnauthorizedException('Tenant nao identificado.')
    }

    const plan = await this.ensureDefaultPlan()
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
            mercadoPagoSubscriptionStatus: subscription.mercadoPagoSubscriptionStatus,
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
    this.assertFinancialAccess(actor)

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    })

    if (!tenant) {
      throw new NotFoundException('Cliente nao encontrado.')
    }

    const plan = dto.planId
      ? await this.prisma.plan.findUnique({ where: { id: dto.planId } })
      : await this.ensureDefaultPlan()

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
      : this.defaultSubscriptionDueDate()
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
              dto.contractedAnnualPrice ?? currentSubscription.contractedAnnualPrice,
            contractedSetupFee:
              dto.contractedSetupFee ?? currentSubscription.contractedSetupFee,
            contractedAt: isContractChange
              ? new Date()
              : currentSubscription.contractedAt,
            internalNotes: dto.internalNotes ?? currentSubscription.internalNotes,
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
    this.assertFinancialAccess(actor)

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
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
    const defaultDueDate = this.defaultSubscriptionDueDate()

    const subscription = currentSubscription
      ? await this.prisma.subscription.update({
          where: { id: currentSubscription.id },
          data: {
            planId: plan.id,
            contractedMonthlyPrice: dto.contractedMonthlyPrice,
            contractedAnnualPrice: dto.contractedAnnualPrice,
            contractedSetupFee: dto.contractedSetupFee,
            contractedAt: new Date(),
            internalNotes: dto.internalNotes ?? currentSubscription.internalNotes,
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
    this.assertFinancialAccess(actor)
    await this.verifyCriticalAction(actor.userId, dto.confirmationPassword)

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
    this.assertFinancialAccess(actor)
    await this.verifyCriticalAction(actor.userId, dto.confirmationPassword)

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
    this.assertFinancialAccess(actor)
    await this.verifyCriticalAction(actor.userId, dto.confirmationPassword)

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

  async createMercadoPagoSubscriptionLink(subscriptionId: string, actor: Actor) {
    this.assertFinancialAccess(actor)

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
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
      amount: this.toMoneyNumber(
        subscription.contractedMonthlyPrice,
        this.toMoneyNumber(subscription.plan.monthlyPrice),
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

  async createInvoice(dto: CreateBillingInvoiceDto, actor: Actor) {
    this.assertFinancialAccess(actor)
    const defaultPlan = await this.ensureDefaultPlan()

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    })

    if (!tenant) {
      throw new NotFoundException('Cliente nao encontrado.')
    }

    const subscription = await this.prisma.subscription.findFirst({
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
      include: {
        plan: true,
      },
    })
    const invoicePlan = subscription?.plan ?? defaultPlan
    const invoiceAmount = subscription
      ? this.toMoneyNumber(
          subscription.contractedMonthlyPrice,
          this.toMoneyNumber(subscription.plan.monthlyPrice),
        )
      : monthlyFee

    const invoice = await this.prisma.billingInvoice.create({
      data: {
        tenantId: tenant.id,
        planId: invoicePlan.id,
        subscriptionId: subscription?.id,
        amount: invoiceAmount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : this.defaultDueDate(),
        status: BillingInvoiceStatus.OPEN,
      },
      include: {
        tenant: true,
      },
    })

    await this.auditLogsService.create({
      actor,
      action: 'Criou cobranca',
      target: tenant.name,
      level: AuditLogLevel.INFO,
      metadata: {
        invoiceId: invoice.id,
        tenantId: tenant.id,
        subscriptionId: subscription?.id,
        planId: invoicePlan.id,
        amount: invoiceAmount,
      },
    })

    return invoice
  }

  async createMercadoPagoPreference(invoiceId: string, actor: Actor) {
    this.assertFinancialAccess(actor)

    const invoice = await this.getInvoice(invoiceId)

    if (invoice.status === BillingInvoiceStatus.PAID) {
      throw new ForbiddenException('Esta cobranca ja esta paga.')
    }

    const preference = await this.mercadoPagoService.createPreference({
      invoiceId: invoice.id,
      tenantId: invoice.tenantId,
      tenantName: invoice.tenant.name,
      amount: Number(invoice.amount),
    })

    const updated = await this.prisma.billingInvoice.update({
      where: { id: invoice.id },
      data: {
        mercadoPagoPreferenceId: preference.preferenceId,
        paymentUrl: preference.paymentUrl,
        sandboxPaymentUrl: preference.sandboxPaymentUrl,
        paymentMethod: BillingPaymentMethod.MERCADO_PAGO,
      },
      include: {
        tenant: true,
      },
    })

    await this.auditLogsService.create({
      actor,
      action: 'Gerou link Mercado Pago',
      target: invoice.tenant.name,
      level: AuditLogLevel.INFO,
      metadata: {
        invoiceId: invoice.id,
        preferenceId: preference.preferenceId,
      },
    })

    return updated
  }

  async markManualPayment(invoiceId: string, dto: ManualPaymentDto, actor: Actor) {
    this.assertFinancialAccess(actor)
    await this.verifyCriticalAction(actor.userId, dto.confirmationPassword)

    const invoice = await this.getInvoice(invoiceId)

    const updated = await this.prisma.billingInvoice.update({
      where: { id: invoice.id },
      data: {
        status: BillingInvoiceStatus.PAID,
        paymentMethod: BillingPaymentMethod.MANUAL,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        notes: dto.notes,
      },
      include: {
        tenant: true,
      },
    })

    await this.auditLogsService.create({
      actor,
      action: 'Registrou pagamento manual',
      target: invoice.tenant.name,
      level: AuditLogLevel.WARNING,
      metadata: {
        invoiceId: invoice.id,
        tenantId: invoice.tenantId,
        amount: Number(invoice.amount),
      },
    })

    return updated
  }

  async handleMercadoPagoWebhook(input: {
    body: any
    query: Record<string, unknown>
    headers: Record<string, unknown>
  }) {
    const dataId = this.extractDataId(input.body, input.query)
    const eventId = String(input.body?.id || input.query.id || dataId || '')
    const eventType = String(input.body?.type || input.query.type || input.query.topic || '')

    this.mercadoPagoService.validateWebhookSignature({
      dataId,
      requestId: this.getHeader(input.headers, 'x-request-id'),
      signature: this.getHeader(input.headers, 'x-signature'),
    })

    const webhookLog = await this.prisma.paymentWebhookLog.upsert({
      where: {
        provider_eventId: {
          provider: 'MERCADO_PAGO',
          eventId: eventId || `payment-${dataId}`,
        },
      },
      create: {
        provider: 'MERCADO_PAGO',
        eventId: eventId || `payment-${dataId}`,
        eventType,
        resourceId: dataId,
        payload: input.body,
      },
      update: {
        eventType,
        resourceId: dataId,
        payload: input.body,
      },
    })

    return this.processMercadoPagoWebhookLog(webhookLog)
  }

  private async processMercadoPagoWebhookLog(webhookLog: PaymentWebhookLog) {
    const dataId = webhookLog.resourceId || ''
    const eventType = webhookLog.eventType || ''

    try {
      if (dataId && this.isPreapprovalEvent(eventType)) {
        const preapproval = await this.mercadoPagoService.getPreapproval(dataId)
        const subscription = await this.prisma.subscription.findFirst({
          where: {
            OR: [
              { mercadoPagoSubscriptionId: String(preapproval.id) },
              { id: preapproval.external_reference || '' },
            ],
          },
          include: {
            tenant: true,
          },
        })

        if (!subscription) {
          throw new Error('Assinatura Mercado Pago sem vinculo interno.')
        }

        const internalStatus = this.mapMercadoPagoSubscriptionStatus(
          preapproval.status,
          subscription.status,
        )

        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: internalStatus,
            mercadoPagoSubscriptionId: String(preapproval.id),
            mercadoPagoSubscriptionStatus: preapproval.status,
            mercadoPagoSubscriptionUrl:
              preapproval.init_point || subscription.mercadoPagoSubscriptionUrl,
            nextBillingDate: preapproval.next_payment_date
              ? new Date(preapproval.next_payment_date)
              : subscription.nextBillingDate,
            accessUntil: preapproval.next_payment_date
              ? new Date(preapproval.next_payment_date)
              : subscription.accessUntil,
            startedAt:
              internalStatus === SubscriptionStatus.ACTIVE
                ? subscription.startedAt ?? new Date()
                : subscription.startedAt,
          },
        })

        await this.markWebhookProcessed(webhookLog.id)

        await this.auditLogsService.create({
          action: 'Webhook assinatura Mercado Pago',
          target: subscription.tenant.name,
          level: AuditLogLevel.INFO,
          metadata: {
            subscriptionId: subscription.id,
            mercadoPagoSubscriptionId: preapproval.id,
            mercadoPagoStatus: preapproval.status,
          },
        })

        return { received: true, reprocessed: true }
      }

      if (!dataId || eventType !== 'payment') {
        await this.markWebhookProcessed(webhookLog.id)

        return { received: true, reprocessed: true }
      }

      const payment = await this.mercadoPagoService.getPayment(dataId)
      const invoiceId = payment.external_reference || payment.metadata?.invoice_id

      if (!invoiceId) {
        throw new Error('Pagamento sem referencia de fatura.')
      }

      const invoice = await this.getInvoice(invoiceId)

      const status =
        payment.status === 'approved'
          ? BillingInvoiceStatus.PAID
          : invoice.status

      await this.prisma.billingInvoice.update({
        where: { id: invoice.id },
        data: {
          status,
          paymentMethod: BillingPaymentMethod.MERCADO_PAGO,
          mercadoPagoPaymentId: String(payment.id),
          mercadoPagoPaymentStatus: payment.status,
          paidAt: payment.status === 'approved'
            ? payment.date_approved
              ? new Date(payment.date_approved)
              : new Date()
            : invoice.paidAt,
        },
      })

      await this.markWebhookProcessed(webhookLog.id)

      if (payment.status === 'approved') {
        await this.auditLogsService.create({
          action: 'Pagamento Mercado Pago aprovado',
          target: invoice.tenant.name,
          level: AuditLogLevel.INFO,
          metadata: {
            invoiceId: invoice.id,
            paymentId: payment.id,
          },
        })
      }

      return { received: true, reprocessed: true }
    } catch (error) {
      await this.prisma.paymentWebhookLog.update({
        where: { id: webhookLog.id },
        data: {
          processed: false,
          error: error instanceof Error ? error.message : 'Erro ao processar webhook.',
          processedAt: new Date(),
        },
      })

      throw error
    }
  }

  private async markWebhookProcessed(webhookLogId: string) {
    await this.prisma.paymentWebhookLog.update({
      where: { id: webhookLogId },
      data: {
        processed: true,
        error: null,
        processedAt: new Date(),
      },
    })
  }

  private async getInvoice(id: string) {
    const invoice = await this.prisma.billingInvoice.findUnique({
      where: { id },
      include: {
        tenant: true,
      },
    })

    if (!invoice) {
      throw new NotFoundException('Cobranca nao encontrada.')
    }

    return invoice
  }

  private async getSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
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

  private async ensureDefaultPlan() {
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

  private toMoneyNumber(value: unknown, fallback = monthlyFee) {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : fallback
  }

  private normalizeSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private emptyToNull(value?: string) {
    const trimmed = value?.trim()

    return trimmed ? trimmed : null
  }

  private cleanStringList(value?: string[]) {
    return Array.from(
      new Set((value || []).map((item) => item.trim()).filter(Boolean)),
    )
  }

  private async refreshOverdueInvoices() {
    await this.prisma.billingInvoice.updateMany({
      where: {
        status: BillingInvoiceStatus.OPEN,
        dueDate: {
          lt: new Date(),
        },
      },
      data: {
        status: BillingInvoiceStatus.OVERDUE,
      },
    })
  }

  private async refreshSubscriptionStatuses(source = 'system') {
    const now = new Date()

    const subscriptionsToCancel = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.CANCEL_SCHEDULED,
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

  private defaultDueDate() {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    date.setHours(23, 59, 59, 999)
    return date
  }

  private defaultSubscriptionDueDate() {
    const date = new Date()
    date.setMonth(date.getMonth() + 1)
    date.setHours(23, 59, 59, 999)
    return date
  }

  private assertFinancialAccess(actor: Actor) {
    const canView =
      actor.role === 'MASTER_OWNER' ||
      actor.role === 'MASTER_ADMIN' ||
      actor.role === 'FINANCE_ADMIN' ||
      Boolean(actor.permissions?.includes('VIEW_FINANCIAL_DATA'))

    if (!canView) {
      throw new ForbiddenException('Dados financeiros restritos.')
    }
  }

  private async verifyCriticalAction(userId?: string, password?: string) {
    if (!userId || !password) {
      throw new UnauthorizedException('Confirme sua senha para registrar pagamento manual.')
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

  private extractDataId(body: any, query: Record<string, unknown>) {
    return String(
      body?.data?.id ||
        query['data.id'] ||
        query.id ||
        body?.id ||
        '',
    )
  }

  private headerToString(value: unknown) {
    return Array.isArray(value)
      ? String(value[0] || '')
      : String(value || '')
  }

  private getHeader(headers: Record<string, unknown>, name: string) {
    const normalizedName = name.toLowerCase()
    const key = Object.keys(headers).find(
      (currentKey) => currentKey.toLowerCase() === normalizedName,
    )

    return this.headerToString(key ? headers[key] : '')
  }

  private isPreapprovalEvent(eventType: string) {
    return ['preapproval', 'subscription_preapproval'].includes(eventType)
  }

  private mapMercadoPagoSubscriptionStatus(
    status: string | undefined,
    currentStatus: SubscriptionStatus,
  ) {
    if (status === 'authorized') return SubscriptionStatus.ACTIVE
    if (status === 'paused') return SubscriptionStatus.PAST_DUE
    if (status === 'cancelled') return SubscriptionStatus.CANCEL_SCHEDULED
    if (status === 'pending') return SubscriptionStatus.PENDING

    return currentStatus
  }
}
