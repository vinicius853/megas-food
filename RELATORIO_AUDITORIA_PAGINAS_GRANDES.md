# Relatorio de auditoria - paginas grandes e preparacao para refatoracao generica

Data: 31/05/2026

Projeto: Megas Food

Objetivo: mapear paginas, componentes, hooks e services grandes antes da refatoracao generica para `Products`, `ModifierGroups` e `ModifierOptions`, sem alterar codigo, banco, backend ou regras atuais.

## Escopo analisado

- Cardapio publico
- Carrinho e checkout
- Dashboard da pizzaria
- Cardapio administrativo
- Entregas
- Personalizacao
- Pedidos e impressao
- Painel Master
- Billing, planos, assinaturas e cobrancas

## Resumo executivo

O projeto esta funcional, mas algumas telas cresceram bastante e hoje concentram layout, estado, chamadas de API, transformacao de dados e regras de negocio no mesmo arquivo.

Antes de iniciar a refatoracao generica de produtos e modificadores, o caminho mais seguro e organizar as areas mais sensiveis em etapas:

1. Ajustes seguros de UX/UI.
2. Separacao de componentes grandes.
3. Separacao de hooks, services e helpers.
4. Validacao dos fluxos atuais.
5. Inicio da refatoracao generica.

As areas mais criticas sao:

- Cardapio publico.
- Fluxo de pizza/configuracao.
- Carrinho e checkout.
- Hook de gerenciamento do cardapio.
- Billing no backend.
- Clientes e cobrancas no Painel Master.

## Arquivos acima de 400 linhas

### Frontend

| Arquivo | Linhas | Modulo | O que faz hoje | Mistura responsabilidades | Dividir antes da refatoracao | Risco de mexer agora | Prioridade |
|---|---:|---|---|---|---|---|---|
| `apps/web/app/master/cobrancas/page.tsx` | 1600 | Master / Cobrancas | Tela grande de cobrancas, assinaturas, eventos, diagnostico e acoes administrativas | Sim. Layout, estado, chamadas, filtros e acoes no mesmo arquivo | Sim | Alto | Alta |
| `apps/web/app/master/clientes/page.tsx` | 1381 | Master / Clientes | Lista clientes, cadastro de pizzaria, detalhes, reset de senha, plano e assinatura | Sim. CRUD, modais, tipos, estado e chamadas misturados | Sim | Alto | Alta |
| `apps/web/components/public-menu/public-menu-client.tsx` | 1264 | Cardapio publico | Renderiza menu publico, categorias, busca, carrinho, checkout, sugestoes e estado principal | Sim. E o centro do fluxo do cliente | Sim | Critico | Obrigatoria |
| `apps/web/app/dashboard/cardapio/hooks/use-menu-management.ts` | 1050 | Dashboard / Cardapio | Centraliza estado e persistencia de sabores, tamanhos, bordas, bebidas, adicionais, cupons e categorias | Sim. Hook virou service, mapper e estado global da tela | Sim | Alto | Obrigatoria |
| `apps/web/components/public-menu/checkout-modal.tsx` | 820 | Checkout publico | Modal de finalizacao, endereco, pagamento, observacoes, total e envio | Sim. Layout, validacao visual, calculos e chamada de pedido | Sim | Alto | Alta |
| `apps/web/components/public-menu/pizza-configurator-flow.tsx` | 817 | Configurador de pizza | Fluxo de tamanho, meio a meio, borda, adicionais, bebida e resumo | Sim. Regras de pizza e UI no mesmo arquivo | Sim | Critico | Obrigatoria |
| `apps/web/app/dashboard/entregas/page.tsx` | 720 | Dashboard / Entregas | Configura bairros, taxas, horarios, status de entrega e informacoes da loja | Sim. Estado, UI, compatibilidade de horarios e save juntos | Sim | Medio | Media |
| `apps/web/app/dashboard/pedidos/print-order.ts` | 621 | Pedidos / Impressao | Gera comprovante termico de pedido | Parcial. Formatacao e regra de exibicao misturadas | Sim | Medio | Media |
| `apps/web/app/master/usuarios/page.tsx` | 612 | Master / Usuarios | Usuarios internos, permissoes e acoes administrativas | Sim. Permissoes e UI juntos | Sim | Medio | Media |
| `apps/web/components/public-menu/cart-drawer.tsx` | 601 | Carrinho publico | Exibe carrinho, itens, cupom, subtotal e acao de checkout | Sim. Renderizacao e manipulacao de item no mesmo arquivo | Sim | Alto | Alta |
| `apps/web/app/master/planos/page.tsx` | 575 | Master / Planos | CRUD visual de planos | Parcial | Sim | Medio | Media |
| `apps/web/app/dashboard/personalizacao/page.tsx` | 536 | Dashboard / Personalizacao | Logo, capa, paletas e previa do cardapio | Parcial | Sim | Medio | Media |
| `apps/web/components/public-menu/inline-product-wizard.tsx` | 534 | Cardapio publico | Wizard inline generico de produto | Sim, mas menor que o fluxo de pizza | Sim | Medio | Media |
| `apps/web/app/dashboard/configuracoes/page.tsx` | 507 | Dashboard / Configuracoes | Dados da pizzaria, horarios e salvar configuracoes | Parcial | Sim | Medio | Media |
| `apps/web/app/dashboard/cardapio/cupons/page.tsx` | 500 | Dashboard / Cupons | CRUD visual/local/backend de cupons | Parcial | Sim | Baixo | Media |
| `apps/web/app/dashboard/page.tsx` | 473 | Dashboard / Visao geral | Cards, atalhos, resumo operacional | Parcial | Opcional | Baixo | Baixa |
| `apps/web/components/public-menu/product-modal.tsx` | 437 | Cardapio publico legado | Modal antigo de produto | Sim e possivelmente legado | Avaliar remocao futura | Medio | Media |

### Backend

| Arquivo | Linhas | Modulo | O que faz hoje | Mistura responsabilidades | Dividir antes da refatoracao | Risco de mexer agora | Prioridade |
|---|---:|---|---|---|---|---|---|
| `apps/api/src/modules/billing/billing.service.ts` | 1638 | Billing | Assinaturas, invoices, Mercado Pago, webhooks, manutencao e reprocessamento | Sim. Muito concentrado | Sim | Critico | Alta |
| `apps/api/src/modules/menu-management/menu-management.service.ts` | 457 | Menu management | Salva e retorna estrutura operacional do cardapio | Parcial. Ja e ponto central da futura refatoracao | Sim | Alto | Obrigatoria |
| `apps/api/src/modules/orders/orders.service.ts` | 415 | Pedidos | Cria e lista pedidos, valida itens, totais e tenant | Parcial | Sim | Alto | Alta |

## 1. Quais arquivos estao grandes demais?

Os principais arquivos grandes demais sao:

- `apps/web/components/public-menu/public-menu-client.tsx`
- `apps/web/components/public-menu/pizza-configurator-flow.tsx`
- `apps/web/components/public-menu/checkout-modal.tsx`
- `apps/web/components/public-menu/cart-drawer.tsx`
- `apps/web/app/dashboard/cardapio/hooks/use-menu-management.ts`
- `apps/web/app/master/clientes/page.tsx`
- `apps/web/app/master/cobrancas/page.tsx`
- `apps/api/src/modules/billing/billing.service.ts`

Esses arquivos concentram muita responsabilidade e tendem a dificultar qualquer mudanca segura.

## 2. Quais paginas precisam ser organizadas antes da refatoracao?

Prioridade obrigatoria:

- Cardapio publico.
- Configurador de pizza.
- Carrinho.
- Checkout.
- Cardapio administrativo.
- `use-menu-management`.
- `menu-management.service`.

Prioridade alta:

- Pedidos.
- Impressao.
- Clientes no Master.
- Cobrancas no Master.
- Billing service.

Prioridade media:

- Entregas.
- Personalizacao.
- Configuracoes.
- Usuarios Master.
- Planos Master.

## 3. Quais ajustes sao apenas visuais?

Ajustes visuais seguros, sem alterar regra:

- Separacao visual dos cards do cardapio publico.
- Grid responsivo dos tamanhos no mobile.
- Alinhamento e largura dos inputs de preco no dashboard do cardapio.
- Melhor distribuicao de foto, categoria e descricao na tabela de sabores.
- Textos do checkout.
- Contraste, espaco, bordas e estados visuais.
- Responsividade de tabelas no Master e dashboard.
- Melhorias no recibo termico, desde que apenas formatacao.

Esses ajustes podem ser feitos antes da refatoracao generica.

## 4. Quais ajustes mexem em regra de negocio?

Mexem em regra e exigem mais cuidado:

- Meio a meio com limite de 2, 3 ou 4 sabores.
- Calculo de preco pelo maior valor.
- Adicionais dentro da pizza em vez de produto solto.
- Borda como modificador da pizza.
- Cupom de desconto.
- Taxa de entrega por bairro.
- Horario de funcionamento bloqueando pedidos.
- Bloqueio por assinatura.
- Reprocessamento de webhooks.
- Criacao de pedidos e payload enviado ao backend.
- Impressao quando depende da estrutura do item.

Esses pontos devem ser isolados em helpers/hooks antes de mudar a arquitetura.

## 5. O que deve ser feito antes da refatoracao generica?

Antes de mudar para uma arquitetura totalmente generica de `Products`, `ModifierGroups` e `ModifierOptions`, recomenda-se:

1. Separar o cardapio publico em componentes menores.
2. Separar o fluxo de pizza em etapas menores.
3. Extrair helpers de preco, sabores, tamanhos, adicionais e bebida.
4. Extrair o estado do checkout para hook proprio.
5. Extrair o estado do carrinho para uma unica fonte de verdade.
6. Dividir `use-menu-management.ts`.
7. Documentar o formato atual dos itens do carrinho e pedido.
8. Garantir testes manuais dos fluxos principais.
9. Isolar o que e especifico de pizzaria.
10. So depois iniciar a modelagem generica.

## 6. O que deve ficar para depois da refatoracao generica?

Deve ficar para depois:

- Suporte completo a hamburgueria, pastelaria e outros segmentos.
- Transformar borda, adicionais e tamanhos em modificadores 100% genericos.
- Criar editor visual completo de `ModifierGroups`.
- Migrar todo o checkout para ler apenas grupos genericos.
- Remover totalmente campos legados de pizza.
- Criar regras avancadas por tipo de produto.
- Criar testes automatizados amplos de combinacoes de modificadores.

## 7. Ordem segura de execucao

### Etapa 1 - Ajustes seguros de UX/UI

Objetivo: melhorar aparencia e responsividade sem mexer em regra.

Itens:

- Melhorar cards do cardapio publico.
- Ajustar grid mobile de tamanhos.
- Ajustar campos de preco no dashboard.
- Melhorar responsividade de pedidos e Master.
- Ajustar textos e microcopy.
- Corrigir elementos cortados.

Risco: baixo a medio.

### Etapa 2 - Separacao de componentes grandes

Objetivo: reduzir arquivos com mais de 600 linhas.

Separar:

- `public-menu-client.tsx`
- `pizza-configurator-flow.tsx`
- `checkout-modal.tsx`
- `cart-drawer.tsx`
- `master/clientes/page.tsx`
- `master/cobrancas/page.tsx`

Risco: medio a alto.

### Etapa 3 - Separacao de hooks/services

Objetivo: tirar regra e chamadas de API das telas.

Extrair:

- Hooks do cardapio publico.
- Hooks do checkout.
- Helpers de calculo de pizza.
- Helpers de taxa de entrega.
- Services do Master.
- Subservices dentro de billing.
- Services menores em menu-management.

Risco: alto.

### Etapa 4 - Validacao dos fluxos atuais

Objetivo: garantir que nada quebrou antes da refatoracao generica.

Fluxos a validar:

- Cadastro de sabor.
- Upload de foto.
- Cadastro de tamanho.
- Preco por tamanho.
- Pizza inteira.
- Meio a meio.
- Borda.
- Adicionais.
- Bebida sugerida.
- Carrinho.
- Checkout entrega.
- Checkout retirada.
- Pedido chegando no dashboard.
- Impressao.
- Horario fechado.
- Taxa por bairro.
- Cupom.
- Assinatura bloqueando pedido.

Risco: medio.

### Etapa 5 - Inicio da refatoracao generica

Objetivo: migrar gradualmente para produtos e modificadores genericos.

Primeiro passo recomendado:

- Criar camada adaptadora no frontend para transformar dados atuais de pizza em estrutura generica.
- Nao remover o fluxo antigo no primeiro movimento.
- Validar o mesmo comportamento com a camada adaptadora.
- Depois evoluir backend e banco com mais seguranca.

Risco: alto a critico.

## Recomendacao final

Nao iniciar a refatoracao generica diretamente enquanto `public-menu-client.tsx`, `pizza-configurator-flow.tsx`, `checkout-modal.tsx` e `use-menu-management.ts` estiverem concentrando tanta responsabilidade.

O caminho profissional e seguro e primeiro organizar os pontos grandes, manter o comportamento atual, validar o fluxo real do cliente e so depois generalizar a arquitetura.

