'use client'

import * as React from 'react'
import { RefreshCw } from 'lucide-react'

import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api'

type AuditLog = {
  id: string
  actorId?: string | null
  actorEmail?: string | null
  action: string
  target: string
  level: 'INFO' | 'WARNING' | 'CRITICAL'
  createdAt: string
}

const levelLabels: Record<AuditLog['level'], string> = {
  INFO: 'Info',
  WARNING: 'Aviso',
  CRITICAL: 'Critico',
}

const levelVariants: Record<AuditLog['level'], 'info' | 'warning' | 'danger'> = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'danger',
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Nao foi possivel carregar a auditoria.'
  }

  try {
    const parsed = JSON.parse(error.message)
    return Array.isArray(parsed.message)
      ? parsed.message.join(', ')
      : parsed.message || error.message
  } catch {
    return error.message
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function AuditoriaPage() {
  const [logs, setLogs] = React.useState<AuditLog[]>([])
  const [query, setQuery] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  const loadLogs = React.useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await apiFetch<AuditLog[]>('/audit-logs')
      setLogs(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const filteredLogs = logs.filter((log) => {
    const search = query.trim().toLowerCase()

    if (!search) {
      return true
    }

    return [
      log.actorEmail,
      log.action,
      log.target,
      levelLabels[log.level],
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })

  return (
    <PageContainer>
      <PageHeader
        title="Auditoria"
        description="Historico de acoes realizadas na plataforma."
        actions={
          <Button variant="outline" size="sm" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por usuario, acao ou alvo..."
          className="sm:max-w-sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acao</TableHead>
              <TableHead>Alvo</TableHead>
              <TableHead>Nivel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  Carregando auditoria...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length ? (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-slate-500">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {log.actorEmail || 'Sistema'}
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="text-slate-500">{log.target}</TableCell>
                  <TableCell>
                    <Badge variant={levelVariants[log.level]}>
                      {levelLabels[log.level]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  Nenhum evento de auditoria encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </PageContainer>
  )
}
