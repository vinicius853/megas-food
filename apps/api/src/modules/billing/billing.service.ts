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
} from '@prisma/client'
import * as bcrypt from 'bcryptjs'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditLogsService } from '../audit-logs/audit-logs.service'
import { commercialTenantWhere } from '../tenants/commercial-tenant'

import { CreateBillingInvoiceDto } from './dto/create-billing-invoice.dto'
import { ActivateSubscriptionDto } from './dto/activate-subscription.dto'
import { ChangeTenantPlanDto } from './dto/change-tenant-plan.dto'
import { CreatePlanDto } from './dto/create-plan.dto'
import { ManualPaymentDto } from './dto/manual-payment.dto'
import { SubscriptionActionDto } from './dto/subscription-action.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'
import { BillingDiagnosticsService } from './billing-diagnostics.service'
import { BillingInvoicesService } from './billing-invoices.service'
import { BillingPlansService } from './billing-plans.service'
import { BillingSubscriptionsService } from './billing-subscriptions.service'
import {
  extractDataId,
  getHeader,
  isPreapprovalEvent,
  mapMercadoPagoSubscriptionStatus,
} from './billing-webhook.helpers'
import type { Actor } from './billing.types'
import { MercadoPagoService } from './mercado-pago.service'

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly billingDiagnosticsService: BillingDiagnosticsService,
    private readonly billingInvoicesService: BillingInvoicesService,
    private readonly billingPlansService: BillingPlansService,
    private readonly billingSubscriptionsService: BillingSubscriptionsService,
  ) {}

  async listInvoices(actor: Actor) {
    this.assertFinancialAccess(actor)

    return this.billingInvoicesService.listInvoices()
  }

  async listPlans(actor: Actor) {
    this.assertFinancialAccess(actor)

    return this.billingPlansService.listPlans()
  }

  async getPlan(planId: string, actor: Actor) {
    this.assertFinancialAccess(actor)

    return this.billingPlansService.getPlan(planId)
  }

  async createPlan(dto: CreatePlanDto, actor: Actor) {
    this.assertFinancialAccess(actor)

    return this.billingPlansService.createPlan(dto, actor)
  }

  async updatePlan(planId: string, dto: UpdatePlanDto, actor: Actor) {
    this.assertFinancialAccess(actor)

    return this.billingPlansService.updatePlan(planId, dto, actor)
  }

  async listSubscriptions(actor: Actor) {
    this.assertFinancialAccess(actor)

    return this.billingSubscriptionsService.listSubscriptions()
  }

  async runSubscriptionMaintenance(source = 'system') {
    return this.billingSubscriptionsService.refreshSubscriptionStatuses(source)
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
      .sort(
        (first, second) =>
          second.createdAt.getTime() - first.createdAt.getTime(),
      )
      .slice(0, 30)
  }

  async getDiagnostics(actor: Actor) {
    this.assertFinancialAccess(actor)

    return this.billingDiagnosticsService.getDiagnostics()
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
      throw new BadRequestException(
        'Apenas webhooks do Mercado Pago podem ser reprocessados.',
      )
    }

    if (webhookLog.processed && !webhookLog.error) {
      throw new BadRequestException(
        'Este webhook ja foi processado com sucesso.',
      )
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
    return this.billingSubscriptionsService.getMySubscription(tenantId)
  }

  async activateSubscription(dto: ActivateSubscriptionDto, actor: Actor) {
    this.assertFinancialAccess(actor)

    return this.billingSubscriptionsService.activateSubscription(dto, actor)
  }

  async changeTenantPlan(
    tenantId: string,
    dto: ChangeTenantPlanDto,
    actor: Actor,
  ) {
    this.assertFinancialAccess(actor)

    return this.billingSubscriptionsService.changeTenantPlan(
      tenantId,
      dto,
      actor,
    )
  }

  async scheduleSubscriptionCancellation(
    subscriptionId: string,
    dto: SubscriptionActionDto,
    actor: Actor,
  ) {
    this.assertFinancialAccess(actor)
    await this.verifyCriticalAction(actor.userId, dto.confirmationPassword)

    return this.billingSubscriptionsService.scheduleSubscriptionCancellation(
      subscriptionId,
      dto,
      actor,
    )
  }

  async blockSubscription(
    subscriptionId: string,
    dto: SubscriptionActionDto,
    actor: Actor,
  ) {
    this.assertFinancialAccess(actor)
    await this.verifyCriticalAction(actor.userId, dto.confirmationPassword)

    return this.billingSubscriptionsService.blockSubscription(
      subscriptionId,
      dto,
      actor,
    )
  }

  async unblockSubscription(
    subscriptionId: string,
    dto: SubscriptionActionDto,
    actor: Actor,
  ) {
    this.assertFinancialAccess(actor)
    await this.verifyCriticalAction(actor.userId, dto.confirmationPassword)

    return this.billingSubscriptionsService.unblockSubscription(
      subscriptionId,
      dto,
      actor,
    )
  }

  async createMercadoPagoSubscriptionLink(
    subscriptionId: string,
    actor: Actor,
  ) {
    this.assertFinancialAccess(actor)

    return this.billingSubscriptionsService.createMercadoPagoSubscriptionLink(
      subscriptionId,
      actor,
    )
  }

  async createInvoice(dto: CreateBillingInvoiceDto, actor: Actor) {
    this.assertFinancialAccess(actor)

    return this.billingInvoicesService.createInvoice(dto, actor)
  }

  async createMercadoPagoPreference(invoiceId: string, actor: Actor) {
    this.assertFinancialAccess(actor)

    return this.billingInvoicesService.createMercadoPagoPreference(
      invoiceId,
      actor,
    )
  }

  async markManualPayment(
    invoiceId: string,
    dto: ManualPaymentDto,
    actor: Actor,
  ) {
    this.assertFinancialAccess(actor)
    await this.verifyCriticalAction(actor.userId, dto.confirmationPassword)

    return this.billingInvoicesService.markManualPayment(invoiceId, dto, actor)
  }

  async handleMercadoPagoWebhook(input: {
    body: any
    query: Record<string, unknown>
    headers: Record<string, unknown>
  }) {
    const dataId = extractDataId(input.body, input.query)
    const eventId = String(input.body?.id || input.query.id || dataId || '')
    const eventType = String(
      input.body?.type || input.query.type || input.query.topic || '',
    )

    this.mercadoPagoService.validateWebhookSignature({
      dataId,
      requestId: getHeader(input.headers, 'x-request-id'),
      signature: getHeader(input.headers, 'x-signature'),
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
      if (dataId && isPreapprovalEvent(eventType)) {
        const preapproval = await this.mercadoPagoService.getPreapproval(dataId)
        const subscription = await this.prisma.subscription.findFirst({
          where: {
            tenant: commercialTenantWhere,
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

        const internalStatus = mapMercadoPagoSubscriptionStatus(
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
                ? (subscription.startedAt ?? new Date())
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
      const invoiceId =
        payment.external_reference || payment.metadata?.invoice_id

      if (!invoiceId) {
        throw new Error('Pagamento sem referencia de fatura.')
      }

      const invoice = await this.billingInvoicesService.getInvoice(invoiceId)

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
          paidAt:
            payment.status === 'approved'
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
          error:
            error instanceof Error
              ? error.message
              : 'Erro ao processar webhook.',
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
      throw new UnauthorizedException(
        'Confirme sua senha para registrar pagamento manual.',
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
}
