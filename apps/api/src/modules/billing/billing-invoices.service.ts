import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  AuditLogLevel,
  BillingInvoiceStatus,
  BillingPaymentMethod,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditLogsService } from '../audit-logs/audit-logs.service'
import {
  commercialTenantWhere,
  withCommercialTenant,
} from '../tenants/commercial-tenant'

import { monthlyFee } from './billing.constants'
import { defaultDueDate, toMoneyNumber } from './billing.helpers'
import { BillingPlansService } from './billing-plans.service'
import { CreateBillingInvoiceDto } from './dto/create-billing-invoice.dto'
import { ManualPaymentDto } from './dto/manual-payment.dto'
import { MercadoPagoService } from './mercado-pago.service'
import type { Actor } from './billing.types'

@Injectable()
export class BillingInvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly billingPlansService: BillingPlansService,
  ) {}

  async listInvoices() {
    await this.refreshOverdueInvoices()

    return this.prisma.billingInvoice.findMany({
      where: {
        tenant: commercialTenantWhere,
      },
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

  async createInvoice(dto: CreateBillingInvoiceDto, actor: Actor) {
    const defaultPlan = await this.billingPlansService.ensureDefaultPlan()

    const tenant = await this.prisma.tenant.findFirst({
      where: withCommercialTenant({ id: dto.tenantId }),
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
      ? toMoneyNumber(
          subscription.contractedMonthlyPrice,
          toMoneyNumber(subscription.plan.monthlyPrice),
        )
      : monthlyFee

    const invoice = await this.prisma.billingInvoice.create({
      data: {
        tenantId: tenant.id,
        planId: invoicePlan.id,
        subscriptionId: subscription?.id,
        amount: invoiceAmount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : defaultDueDate(),
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

  async markManualPayment(
    invoiceId: string,
    dto: ManualPaymentDto,
    actor: Actor,
  ) {
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

  async refreshOverdueInvoices() {
    await this.prisma.billingInvoice.updateMany({
      where: {
        status: BillingInvoiceStatus.OPEN,
        tenant: commercialTenantWhere,
        dueDate: {
          lt: new Date(),
        },
      },
      data: {
        status: BillingInvoiceStatus.OVERDUE,
      },
    })
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.billingInvoice.findFirst({
      where: {
        id,
        tenant: commercialTenantWhere,
      },
      include: {
        tenant: true,
      },
    })

    if (!invoice) {
      throw new NotFoundException('Cobranca nao encontrada.')
    }

    return invoice
  }
}
