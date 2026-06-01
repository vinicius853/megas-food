import { ForbiddenException, Injectable } from '@nestjs/common'
import { SubscriptionStatus, UserRole } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'

type TenantAccessResult = {
  status: SubscriptionStatus | 'LEGACY'
  canAccessDashboard: boolean
  canAcceptOrders: boolean
  accessUntil: Date | null
  nextBillingDate: Date | null
  message: string | null
}

const clientRoles = new Set<string>([
  UserRole.CLIENT_OWNER,
  UserRole.CLIENT_ADMIN,
  UserRole.CASHIER,
])

@Injectable()
export class SubscriptionAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateTenantAccess(tenantId: string): Promise<TenantAccessResult> {
    const subscription = await this.refreshTenantSubscription(tenantId)

    if (!subscription) {
      return {
        status: 'LEGACY',
        canAccessDashboard: true,
        canAcceptOrders: true,
        accessUntil: null,
        nextBillingDate: null,
        message: null,
      }
    }

    const now = new Date()
    const isWithinAccess =
      !subscription.accessUntil || subscription.accessUntil >= now

    if (subscription.status === SubscriptionStatus.BLOCKED) {
      return {
        status: subscription.status,
        canAccessDashboard: false,
        canAcceptOrders: false,
        accessUntil: subscription.accessUntil,
        nextBillingDate: subscription.nextBillingDate,
        message:
          'Assinatura bloqueada. Regularize o pagamento para voltar a receber pedidos.',
      }
    }

    if (subscription.status === SubscriptionStatus.CANCELED) {
      return {
        status: subscription.status,
        canAccessDashboard: false,
        canAcceptOrders: false,
        accessUntil: subscription.accessUntil,
        nextBillingDate: subscription.nextBillingDate,
        message: 'Assinatura cancelada. Entre em contato com a Megas Food.',
      }
    }

    if (subscription.status === SubscriptionStatus.PENDING) {
      return {
        status: subscription.status,
        canAccessDashboard: true,
        canAcceptOrders: false,
        accessUntil: subscription.accessUntil,
        nextBillingDate: subscription.nextBillingDate,
        message:
          'Assinatura pendente. O cardapio esta visivel, mas ainda nao recebe pedidos.',
      }
    }

    if (subscription.status === SubscriptionStatus.CANCEL_SCHEDULED) {
      return {
        status: subscription.status,
        canAccessDashboard: isWithinAccess,
        canAcceptOrders: isWithinAccess,
        accessUntil: subscription.accessUntil,
        nextBillingDate: subscription.nextBillingDate,
        message: isWithinAccess
          ? 'Cancelamento agendado. O acesso permanece ativo ate o fim do periodo pago.'
          : 'Assinatura cancelada. Entre em contato com a Megas Food.',
      }
    }

    return {
      status: subscription.status,
      canAccessDashboard: true,
      canAcceptOrders: true,
      accessUntil: subscription.accessUntil,
      nextBillingDate: subscription.nextBillingDate,
      message:
        subscription.status === SubscriptionStatus.PAST_DUE
          ? 'Assinatura em atraso. Regularize em ate 5 dias para evitar bloqueio.'
          : null,
    }
  }

  async assertClientDashboardAccess(tenantId: string, role?: string) {
    if (!role || !clientRoles.has(role)) {
      return
    }

    const access = await this.evaluateTenantAccess(tenantId)

    if (!access.canAccessDashboard) {
      throw new ForbiddenException(
        access.message || 'Acesso bloqueado pela assinatura.',
      )
    }
  }

  async assertTenantCanAcceptOrders(tenantId: string) {
    const access = await this.evaluateTenantAccess(tenantId)

    if (!access.canAcceptOrders) {
      throw new ForbiddenException(
        access.message || 'Este cardapio nao esta recebendo pedidos no momento.',
      )
    }

    return access
  }

  private async refreshTenantSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!subscription) {
      return null
    }

    const now = new Date()

    if (
      subscription.status === SubscriptionStatus.CANCEL_SCHEDULED &&
      subscription.accessUntil &&
      subscription.accessUntil < now
    ) {
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELED,
        },
      })
    }

    if (
      (subscription.status === SubscriptionStatus.ACTIVE ||
        subscription.status === SubscriptionStatus.PAST_DUE) &&
      subscription.nextBillingDate &&
      subscription.nextBillingDate < now
    ) {
      const blockDate = new Date(subscription.nextBillingDate)
      blockDate.setDate(blockDate.getDate() + subscription.gracePeriodDays)

      if (blockDate < now) {
        return this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.BLOCKED,
            blockedAt: subscription.blockedAt ?? now,
          },
        })
      }

      if (subscription.status === SubscriptionStatus.ACTIVE) {
        return this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.PAST_DUE,
          },
        })
      }
    }

    return subscription
  }
}
