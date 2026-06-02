import { Copy, ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { RestrictedFinancialValue } from '../components/restricted-financial-value'
import type { BillingInvoice } from './cobrancas.types'

type CobrancasInvoicesTableProps = {
  filteredInvoices: BillingInvoice[]
  isLoading: boolean
  isSaving: boolean
  onCopyPaymentLink: (invoice: BillingInvoice) => void
  onCreateMercadoPagoPreference: (invoice: BillingInvoice) => void
  onOpenManualPayment: (invoice: BillingInvoice) => void
  formatMoney: (value: number) => string
  formatDate: (value?: string | null) => string
  parseMoney: (value: unknown) => number
  statusLabels: Record<BillingInvoice['status'], string>
  statusVariant: Record<BillingInvoice['status'], 'success' | 'warning' | 'danger' | 'default'>
}

export function CobrancasInvoicesTable({
  filteredInvoices,
  isLoading,
  isSaving,
  onCopyPaymentLink,
  onCreateMercadoPagoPreference,
  onOpenManualPayment,
  formatMoney,
  formatDate,
  parseMoney,
  statusLabels,
  statusVariant,
}: CobrancasInvoicesTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Mensalidade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Ultimo pagamento</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                Carregando cobrancas...
              </TableCell>
            </TableRow>
          ) : filteredInvoices.length ? (
            filteredInvoices.map((invoice) => {
              const paymentLink = invoice.paymentUrl || invoice.sandboxPaymentUrl

              return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <p className="font-black text-slate-900">{invoice.tenant.name}</p>
                    <p className="text-xs text-slate-500">{invoice.tenant.users?.[0]?.email || invoice.tenant.slug}</p>
                  </TableCell>
                  <TableCell>Unico Plano</TableCell>
                  <TableCell>
                    <RestrictedFinancialValue value={formatMoney(parseMoney(invoice.amount))} canView />
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[invoice.status]}>
                      {statusLabels[invoice.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.paidAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      {paymentLink ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => onCopyPaymentLink(invoice)}>
                            <Copy className="h-4 w-4" />
                            Copiar
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <a href={paymentLink} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              Mercado Pago
                            </a>
                          </Button>
                        </>
                      ) : invoice.status !== 'PAID' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCreateMercadoPagoPreference(invoice)}
                          disabled={isSaving}
                        >
                          Gerar link
                        </Button>
                      ) : null}

                      {invoice.status !== 'PAID' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onOpenManualPayment(invoice)}
                        >
                          Pago manual
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                Nenhuma cobranca encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
