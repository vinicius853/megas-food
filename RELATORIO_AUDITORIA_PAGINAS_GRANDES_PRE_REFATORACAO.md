# Relatorio de auditoria - paginas grandes antes da refatoracao generica

Projeto: Megas Food  
Objetivo: identificar paginas, componentes, hooks e services que precisam ser organizados antes da refatoracao generica para `Products`, `ModifierGroups` e `ModifierOptions`.

Este relatorio nao propoe alterar banco, Prisma, backend ou arquitetura agora. A recomendacao e primeiro estabilizar UX/UI, separar responsabilidades e validar os fluxos atuais.

## Resumo executivo

O sistema esta funcional, mas alguns arquivos concentram responsabilidades demais. Antes de iniciar a arquitetura generica, os pontos mais importantes a organizar sao:

- Cardapio publico: renderizacao, filtros, status aberto/fechado, fluxo de pizza, carrinho e checkout estao muito acoplados.
- Dashboard do cardapio: `use-menu-management.ts` concentra estado, regra, payload, autosave e normalizacao.
- Painel Master: clientes e cobrancas estao grandes e misturam listagem, formularios, modais, acoes criticas e integracoes.
- Backend: `billing.service.ts` e `menu-management.service.ts` concentram muita regra operacional.

## Arquivos acima de 400 linhas

| Arquivo | Linhas | Modulo | O que faz hoje | Mistura responsabilidades? | Dividir antes da refatoracao? | Risco | Prioridade |
|---|---:|---|---|---|---|---|---|
| `apps/web/app/master/cobrancas/page.tsx` | 1600 | Master / Cobrancas | Lista faturas, assinaturas, eventos, diagnosticos, Mercado Pago, acoes criticas e modais. | Sim | Sim | Alto | Obrigatoria |
| `apps/web/app/master/clientes/page.tsx` | 1381 | Master / Clientes | Cadastro, edicao, detalhes, senha, plano, status e listagem de pizzarias. | Sim | Sim | Alto | Obrigatoria |
| `apps/web/components/public-menu/public-menu-client.tsx` | 1264 | Cardapio publico | Busca cardapio, monta secoes, categorias, status da loja, cards, carrinho e fluxo de pizza. | Sim | Sim | Alto | Obrigatoria |
| `apps/web/app/dashboard/cardapio/hooks/use-menu-management.ts` | 1050 | Dashboard / Cardapio | Estado do cardapio, normalizacao, precos, categorias, payload, autosave e API. | Sim | Sim | Critico | Obrigatoria |
| `apps/web/components/public-menu/checkout-modal.tsx` | 820 | Checkout publico | Cliente, endereco, pagamento, taxa, cupom, observacao, payload e envio. | Sim | Sim | Medio | Alta |
| `apps/web/components/public-menu/pizza-configurator-flow.tsx` | 817 | Fluxo da pizza | Tamanho, sabores, borda, adicionais, resumo, bebida e criacao do item no carrinho. | Sim | Sim | Alto | Obrigatoria |
| `apps/web/app/dashboard/entregas/page.tsx` | 720 | Entregas | Zonas, taxas, horarios, dados de entrega e resumo. | Parcial | Sim | Medio | Media |
| `apps/web/app/dashboard/pedidos/print-order.ts` | 621 | Impressao | Formata recibo termico e dados do pedido. | Parcial | Sim | Medio | Alta |
| `apps/web/app/master/usuarios/page.tsx` | 612 | Master / Usuarios | Lista usuarios, cria internos, roles/permissoes e acoes. | Sim | Sim | Medio | Media |
| `apps/web/components/public-menu/cart-drawer.tsx` | 601 | Carrinho publico | Lista itens, totais, cupom, checkout e edicao de itens. | Sim | Sim | Alto | Alta |
| `apps/web/app/master/planos/page.tsx` | 575 | Master / Planos | CRUD visual de planos, recursos e status. | Parcial | Sim | Medio | Alta |
| `apps/web/app/dashboard/personalizacao/page.tsx` | 536 | Personalizacao | Logo, capa, paleta, upload e preview do cardapio. | Parcial | Sim | Medio | Media |
| `apps/web/components/public-menu/inline-product-wizard.tsx` | 534 | Produto publico legado/alternativo | Configuracao inline de produto. | Sim | Avaliar uso | Medio | Media |
| `apps/web/app/dashboard/configuracoes/page.tsx` | 507 | Configuracoes pizzaria | Dados da pizzaria, horarios e assinatura. | Parcial | Sim | Medio | Media |
| `apps/web/app/dashboard/cardapio/cupons/page.tsx` | 500 | Cupons | CRUD de cupons no dashboard. | Parcial | Sim | Medio | Media |
| `apps/web/app/dashboard/page.tsx` | 473 | Dashboard pizzaria | Visao geral, cards e atalhos. | Pouco | Opcional | Baixo | Baixa |
| `apps/web/components/public-menu/product-modal.tsx` | 437 | Produto/modal legado | Modal de produto antigo. | Sim | Avaliar remocao futura | Medio | Media |
| `apps/api/src/modules/billing/billing.service.ts` | 1638 | Billing | Planos, assinaturas, faturas, Mercado Pago, webhooks, manutencao e auditoria. | Sim | Sim, mas com cuidado | Alto | Obrigatoria |
| `apps/api/src/modules/menu-management/menu-management.service.ts` | 457 | Menu management | Busca e salva cardapio operacional completo por tenant. | Sim | Sim | Alto | Obrigatoria |
| `apps/api/src/modules/orders/orders.service.ts` | 415 | Pedidos | Cria pedidos, calcula totais, busca e atualiza status. | Parcial | Sim | Medio | Alta |

## Cardapio publico

### Situacao atual

Arquivos principais:

- `apps/web/components/public-menu/public-menu-client.tsx`
- `apps/web/components/public-menu/pizza-configurator-flow.tsx`
- `apps/web/components/public-menu/cart-drawer.tsx`
- `apps/web/components/public-menu/checkout-modal.tsx`
- `apps/web/components/public-menu/cart-context.tsx`

O cardapio publico ja possui fluxo funcional, mas ainda esta concentrado. A pagina principal carrega dados, normaliza categorias, controla filtros, monta secoes, renderiza cards, controla status de funcionamento, abre configurador, mostra carrinho e integra checkout.

### Pontos positivos

- Cardapio continua visivel mesmo quando pedidos estao pausados.
- Checkout e carrinho ja usam estado real.
- Sugestao de bebida foi integrada ao fluxo.
- Tamanhos e precos ja foram ajustados para mobile.
- Observacoes do checkout foram melhoradas.

### Pontos de atencao

- Mapeamentos de dados estao dentro de `public-menu-client.tsx`.
- Regras de categoria e prioridade estao no componente visual.
- Regra de loja aberta/fechada esta no frontend da pagina.
- Fluxo da pizza ainda calcula preco e monta item diretamente.
- Carrinho e checkout ainda conhecem detalhes demais da pizza.

### Recomendacao antes da refatoracao generica

Separar:

- `PublicMenuHeader`
- `CategoryTabs`
- `MenuSection`
- `FlavorCard`
- `FixedProductCard`
- `ClosedStoreNotice`
- `usePublicMenu`
- `public-menu-mappers.ts`
- `opening-hours.ts`

## Dashboard da pizzaria

### Cardapio

Arquivo critico:

- `apps/web/app/dashboard/cardapio/hooks/use-menu-management.ts`

Esse hook e o maior risco para a refatoracao generica. Ele centraliza quase toda a regra do cardapio administrativo:

- categorias
- produtos
- pizzas
- tamanhos
- sabores
- precos
- bordas
- payload para API
- autosave
- normalizacao de dados

### Recomendacao

Antes de `ModifierGroups`, separar:

- `menu-management-api.ts`
- `menu-management-mappers.ts`
- `menu-management-payload.ts`
- `useMenuProducts`
- `useMenuCategories`
- `usePizzaPrices`
- `usePizzaSizes`
- `usePizzaBorders`

Manter o comportamento atual, apenas dividindo responsabilidades.

### Pedidos e impressao

Arquivos:

- `apps/web/app/dashboard/pedidos/print-order.ts`
- `apps/web/app/dashboard/pedidos/order-modal.tsx`
- `apps/web/app/dashboard/pedidos/orders-table.tsx`

`print-order.ts` deve ficar estavel antes da refatoracao generica, porque precisara imprimir modificadores no futuro. Hoje ainda depende do formato atual de pizza, sabores, borda e adicionais.

### Entregas e configuracoes

Arquivos:

- `apps/web/app/dashboard/entregas/page.tsx`
- `apps/web/app/dashboard/configuracoes/page.tsx`

Possuem responsabilidade media. Nao bloqueiam a refatoracao generica, mas podem ser organizados em componentes menores para reduzir risco visual.

## Painel Master

### Clientes

Arquivo:

- `apps/web/app/master/clientes/page.tsx`

Mistura:

- listagem
- cadastro
- edicao
- detalhes
- reset de senha
- alteracao de plano
- permissoes
- formatadores
- chamadas API

Recomendacao:

- `ClientTable`
- `CreateTenantModal`
- `EditTenantModal`
- `TenantDetailsModal`
- `ResetPasswordModal`
- `ChangePlanModal`
- `useMasterClients`
- `client-formatters.ts`

### Cobrancas

Arquivo:

- `apps/web/app/master/cobrancas/page.tsx`

E o maior arquivo do frontend. Mistura:

- invoices
- assinaturas
- Mercado Pago
- diagnosticos
- eventos
- CSV
- modais
- acoes criticas

Recomendacao:

- separar por blocos visuais
- extrair hooks de dados
- manter regras financeiras protegidas
- nao mexer na logica de Mercado Pago durante ajustes visuais

### Planos

Arquivo:

- `apps/web/app/master/planos/page.tsx`

Pode ser dividido depois de clientes/cobrancas. Tem risco menor, mas deve ser separado antes de ampliar planos no produto.

## Backend

### Billing

Arquivo:

- `apps/api/src/modules/billing/billing.service.ts`

Muito grande e sensivel. Concentra:

- planos
- assinaturas
- faturas
- Mercado Pago
- webhooks
- reprocessamento
- manutencao automatica
- auditoria

Recomendacao futura:

- `PlansService`
- `SubscriptionsService`
- `InvoicesService`
- `MercadoPagoBillingService`
- `BillingEventsService`
- `BillingDiagnosticsService`
- `BillingMaintenanceService`

Nao mexer agora se o foco for UX/UI do cardapio.

### Menu management

Arquivo:

- `apps/api/src/modules/menu-management/menu-management.service.ts`

Este e importante antes da refatoracao generica. Hoje salva a estrutura especifica de pizza/produto. Quando entrar `ModifierGroups`, esse service precisara ser preparado com cuidado.

## Ajustes apenas visuais

Podem ser feitos com baixo risco:

- Alinhamento de tamanhos no cardapio publico.
- Bordas e divisorias de cards.
- Textos de checkout.
- Visual do carrinho mobile.
- Visual do login.
- Responsividade de tabelas no dashboard.
- Separacao de cards e blocos no Master.
- Melhorias de labels e placeholders.

## Ajustes que mexem em regra de negocio

Exigem mais cuidado:

- Calculo de pizza inteira/meio a meio/ate 4 sabores.
- Borda e adicionais no item.
- Cupom e desconto.
- Taxa de entrega por bairro.
- Horario de funcionamento bloqueando pedidos.
- Checkout e criacao do pedido.
- Impressao do pedido.
- Assinatura, bloqueio e Mercado Pago.
- Alteracao de plano no Master.

## O que fazer antes da refatoracao generica

1. Congelar comportamento atual do cardapio publico.
2. Separar componentes visuais grandes.
3. Extrair mappers/helpers do cardapio publico.
4. Separar o fluxo de pizza em steps.
5. Separar checkout em subcomponentes.
6. Quebrar `use-menu-management.ts`.
7. Validar todos os fluxos atuais.

## O que deixar para depois da refatoracao generica

- Criar UI final baseada em `ModifierGroups`.
- Migrar pizza/borda/adicional para modificadores genericos.
- Reescrever calculo generico de modificadores.
- Adaptar payload de pedido para modificadores.
- Adaptar impressao para modificadores.
- Remover componentes legados como `product-modal.tsx`, se confirmados sem uso.

## Ordem segura de execucao

### Etapa 1 - Ajustes seguros de UX/UI

- Corrigir pequenos desalinhamentos.
- Melhorar textos.
- Melhorar responsividade.
- Ajustar cards, bordas, estados vazios e labels.
- Nao mexer em regras.

### Etapa 2 - Separacao de componentes grandes

- Dividir `public-menu-client.tsx`.
- Dividir `pizza-configurator-flow.tsx`.
- Dividir `checkout-modal.tsx`.
- Dividir `cart-drawer.tsx`.
- Dividir `master/clientes/page.tsx`.
- Dividir `master/cobrancas/page.tsx`.

### Etapa 3 - Separacao de hooks/services

- Criar `usePublicMenu`.
- Criar `usePizzaConfigurator`.
- Criar `useCheckout`.
- Quebrar `use-menu-management.ts`.
- Criar mappers e builders de payload.

### Etapa 4 - Validacao dos fluxos atuais

Testar:

- Pizza inteira.
- Meio a meio.
- Ate 3/4 sabores.
- Borda.
- Adicionais.
- Sugestao de bebida.
- Carrinho.
- Checkout entrega/retirada.
- Pix/cartao/dinheiro/troco.
- Impressao.
- Horario fechado.
- Taxa por bairro.
- Cupom.
- Master: cliente, plano, cobranca e assinatura.

### Etapa 5 - Inicio da refatoracao generica

- Introduzir leitura generica de modificadores.
- Adaptar configurador.
- Adaptar carrinho.
- Adaptar checkout.
- Adaptar pedido.
- Adaptar impressao.
- Migrar dashboard de cardapio.

## Prioridade recomendada

1. `apps/web/components/public-menu/public-menu-client.tsx`
2. `apps/web/components/public-menu/pizza-configurator-flow.tsx`
3. `apps/web/app/dashboard/cardapio/hooks/use-menu-management.ts`
4. `apps/web/components/public-menu/checkout-modal.tsx`
5. `apps/web/components/public-menu/cart-drawer.tsx`
6. `apps/api/src/modules/menu-management/menu-management.service.ts`
7. `apps/web/app/master/clientes/page.tsx`
8. `apps/web/app/master/cobrancas/page.tsx`

Essa sequencia protege o fluxo do cliente primeiro, depois organiza o painel que alimenta o cardapio, e so entao avanca para Master e backend mais sensivel.
