# Relatorio Etapa 7 - Master Cobrancas

## Arquivo analisado

`apps/web/app/master/cobrancas/page.tsx`

## Tamanho atual

O arquivo possui **1600 linhas**.

## Responsabilidades atuais

O arquivo concentra toda a tela de cobrancas do Painel Master:

- Tipos locais de tenant, fatura, assinatura, evento, diagnostico e formularios.
- Constantes de mensalidade, labels e variants de status.
- Formatadores de dinheiro, data, data/hora e mensagens de erro.
- Permissao financeira com `canViewFinancialData`.
- Carregamento de dados via API:
  - `/billing/invoices`
  - `/tenants`
  - `/billing/subscriptions`
  - `/billing/events`
  - `/billing/diagnostics`
- Filtros de faturas por busca e status.
- Filtros de assinaturas por busca e status.
- Filtro de eventos por origem.
- Derivacoes de estatisticas financeiras.
- Derivacao de tenants sem assinatura.
- Criacao de cobranca.
- Ativacao de assinatura.
- Geracao de link recorrente Mercado Pago.
- Copia e reenvio de link recorrente.
- Geracao de link Mercado Pago para fatura.
- Copia de link de pagamento.
- Registro de pagamento manual.
- Bloqueio, desbloqueio e cancelamento agendado de assinatura.
- Reprocessamento de webhooks.
- Exportacao CSV.
- Cards de metricas.
- Painel de diagnostico do billing.
- Filtros visuais.
- Tabela de faturas.
- Tabela de assinaturas.
- Historico de eventos.
- Modal de detalhes da assinatura.
- Modal de nova cobranca.
- Modal de pagamento manual.
- Modal de acao critica de assinatura.
- Componentes locais no fim do arquivo:
  - `BillingMetric`
  - `DiagnosticBox`
  - `DetailBox`

## Mistura de responsabilidades

O arquivo mistura responsabilidades que deveriam estar separadas:

- JSX de pagina, cards, tabelas, historico, diagnosticos e modais.
- Estado de UI com dados remotos de billing.
- Chamadas de API com renderizacao.
- Payloads financeiros com handlers de botoes.
- Integracao Mercado Pago com estado visual.
- Reprocessamento de webhook com lista de eventos.
- Filtros e derivacoes com estrutura da pagina.
- Permissao financeira com fallback visual restrito.
- Acoes administrativas criticas dentro do componente visual.

Essa mistura aumenta o risco ao ajustar responsividade, UX ou layout, porque qualquer mudanca visual fica perto de payloads financeiros e acoes sensiveis.

## Plano de divisao seguro

### 1. `cobrancas.types.ts`

Mover apenas tipos:

- `TenantUser`
- `Tenant`
- `BillingInvoice`
- `SubscriptionStatus`
- `BillingSubscription`
- `BillingEvent`
- `BillingDiagnostics`
- `CreateInvoiceForm`
- `ManualPaymentForm`
- `SubscriptionAction`
- `SubscriptionActionForm`

### 2. `cobrancas-formatters.ts`

Mover apenas constantes e helpers puros:

- `monthlyFee`
- `statusLabels`
- `statusVariant`
- `subscriptionStatusLabels`
- `subscriptionStatusVariant`
- `parseMoney`
- `formatMoney`
- `formatDate`
- `formatDateTime`
- `toDateInputValue`
- `getErrorMessage`
- `getSubscriptionActionSuccess`
- `getSubscriptionActionTitle`

### 3. `cobrancas-metrics.tsx`

Mover:

- `BillingMetric`

### 4. `cobrancas-diagnostics-panel.tsx`

Mover:

- Card "Saude do billing"
- `DiagnosticBox`

Receber `diagnostics` e formatadores por props.

### 5. `cobrancas-filters.tsx`

Mover:

- Busca
- Select de status de fatura
- Select de status de assinatura

Receber valores e callbacks por props.

### 6. `cobrancas-invoices-table.tsx`

Mover apenas JSX da tabela de faturas.

Receber por props:

- `filteredInvoices`
- `isLoading`
- `isSaving`
- `onCopyPaymentLink`
- `onCreateMercadoPagoPreference`
- `onOpenManualPayment`

Nao mover handlers nem payloads.

### 7. `cobrancas-subscriptions-table.tsx`

Mover apenas JSX da tabela de assinaturas.

Receber por props:

- `filteredSubscriptions`
- `isLoading`
- `isSaving`
- `tenantsWithoutSubscription`
- `onActivateSubscription`
- `onOpenDetails`
- `onCopySubscriptionLink`
- `onResendSubscriptionLink`
- `onCreateMercadoPagoSubscriptionLink`
- `onOpenSubscriptionAction`

Nao mover handlers nem endpoints.

### 8. `cobrancas-events-panel.tsx`

Mover apenas painel visual de historico.

Receber por props:

- `filteredEvents`
- `eventSourceFilter`
- `isLoading`
- `isSaving`
- `onEventSourceFilterChange`
- `onRefresh`
- `onReprocessWebhook`

Nao mover reprocessamento.

### 9. Modais visuais

Extrair em etapas separadas:

- `cobranca-details-modal.tsx`
- `cobranca-create-modal.tsx`
- `cobranca-manual-payment-modal.tsx`
- `cobranca-subscription-action-modal.tsx`

Sempre mantendo estado, handlers e payloads no `page.tsx`.

### 10. Hook/API service

Somente depois das extracoes visuais e validacao manual:

- `use-master-cobrancas.ts`
- `cobrancas-api.ts`

Essa etapa tem maior risco e deve ser feita por ultimo.

## Ordem de execucao recomendada

Do menor risco para o maior risco:

1. Tipos.
2. Formatadores e constantes puras.
3. Componentes pequenos (`BillingMetric`, `DiagnosticBox`, `DetailBox`).
4. Painel de diagnosticos.
5. Filtros.
6. Tabela de faturas.
7. Tabela de assinaturas.
8. Painel de eventos.
9. Modal de detalhes.
10. Modal de nova cobranca.
11. Modal de pagamento manual.
12. Modal de acao critica de assinatura.
13. Hook/API service.

## Estimativa de reducao

- Tipos e formatadores: 180 a 230 linhas.
- Componentes pequenos: 70 a 90 linhas.
- Diagnosticos: 80 a 110 linhas.
- Filtros: 50 a 70 linhas.
- Tabela de faturas: 150 a 190 linhas.
- Tabela de assinaturas: 230 a 280 linhas.
- Eventos: 120 a 160 linhas.
- Modal detalhes: 180 a 230 linhas.
- Modal nova cobranca: 80 a 100 linhas.
- Modal pagamento manual: 80 a 100 linhas.
- Modal acao assinatura: 130 a 170 linhas.

Para deixar o arquivo abaixo de 800 linhas, provavelmente basta executar:

1. Tipos e formatadores.
2. Componentes pequenos.
3. Diagnosticos.
4. Filtros.
5. Tabela de faturas.
6. Tabela de assinaturas.

Tamanho final estimado apos essas etapas: **650 a 800 linhas**.

Com todos os modais extraidos, tamanho final estimado: **350 a 500 linhas**.

## Vale a pena dividir?

**SIM.**

O arquivo tem 1600 linhas e mistura billing, Mercado Pago, diagnosticos, eventos, payloads, modais e layout. Separar em etapas reduz o risco de regressao e permite ajustar responsividade e UX sem encostar em endpoints financeiros ou regras criticas.

## O que nao deve ser extraido agora

Evitar nas primeiras etapas:

- `createMercadoPagoSubscriptionLink`
- `createMercadoPagoPreference`
- `submitSubscriptionAction`
- `markManualPayment`
- `reprocessWebhook`
- `activateSubscription`
- Payloads de bloqueio/desbloqueio/cancelamento.
- Payload de pagamento manual.
- Endpoints financeiros.
- Regras de Mercado Pago.
- Regras de webhooks.
- Hook completo.
- Service de API.

Essas partes devem ficar no `page.tsx` ate as extracoes visuais estarem validadas.

## Testes obrigatorios apos refatoracao

1. Abrir `/master/cobrancas`.
2. Validar permissao financeira.
3. Confirmar cards de metricas.
4. Confirmar painel de diagnostico.
5. Buscar por cliente, slug e email.
6. Filtrar faturas por status.
7. Filtrar assinaturas por status.
8. Listar faturas.
9. Gerar link Mercado Pago de fatura.
10. Copiar link de pagamento.
11. Abrir link Mercado Pago.
12. Registrar pagamento manual.
13. Criar nova cobranca.
14. Exportar CSV.
15. Listar assinaturas.
16. Ativar assinatura para cliente sem assinatura.
17. Gerar link recorrente Mercado Pago.
18. Copiar link recorrente.
19. Reenviar link recorrente.
20. Abrir detalhes da assinatura.
21. Bloquear assinatura.
22. Desbloquear assinatura.
23. Solicitar cancelamento agendado.
24. Reativar assinatura cancelada.
25. Filtrar eventos por auditoria/webhook.
26. Reprocessar webhook pendente ou com erro.
27. Confirmar mensagens de sucesso e erro.
28. Confirmar que nenhum payload ou endpoint mudou.

## Conclusao

A divisao e recomendada, mas deve ser feita em subetapas conservadoras. A primeira etapa segura deve mover apenas tipos, constantes e helpers puros. Depois disso, os componentes visuais podem ser extraidos, sempre recebendo handlers e dados por props.
