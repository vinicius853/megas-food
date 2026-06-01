import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { BillingService } from './billing.service'

const defaultMaintenanceIntervalMs = 15 * 60 * 1000

@Injectable()
export class BillingMaintenanceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BillingMaintenanceService.name)
  private interval?: NodeJS.Timeout
  private isRunning = false

  constructor(
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const intervalMs = this.getIntervalMs()

    this.interval = setInterval(() => {
      void this.run('interval')
    }, intervalMs)

    this.interval.unref?.()
    setTimeout(() => void this.run('startup'), 10_000).unref?.()
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }

  private async run(source: string) {
    if (this.isRunning) return

    this.isRunning = true

    try {
      const result = await this.billingService.runSubscriptionMaintenance(
        `billing-maintenance-${source}`,
      )

      if (result.canceled || result.pastDue || result.blocked) {
        this.logger.log(
          `Manutencao de assinaturas: ${result.canceled} canceladas, ${result.pastDue} em atraso, ${result.blocked} bloqueadas.`,
        )
      }
    } catch (error) {
      this.logger.error(
        'Erro ao executar manutencao de assinaturas.',
        error instanceof Error ? error.stack : undefined,
      )
    } finally {
      this.isRunning = false
    }
  }

  private getIntervalMs() {
    const configured = Number(
      this.configService.get<string>('BILLING_MAINTENANCE_INTERVAL_MS'),
    )

    if (Number.isFinite(configured) && configured >= 60_000) {
      return configured
    }

    return defaultMaintenanceIntervalMs
  }
}
