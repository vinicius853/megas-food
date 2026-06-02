import { RadioTower } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DiagnosticBox } from './cobrancas-diagnostic-box'
import { formatDateTime } from './cobrancas-formatters'
import type { BillingDiagnostics } from './cobrancas.types'

type CobrancasDiagnosticsPanelProps = {
  diagnostics: BillingDiagnostics
}

export function CobrancasDiagnosticsPanel({ diagnostics }: CobrancasDiagnosticsPanelProps) {
  return (
    <Card className="mb-5">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <RadioTower className="h-5 w-5 text-orange-600" />
            Saude do billing
          </CardTitle>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Monitoramento rapido de webhooks, assinaturas em risco e proximas renovacoes.
          </p>
        </div>
        <Badge
          variant={
            diagnostics.status === 'CRITICAL'
              ? 'danger'
              : diagnostics.status === 'WARNING'
                ? 'warning'
                : 'success'
          }
        >
          {diagnostics.status === 'CRITICAL'
            ? 'Atencao critica'
            : diagnostics.status === 'WARNING'
              ? 'Requer atencao'
              : 'Operacional'}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-4">
        <DiagnosticBox
          label="Webhooks pendentes"
          value={`${diagnostics.pendingWebhooks}`}
          tone={diagnostics.oldPendingWebhooks > 0 ? 'danger' : diagnostics.pendingWebhooks > 0 ? 'warning' : 'success'}
          helper={
            diagnostics.oldPendingWebhooks > 0
              ? `${diagnostics.oldPendingWebhooks} ha mais de 15 min`
              : 'Fila dentro do esperado'
          }
        />
        <DiagnosticBox
          label="Falhas 24h"
          value={`${diagnostics.failedWebhooks24h}`}
          tone={diagnostics.failedWebhooks24h > 0 ? 'danger' : 'success'}
          helper={
            diagnostics.latestWebhookError?.error
              ? diagnostics.latestWebhookError.error
              : 'Sem erro recente'
          }
        />
        <DiagnosticBox
          label="Assinaturas em risco"
          value={`${diagnostics.pastDueSubscriptions + diagnostics.blockedSubscriptions}`}
          tone={diagnostics.blockedSubscriptions > 0 ? 'danger' : diagnostics.pastDueSubscriptions > 0 ? 'warning' : 'success'}
          helper={`${diagnostics.pastDueSubscriptions} em atraso | ${diagnostics.blockedSubscriptions} bloqueadas`}
        />
        <DiagnosticBox
          label="Vencem em 7 dias"
          value={`${diagnostics.upcomingRenewals}`}
          tone="default"
          helper={`Atualizado em ${formatDateTime(diagnostics.checkedAt)}`}
        />
      </CardContent>
    </Card>
  )
}
