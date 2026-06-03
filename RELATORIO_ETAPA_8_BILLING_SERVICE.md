# Relatorio tecnico - Etapa 8 - Billing Service

## Arquivo analisado

`apps/api/src/modules/billing/billing.service.ts`

## Objetivo do relatorio

Mapear responsabilidades e propor uma divisao segura para reduzir o arquivo `billing.service.ts`, que atualmente concentra grande parte das regras de cobranca, assinatura, Mercado Pago e webhooks do SaaS Megas Food.

Este relatorio e apenas tecnico. Nenhuma alteracao de codigo foi aplicada nesta analise.

## Tamanho atual

O arquivo possui aproximadamente **1638 linhas**.

## Responsabilidades atuais

O `BillingService` concentra hoje as seguintes responsabilidades:

- Listagem de faturas/cobrancas.
- Listagem, criacao, consulta e edicao de planos.
- Garantia/criacao do plano padrao Megas Food.
- Listagem de assinaturas.
- Manutencao de status de assinaturas.
- Listagem de eventos de auditoria e webhooks.
- Diagnosticos operacionais do billing.
- Reprocessamento de webhooks.
- Consulta da assinatura do tenant logado.
- Ativacao de assinatura.
- Alteracao de plano contratado.
- Agendamento de cancelamento.
- Bloqueio de assinatura.
- Desbloqueio de assinatura.
- Criacao de link recorrente Mercado Pago.
- Criacao de fatura.
- Criacao de link de pagamento avulso Mercado Pago.
- Registro de pagamento manual.
- Recebimento de webhook Mercado Pago.
- Processamento interno do webhook Mercado Pago.
- Marcacao de webhook como processado.
- Busca interna de fatura.
- Busca interna de assinatura.
- Conversao/normalizacao de valores monetarios.
- Normalizacao de slug.
- Normalizacao de strings vazias.
- Limpeza de listas de strings.
- Atualizacao de faturas vencidas.
- Atualizacao de assinaturas vencidas, canceladas ou bloqueadas.
- Datas padrao de vencimento.
- Validacao de permissao financeira.
- Validacao de senha para acoes criticas.
- Extracao de dados do payload/header do webhook.
- Mapeamento de status do Mercado Pago para status interno.
- Criacao de logs de auditoria para acoes financeiras.

## Metodos principais identificados

- `listInvoices`
- `listPlans`
- `getPlan`
- `createPlan`
- `updatePlan`
- `listSubscriptions`
- `runSubscriptionMaintenance`
- `listEvents`
- `getDiagnostics`
- `reprocessWebhook`
- `getMySubscription`
- `activateSubscription`
- `changeTenantPlan`
- `scheduleSubscriptionCancellation`
- `blockSubscription`
- `unblockSubscription`
- `createMercadoPagoSubscriptionLink`
- `createInvoice`
- `createMercadoPagoPreference`
- `markManualPayment`
- `handleMercadoPagoWebhook`
- `processMercadoPagoWebhookLog`
- `markWebhookProcessed`
- `getInvoice`
- `getSubscription`
- `ensureDefaultPlan`
- `toMoneyNumber`
- `normalizeSlug`
- `emptyToNull`
- `cleanStringList`
- `refreshOverdueInvoices`
- `refreshSubscriptionStatuses`
- `defaultDueDate`
- `defaultSubscriptionDueDate`
- `assertFinancialAccess`
- `verifyCriticalAction`
- `extractDataId`
- `headerToString`
- `getHeader`
- `isPreapprovalEvent`
- `mapMercadoPagoSubscriptionStatus`

## Mistura de responsabilidades

### Mercado Pago

As regras de integracao Mercado Pago estao misturadas com regras internas de fatura, assinatura, auditoria e status nos metodos:

- `createMercadoPagoSubscriptionLink`
- `createMercadoPagoPreference`
- `handleMercadoPagoWebhook`
- `processMercadoPagoWebhookLog`
- `reprocessWebhook`
- `mapMercadoPagoSubscriptionStatus`
- `isPreapprovalEvent`
- `extractDataId`
- `getHeader`
- `headerToString`

Risco: alto a critico, pois envolve pagamento, assinatura recorrente e processamento de webhook.

### Assinaturas

Regras de assinatura estao distribuidas em:

- `listSubscriptions`
- `getMySubscription`
- `activateSubscription`
- `changeTenantPlan`
- `scheduleSubscriptionCancellation`
- `blockSubscription`
- `unblockSubscription`
- `createMercadoPagoSubscriptionLink`
- `refreshSubscriptionStatuses`

Risco: alto, pois envolve acesso do tenant, status financeiro, cancelamento, bloqueio e datas de validade.

### Faturas e cobrancas

Regras de faturas/cobrancas estao distribuidas em:

- `listInvoices`
- `createInvoice`
- `createMercadoPagoPreference`
- `markManualPayment`
- `refreshOverdueInvoices`
- `getInvoice`

Risco: alto, pois envolve status de cobranca, pagamento manual, Mercado Pago e valores.

### Webhooks

O processamento de webhooks mistura:

- validacao de assinatura do Mercado Pago;
- upsert do log de webhook;
- leitura remota do Mercado Pago;
- atualizacao de assinatura;
- atualizacao de fatura;
- auditoria;
- marcacao de sucesso ou erro.

Metodos principais:

- `handleMercadoPagoWebhook`
- `processMercadoPagoWebhookLog`
- `markWebhookProcessed`
- `reprocessWebhook`

Risco: critico.

### Diagnosticos

`getDiagnostics` concentra contagens e classificacao da saude do billing:

- webhooks pendentes;
- webhooks antigos pendentes;
- webhooks com erro nas ultimas 24h;
- ultimo erro de webhook;
- assinaturas em atraso;
- assinaturas bloqueadas;
- renovacoes proximas;
- status geral `OK`, `WARNING` ou `CRITICAL`.

Risco: medio. Pode ser extraido depois de helpers, mas antes de Mercado Pago/webhooks.

### Helpers

Helpers puros estao misturados dentro do service:

- `toMoneyNumber`
- `normalizeSlug`
- `emptyToNull`
- `cleanStringList`
- `defaultDueDate`
- `defaultSubscriptionDueDate`
- `extractDataId`
- `headerToString`
- `getHeader`
- `isPreapprovalEvent`
- `mapMercadoPagoSubscriptionStatus`

Risco: baixo a medio. Sao os melhores candidatos para primeira etapa de extracao.

## Plano de divisao seguro

### 1. `billing.constants.ts`

Mover apenas constantes:

- `monthlyFee`
- `defaultPlanSlug`
- `defaultGracePeriodDays`

Risco: baixo.

### 2. `billing.types.ts`

Mover tipos internos:

- `Actor`
- outros tipos auxiliares futuros, se necessario.

Risco: baixo.

### 3. `billing.helpers.ts`

Mover helpers puros gerais:

- `toMoneyNumber`
- `normalizeSlug`
- `emptyToNull`
- `cleanStringList`
- `defaultDueDate`
- `defaultSubscriptionDueDate`

Risco: baixo a medio.

### 4. `billing-webhook.helpers.ts`

Mover helpers puros de webhook:

- `extractDataId`
- `headerToString`
- `getHeader`
- `isPreapprovalEvent`
- `mapMercadoPagoSubscriptionStatus`

Risco: medio.

### 5. `billing-diagnostics.service.ts`

Extrair:

- `getDiagnostics`

Risco: medio.

### 6. `billing-plans.service.ts`

Extrair:

- `listPlans`
- `getPlan`
- `createPlan`
- `updatePlan`
- `ensureDefaultPlan`

Observacao: `ensureDefaultPlan` e usado por faturas e assinaturas, entao deve ser tratado com cuidado.

Risco: medio.

### 7. `billing-invoices.service.ts`

Extrair:

- `listInvoices`
- `createInvoice`
- `createMercadoPagoPreference`
- `markManualPayment`
- `refreshOverdueInvoices`
- `getInvoice`

Risco: alto.

### 8. `billing-subscriptions.service.ts`

Extrair:

- `listSubscriptions`
- `getMySubscription`
- `activateSubscription`
- `changeTenantPlan`
- `scheduleSubscriptionCancellation`
- `blockSubscription`
- `unblockSubscription`
- `refreshSubscriptionStatuses`

Risco: alto.

### 9. `billing-webhooks.service.ts`

Extrair:

- `handleMercadoPagoWebhook`
- `processMercadoPagoWebhookLog`
- `markWebhookProcessed`
- `reprocessWebhook`

Risco: critico.

## Ordem de execucao recomendada

Do menor risco para o maior:

1. Extrair constantes.
2. Extrair tipos.
3. Extrair helpers puros gerais.
4. Extrair helpers puros de webhook.
5. Extrair diagnosticos.
6. Extrair planos.
7. Extrair faturas/cobrancas.
8. Extrair assinaturas.
9. Extrair webhooks Mercado Pago.

## Estimativa de reducao por etapa

- Constantes e tipos: 10 a 20 linhas.
- Helpers gerais: 50 a 80 linhas.
- Helpers de webhook: 50 a 80 linhas.
- Diagnosticos: 90 a 120 linhas.
- Planos: 220 a 280 linhas.
- Faturas/cobrancas: 250 a 330 linhas.
- Assinaturas: 450 a 550 linhas.
- Webhooks: 250 a 350 linhas.

## Tamanho final estimado

Com uma divisao completa e segura, o `billing.service.ts` pode cair de aproximadamente **1638 linhas** para algo entre **250 e 500 linhas**, ficando como orquestrador ou podendo ser substituido por services menores.

Em uma primeira fase conservadora, movendo apenas constantes, tipos e helpers puros, o arquivo deve cair pouco, ficando provavelmente entre **1450 e 1550 linhas**, mas com risco baixo.

## Vale a pena dividir?

Sim.

O arquivo concentra areas muito sensiveis e diferentes:

- planos;
- assinaturas;
- cobrancas;
- pagamentos;
- Mercado Pago;
- webhooks;
- bloqueio de cliente;
- auditoria;
- diagnosticos.

A divisao melhora manutencao, clareza e testabilidade. Mas deve ser feita em etapas pequenas, porque o risco operacional e maior que nas refatoracoes frontend.

## O que nao deve ser extraido agora

Nao iniciar por:

- `handleMercadoPagoWebhook`
- `processMercadoPagoWebhookLog`
- `refreshSubscriptionStatuses`
- `activateSubscription`
- `changeTenantPlan`
- `scheduleSubscriptionCancellation`
- `blockSubscription`
- `unblockSubscription`
- `createMercadoPagoSubscriptionLink`
- `createMercadoPagoPreference`
- `markManualPayment`
- `verifyCriticalAction`

Essas areas envolvem dinheiro, acesso, senha de operador, Mercado Pago, webhooks ou status criticos.

## Testes obrigatorios por etapa

### Apos constantes/tipos/helpers

- Build do backend.
- Testes existentes do modulo billing, se houver.
- Listar planos.
- Listar cobrancas.
- Listar assinaturas.
- Verificar que os endpoints continuam respondendo.

### Apos diagnosticos

- `GET /billing/diagnostics`.
- Webhook pendente.
- Webhook com erro.
- Assinatura em atraso.
- Assinatura bloqueada.
- Renovacao proxima.
- Status `OK`, `WARNING` e `CRITICAL`.

### Apos planos

- Criar plano.
- Editar plano.
- Listar planos.
- Buscar plano por id.
- Confirmar que alterar plano nao altera assinatura existente.
- Confirmar audit log.

### Apos faturas/cobrancas

- Criar cobranca.
- Listar cobrancas.
- Gerar link Mercado Pago.
- Registrar pagamento manual.
- Atualizar fatura vencida para overdue.
- Confirmar audit log.
- Confirmar valores.

### Apos assinaturas

- Ativar assinatura.
- Alterar plano.
- Confirmar valor contratado preservado.
- Agendar cancelamento.
- Bloquear assinatura.
- Desbloquear assinatura.
- Reativar assinatura.
- Confirmar `accessUntil`.
- Confirmar regra de tolerancia de 5 dias.
- Confirmar audit log.

### Apos webhooks

- Webhook de pagamento aprovado.
- Webhook de pagamento recusado.
- Webhook de assinatura ativa.
- Webhook de assinatura cancelada.
- Webhook duplicado.
- Webhook com erro.
- Reprocessamento de webhook pendente.
- Reprocessamento de webhook com erro.
- Confirmar `PaymentWebhookLog`.
- Confirmar audit logs.
- Confirmar que webhook sem vinculo interno nao passa silenciosamente.

## Proxima etapa recomendada

Executar uma primeira etapa pequena:

- Criar `billing.constants.ts`.
- Criar `billing.types.ts`.
- Criar `billing.helpers.ts`.
- Mover apenas constantes, `Actor` e helpers puros gerais.

Nao mexer ainda em:

- Mercado Pago;
- webhooks;
- assinaturas;
- faturas;
- payloads;
- endpoints;
- bloqueios;
- auditoria;
- manutencao automatica.

Essa e a menor mudanca segura para iniciar a organizacao do backend sem arriscar a operacao financeira do SaaS.
