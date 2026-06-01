# Checklist de teste - Assinatura Mercado Pago

Este checklist valida o fluxo recorrente do SaaS Megas Food antes de usar cobranca real com clientes.

## Objetivo

Confirmar que:

- o Master gera link recorrente de assinatura;
- o cliente consegue assinar pelo Mercado Pago;
- o webhook chega na API;
- a assinatura muda de status automaticamente;
- a tela Master > Cobrancas mostra saude do billing;
- atraso, cancelamento e bloqueio seguem as regras do SaaS.

## Variaveis obrigatorias no backend

Configure somente em `apps/api/.env` ou no provedor de deploy da API.
Nunca exponha esses valores no frontend.

```env
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-..."
MERCADO_PAGO_WEBHOOK_SECRET="..."
MERCADO_PAGO_NOTIFICATION_URL="https://sua-api.com/billing/mercado-pago/webhook"
MERCADO_PAGO_SUBSCRIPTION_RETURN_URL="https://seu-site.com/master/cobrancas"
MERCADO_PAGO_WEBHOOK_TOLERANCE_SECONDS="900"
BILLING_MAINTENANCE_INTERVAL_MS="900000"
```

Variaveis opcionais usadas em cobrancas avulsas:

```env
MERCADO_PAGO_SUCCESS_URL="https://seu-site.com/master/cobrancas"
MERCADO_PAGO_FAILURE_URL="https://seu-site.com/master/cobrancas"
MERCADO_PAGO_PENDING_URL="https://seu-site.com/master/cobrancas"
```

## Pre-condicoes

- API rodando em ambiente acessivel pelo Mercado Pago.
- `MERCADO_PAGO_NOTIFICATION_URL` deve ser HTTPS publico.
- Banco com pelo menos um cliente/pizzaria cadastrado.
- Usuario Master com permissao financeira.
- Plano padrao criado pelo sistema: `Plano Megas Food`, R$ 150,00 por mes.

## Teste 1 - Gerar assinatura recorrente

1. Acesse o painel Master.
2. Abra `Cobrancas`.
3. Na tabela `Assinaturas dos clientes`, escolha um cliente ativo.
4. Clique em `Link recorrente`.
5. Resultado esperado:
   - sistema mostra mensagem de sucesso;
   - linha passa a exibir botoes `Copiar`, `Reenviar` e `Assinar`;
   - assinatura fica com status `Pendente`;
   - historico registra evento de geracao de assinatura Mercado Pago.

## Teste 2 - Abrir link e assinar

1. Clique em `Assinar` ou copie o link recorrente.
2. Complete o fluxo no Mercado Pago.
3. Resultado esperado no painel:
   - webhook deve aparecer em `Historico de cobrancas`;
   - `Saude do billing` deve ficar `Operacional` ou sem falhas novas;
   - assinatura deve evoluir para `Ativa` quando o Mercado Pago confirmar.

## Teste 3 - Validar webhook

1. No Mercado Pago, confirme que a URL de webhook esta cadastrada.
2. Envie um evento de teste ou execute uma acao real de sandbox.
3. Resultado esperado:
   - endpoint `/billing/mercado-pago/webhook` responde sem erro;
   - `payment_webhook_logs` recebe o evento;
   - eventos validos ficam `processed = true`;
   - eventos invalidos ficam com erro visivel em `Historico de cobrancas`;
   - `Saude do billing` mostra falhas quando houver erro nas ultimas 24h.

## Teste 4 - Pagamento recusado ou atraso

1. Simule uma assinatura sem pagamento confirmado ou com vencimento passado.
2. Aguarde a rotina de billing ou atualize a tela de cobrancas.
3. Resultado esperado:
   - assinatura vencida muda para `Em atraso`;
   - cliente continua ativo durante 5 dias de tolerancia;
   - apos `gracePeriodDays`, assinatura muda para `Bloqueada`;
   - dashboard do cliente bloqueado nao deve abrir;
   - cardapio publico nao deve aceitar pedidos.

## Teste 5 - Cancelamento solicitado

1. No Master, clique em `Cancelar` na assinatura.
2. Informe motivo, data de acesso ate e senha do operador.
3. Resultado esperado:
   - status fica `Cancelamento agendado`;
   - cliente continua usando ate `accessUntil`;
   - renovacao recorrente e cancelada no Mercado Pago quando houver vinculacao;
   - ao passar `accessUntil`, rotina muda status para `Cancelada`.

## Teste 6 - Reativacao

1. Em uma assinatura cancelada, clique em `Reativar`.
2. Gere novo link recorrente se necessario.
3. Resultado esperado:
   - assinatura volta para `Ativa` ou `Pendente`;
   - cliente volta a acessar conforme status;
   - auditoria registra a reativacao.

## Sinais de problema

Verifique imediatamente se:

- `Saude do billing` mostrar `Atencao critica`;
- houver webhooks pendentes ha mais de 15 minutos;
- houver falhas de webhook nas ultimas 24h;
- assinatura paga nao virar `Ativa`;
- cliente bloqueado ainda conseguir enviar pedido;
- cliente ativo nao conseguir abrir dashboard.

## Comandos uteis

```bash
npm --workspace apps/api run test -- mercado-pago.service.spec.ts --runInBand
npm --workspace apps/api run build
npm --workspace apps/web run build
```

## Observacoes de seguranca

- O frontend apenas mostra estados. A validacao real do Mercado Pago fica no backend.
- Nunca coloque `MERCADO_PAGO_ACCESS_TOKEN` ou `MERCADO_PAGO_WEBHOOK_SECRET` em `apps/web`.
- O segredo do webhook deve ser diferente em sandbox e producao.
- Em producao, ausencia de `MERCADO_PAGO_WEBHOOK_SECRET` deve bloquear o webhook.
