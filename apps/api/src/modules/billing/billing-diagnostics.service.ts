import { Injectable } from '@nestjs/common'
import { SubscriptionStatus } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'
import { commercialTenantWhere } from '../tenants/commercial-tenant'

@Injectable()
export class BillingDiagnosticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDiagnostics() {
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
          tenant: commercialTenantWhere,
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: SubscriptionStatus.BLOCKED,
          tenant: commercialTenantWhere,
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE],
          },
          tenant: commercialTenantWhere,
          nextBillingDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
      }),
    ])

    const hasCriticalIssue =
      oldPendingWebhooks > 0 ||
      failedWebhooks24h > 0 ||
      blockedSubscriptions > 0
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
}
