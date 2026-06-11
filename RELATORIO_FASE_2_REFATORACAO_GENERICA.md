# Relatorio Fase 2 - Refatoracao Generica do Megas Food

## Escopo

Este relatorio registra a analise tecnica para iniciar a Fase 2 da refatoracao generica do Megas Food.

Premissas desta fase:

- Nao deletar tabelas.
- Nao criar migrations neste momento.
- Nao modificar codigo de aplicacao neste momento.
- Preservar dados atuais.
- Substituir gradualmente a modelagem especifica de pizzaria por uma arquitetura generica baseada em produtos e modificadores.

## Objetivo da Refatoracao

O sistema hoje possui uma modelagem fortemente orientada a pizzarias, com estruturas especificas para:

- Tamanhos de pizza.
- Sabores de pizza.
- Precos por sabor e tamanho.
- Bordas.
- Precos por borda e tamanho.
- Meio a meio e multiplos sabores.

A nova arquitetura deve permitir que o mesmo motor atenda:

- Pizzas.
- Bebidas.
- Pizzas doces.
- Pizzas especiais.
- Hamburguerias futuramente.
- Outros segmentos alimenticios com produtos customizaveis.

## Resumo Executivo

O acoplamento com pizza aparece em tres camadas principais:

1. Banco de dados e Prisma.
2. Backend, especialmente cardapio, gestao de cardapio e pedidos.
3. Frontend, incluindo dashboard, cardapio publico, carrinho, checkout, impressao e WhatsApp.

O ponto mais sensivel e o fluxo de pedidos. Atualmente o backend calcula o preco de pizza usando a maior combinacao de preco entre sabores selecionados, soma borda e adiciona produtos avulsos classificados como adicionais. Esse comportamento precisa ser preservado no novo motor generico.

Recomendacao central: implementar a nova modelagem em paralelo, migrar os dados por backfill seguro e manter compatibilidade de leitura com os pedidos antigos.

## Modelagem Atual Encontrada

### Prisma

Arquivo principal:

- `apps/api/prisma/schema.prisma`

Modelos especificos de pizza:

- `PizzaSize`
- `PizzaFlavor`
- `PizzaFlavorPrice`
- `PizzaBorder`
- `PizzaBorderPrice`
- `OrderItemFlavor`

Enums especificos:

- `ProductType`
  - `PIZZA_ROUND`
  - `PIZZA_SQUARE`
  - `DRINK`
  - `OTHER`
- `PizzaSizeType`
  - `CM`
  - `SLICES`
  - `CUSTOM`
- `CategoryType`
  - `PRODUCT_SECTION`
  - `PIZZA_FLAVOR_GROUP`

Campos especificos em pedidos:

- `OrderItem.sizeId`
- `OrderItem.borderId`
- `OrderItem.sizeName`
- `OrderItem.borderName`
- Relacao `OrderItem.flavors`
- Tabela `order_item_flavors`

## Arquivos Afetados Encontrados

### Backend

Modulo raiz:

- `apps/api/src/app.module.ts`

Modulos especificos de pizza:

- `apps/api/src/modules/pizza-sizes/pizza-sizes.module.ts`
- `apps/api/src/modules/pizza-sizes/pizza-sizes.controller.ts`
- `apps/api/src/modules/pizza-sizes/pizza-sizes.service.ts`
- `apps/api/src/modules/pizza-sizes/dto/create-pizza-size.dto.ts`
- `apps/api/src/modules/pizza-sizes/dto/update-pizza-size.dto.ts`
- `apps/api/src/modules/pizza-sizes/*.spec.ts`

- `apps/api/src/modules/pizza-flavors/pizza-flavors.module.ts`
- `apps/api/src/modules/pizza-flavors/pizza-flavors.controller.ts`
- `apps/api/src/modules/pizza-flavors/pizza-flavors.service.ts`
- `apps/api/src/modules/pizza-flavors/dto/create-pizza-flavor.dto.ts`
- `apps/api/src/modules/pizza-flavors/dto/update-pizza-flavor.dto.ts`
- `apps/api/src/modules/pizza-flavors/entities/pizza-flavor.entity.ts`
- `apps/api/src/modules/pizza-flavors/*.spec.ts`

- `apps/api/src/modules/flavor-prices/flavor-prices.module.ts`
- `apps/api/src/modules/flavor-prices/flavor-prices.controller.ts`
- `apps/api/src/modules/flavor-prices/flavor-prices.service.ts`
- `apps/api/src/modules/flavor-prices/dto/create-flavor-price.dto.ts`
- `apps/api/src/modules/flavor-prices/dto/update-flavor-price.dto.ts`
- `apps/api/src/modules/flavor-prices/*.spec.ts`

- `apps/api/src/modules/pizza-borders/pizza-borders.module.ts`
- `apps/api/src/modules/pizza-borders/pizza-borders.controller.ts`
- `apps/api/src/modules/pizza-borders/pizza-borders.service.ts`
- `apps/api/src/modules/pizza-borders/dto/create-pizza-border.dto.ts`
- `apps/api/src/modules/pizza-borders/dto/update-pizza-border.dto.ts`
- `apps/api/src/modules/pizza-borders/entities/pizza-border.entity.ts`
- `apps/api/src/modules/pizza-borders/*.spec.ts`

- `apps/api/src/modules/border-prices/border-prices.module.ts`
- `apps/api/src/modules/border-prices/border-prices.controller.ts`
- `apps/api/src/modules/border-prices/border-prices.service.ts`
- `apps/api/src/modules/border-prices/dto/create-border-price.dto.ts`
- `apps/api/src/modules/border-prices/dto/update-border-price.dto.ts`
- `apps/api/src/modules/border-prices/entities/border-price.entity.ts`
- `apps/api/src/modules/border-prices/*.spec.ts`

Servicos e contratos compartilhados:

- `apps/api/src/modules/products/products.service.ts`
- `apps/api/src/modules/products/dto/create-product.dto.ts`
- `apps/api/src/modules/products/dto/update-product.dto.ts`
- `apps/api/src/modules/menu-management/menu-management.service.ts`
- `apps/api/src/modules/menu-management/dto/update-menu-management.dto.ts`
- `apps/api/src/public-menu/public-menu.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/orders/dto/create-order.dto.ts`
- `apps/api/src/modules/orders/entities/order.entity.ts`
- `apps/api/src/modules/orders/public-orders.controller.ts`
- `apps/api/src/modules/public-orders.service.ts`

### Prisma e migrations historicas

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260508150012_init/migration.sql`
- `apps/api/prisma/migrations/20260516050017_add_category_type_and_flavor_groups/migration.sql`
- `apps/api/prisma/migrations/20260517012606_add_pizza_flavor_sort_order/migration.sql`
- `apps/api/prisma/migrations/20260524190000_add_pizza_flavor_images/migration.sql`
- `apps/api/prisma/migrations/20260531193000_add_pizza_size_subtitle/migration.sql`

Observacao: migrations historicas nao devem ser editadas. Elas servem apenas como evidencia da estrutura atual.

### Frontend - cardapio publico

- `apps/web/components/public-menu/public-menu.types.ts`
- `apps/web/components/public-menu/public-menu-client.tsx`
- `apps/web/components/public-menu/public-menu-mappers.ts`
- `apps/web/components/public-menu/public-menu-product-card.tsx`
- `apps/web/components/public-menu/product-modal.tsx`
- `apps/web/components/public-menu/inline-product-wizard.tsx`
- `apps/web/components/public-menu/pizza-configurator.types.ts`
- `apps/web/components/public-menu/pizza-configurator-flow.tsx`
- `apps/web/components/public-menu/pizza-configurator-helpers.ts`
- `apps/web/components/public-menu/pizza-configurator-summary.tsx`
- `apps/web/components/public-menu/pizza-configurator-option-card.tsx`
- `apps/web/components/public-menu/pizza-configurator-drink-suggestion.tsx`
- `apps/web/components/public-menu/cart-context.tsx`
- `apps/web/components/public-menu/cart-drawer.tsx`
- `apps/web/components/public-menu/checkout-modal.tsx`

### Frontend - dashboard de cardapio

- `apps/web/app/dashboard/cardapio/page.tsx`
- `apps/web/app/dashboard/cardapio/tamanhos/page.tsx`
- `apps/web/app/dashboard/cardapio/sabores/page.tsx`
- `apps/web/app/dashboard/cardapio/bordas/page.tsx`
- `apps/web/app/dashboard/cardapio/precos/page.tsx`
- `apps/web/app/dashboard/cardapio/matriz-pizzas/page.tsx`
- `apps/web/app/dashboard/cardapio/estrutura/page.tsx`
- `apps/web/app/dashboard/cardapio/produtos/page.tsx`
- `apps/web/app/dashboard/cardapio/types/menu-management.ts`
- `apps/web/app/dashboard/cardapio/hooks/use-menu-management.ts`
- `apps/web/app/dashboard/cardapio/hooks/menu-management-normalizers.ts`
- `apps/web/app/dashboard/cardapio/hooks/menu-management-selectors.ts`
- `apps/web/app/dashboard/cardapio/hooks/menu-management-constants.ts`
- `apps/web/app/dashboard/cardapio/hooks/menu-management-utils.ts`
- `apps/web/app/dashboard/cardapio/components/pizza-price-matrix.tsx`
- `apps/web/app/dashboard/cardapio/components/border-price-matrix.tsx`
- `apps/web/app/dashboard/cardapio/components/size-group.tsx`
- `apps/web/app/dashboard/cardapio/components/editable-size-rule.tsx`
- `apps/web/app/dashboard/cardapio/components/simple-list.tsx`
- `apps/web/app/dashboard/cardapio/components/product-section-list.tsx`

Componentes antigos do dashboard:

- `apps/web/components/dashboard/cardapio/pizza-size-form.tsx`
- `apps/web/components/dashboard/cardapio/pizza-size-list.tsx`
- `apps/web/components/dashboard/cardapio/pizza-flavor-form.tsx`
- `apps/web/components/dashboard/cardapio/pizza-flavor-list.tsx`
- `apps/web/components/dashboard/cardapio/flavor-price-form.tsx`
- `apps/web/components/dashboard/cardapio/flavor-price-table.tsx`
- `apps/web/components/dashboard/cardapio/pizza-border-form.tsx`
- `apps/web/components/dashboard/cardapio/pizza-border-list.tsx`
- `apps/web/components/dashboard/cardapio/product-form.tsx`
- `apps/web/components/dashboard/cardapio/product-list.tsx`
- `apps/web/components/dashboard/cardapio/category-form.tsx`
- `apps/web/components/dashboard/cardapio/category-list.tsx`

### Frontend - pedidos, impressao e WhatsApp

- `apps/web/app/dashboard/pedidos/types.ts`
- `apps/web/app/dashboard/pedidos/use-orders.ts`
- `apps/web/app/dashboard/pedidos/orders-table.tsx`
- `apps/web/app/dashboard/pedidos/order-modal.tsx`
- `apps/web/app/dashboard/pedidos/print-order.ts`
- `apps/web/app/dashboard/pedidos/whatsapp-order.ts`

### Seeds, dados fake e dados base

Nao foi encontrado arquivo de seed dedicado.

Foram encontrados dados-base criados pelo frontend em:

- `apps/web/app/dashboard/cardapio/hooks/menu-management-normalizers.ts`

Esse arquivo cria ou garante estruturas como:

- `Pizzas`
- `Bebidas`
- `Adicionais`
- `Pizza redonda`
- `Pizza quadrada`
- `Salgadas`
- `Doces`

Esses dados-base deverao ser substituidos futuramente por templates genericos de cardapio ou por uma configuracao inicial por segmento.

## Pontos Criticos de Acoplamento

### 1. Produto ainda depende de tipo especifico

`Product.type` diferencia:

- `PIZZA_ROUND`
- `PIZZA_SQUARE`
- `DRINK`
- `OTHER`

Essa divisao funciona para pizzaria, mas nao escala bem para hamburguerias ou outros segmentos.

### 2. Pedido tem fluxo especial para pizza

No backend, o pedido trata pizza de forma separada:

- Produtos que nao sao pizza usam `product.price`.
- Produtos pizza exigem `sizeId`.
- Produtos pizza exigem sabores.
- O limite de sabores vem de `PizzaSize.maxFlavors`.
- O preco da pizza e o maior preco entre os sabores selecionados.
- Borda e adicionais sao somados separadamente.

### 3. Cardapio publico retorna contrato especifico

O endpoint publico retorna:

- `sizes`
- `flavors`
- `flavorPrices`
- `borders`
- `borderPrices`

O frontend depende diretamente dessas listas.

### 4. Dashboard usa matriz de pizza

O dashboard possui telas e componentes especificos para:

- Tamanhos.
- Sabores.
- Bordas.
- Matriz de precos por sabor/tamanho.
- Matriz de precos por borda/tamanho.

### 5. Carrinho e checkout armazenam campos fixos

O carrinho possui:

- `sizeId`
- `sizeName`
- `flavorIds`
- `flavors`
- `borderId`
- `borderName`
- `borderPrice`
- `additionalItems`

Na arquitetura nova, isso deve virar uma lista generica de modificadores selecionados.

### 6. Impressao infere nomes comerciais de pizza

A impressao transforma dois sabores em `Pizza Meio a Meio` e mais de dois sabores em `Pizza N Sabores`.

Essa regra deve ser substituida por uma renderizacao generica baseada nos grupos de modificadores.

## Nova Modelagem Proposta

### Product

Representa qualquer item vendavel.

Campos sugeridos:

- `id`
- `tenantId`
- `categoryId`
- `name`
- `description`
- `imageUrl`
- `basePrice`
- `type` ou `kind` generico
- `isActive`
- `sortOrder`
- `createdAt`
- `updatedAt`

Observacao: em uma primeira etapa, `ProductType` pode ser mantido para compatibilidade, mas a regra de negocio deve migrar para modificadores.

### ModifierGroup

Representa um grupo de escolhas de um produto.

Exemplos:

- Tamanho.
- Sabores.
- Borda.
- Adicionais.
- Ponto da carne.
- Molhos.
- Tipo de pao.

Campos sugeridos:

- `id`
- `tenantId`
- `name`
- `code`
- `selectionType`
- `pricingMode`
- `minSelections`
- `maxSelections`
- `isRequired`
- `sortOrder`
- `isActive`
- `createdAt`
- `updatedAt`

Enums sugeridos:

- `selectionType`
  - `SINGLE`
  - `MULTIPLE`
- `pricingMode`
  - `ADDITIVE`
  - `REPLACE_BASE`
  - `HIGHEST_SELECTED`
  - `INCLUDED`

### ModifierOption

Representa uma opcao dentro de um grupo.

Exemplos:

- Grande.
- Calabresa.
- Chocolate.
- Borda de catupiry.
- Bacon.
- Cheddar.

Campos sugeridos:

- `id`
- `tenantId`
- `groupId`
- `name`
- `description`
- `imageUrl`
- `priceDelta`
- `sortOrder`
- `isActive`
- `createdAt`
- `updatedAt`

### ProductModifierGroup

Relaciona produtos com grupos de modificadores.

Campos sugeridos:

- `id`
- `tenantId`
- `productId`
- `modifierGroupId`
- `sortOrder`
- `isRequiredOverride`
- `minSelectionsOverride`
- `maxSelectionsOverride`

Essa tabela permite que o mesmo grupo seja reaproveitado em varios produtos.

### ModifierOptionPrice

Tabela recomendada para preservar a regra atual de pizza.

Motivo: hoje o preco do sabor depende de produto + tamanho + sabor. Um simples `priceDelta` na opcao nao representa isso com fidelidade.

Campos sugeridos:

- `id`
- `tenantId`
- `productId`
- `modifierOptionId`
- `dependsOnOptionId`
- `price`

Exemplo:

- Produto: Pizza redonda.
- Opcao dependente: Tamanho grande.
- Opcao precificada: Calabresa.
- Preco: R$ 59,90.

### OrderItem

Continua representando o item vendido, mas deve deixar de conhecer campos especificos como `sizeId` e `borderId` no fluxo novo.

Campos sugeridos:

- `id`
- `orderId`
- `productId`
- `name`
- `quantity`
- `unitPrice`
- `total`
- `notes`

### OrderItemModifier

Snapshot dos modificadores escolhidos no momento da venda.

Campos sugeridos:

- `id`
- `orderItemId`
- `modifierGroupId`
- `modifierOptionId`
- `groupName`
- `optionName`
- `quantity`
- `unitPriceDelta`
- `totalDelta`

Snapshots de nome e preco sao importantes para preservar pedidos historicos mesmo que o cardapio mude depois.

## Como a Nova Modelagem Atende Cada Caso

### Pizzas

Produto:

- Pizza redonda.
- Pizza quadrada.
- Pizza especial.

Grupos:

- Tamanho.
- Sabores.
- Bordas.
- Adicionais.

Regras:

- Tamanho: `SINGLE`.
- Sabores: `MULTIPLE`, com minimo 1 e maximo variavel.
- Preco dos sabores: `HIGHEST_SELECTED` ou preco contextual por tamanho.
- Borda: `SINGLE`, opcional, `ADDITIVE`.
- Adicionais: `MULTIPLE`, opcional, `ADDITIVE`.

### Bebidas

Produto:

- Coca-Cola.
- Guarana.
- Agua.

Possibilidades:

- Produto simples com `basePrice`.
- Ou grupo `Volume` com lata, 600ml e 2L.

Nao exige sabores, bordas ou tamanho de pizza.

### Pizzas doces

Podem ser tratadas como:

- Sabores dentro de um grupo `Sabores doces`.
- Categoria visual `Doces`.
- Produtos especiais, se a pizzaria vender pizzas doces prontas.

A mesma regra de tamanho, borda e adicionais pode ser reaproveitada.

### Pizzas especiais

Podem ser:

- Produtos proprios com preco base.
- Produtos com grupos limitados.
- Produtos sem escolha livre de sabores.

Exemplo:

- `Pizza da Casa`.
- Grupo `Tamanho`.
- Grupo opcional `Borda`.
- Sem grupo `Sabores`.

### Hamburguerias

Produto:

- X-Burger.
- X-Salada.
- Combo.

Grupos:

- Ponto da carne.
- Queijo.
- Pao.
- Molhos.
- Adicionais.
- Bebida do combo.

Regras:

- `Ponto da carne`: `SINGLE`, obrigatorio.
- `Molhos`: `MULTIPLE`, opcional.
- `Adicionais`: `MULTIPLE`, opcional, `ADDITIVE`.
- `Bebida do combo`: `SINGLE`, opcional ou obrigatorio.

## Estrategia de Migracao Segura

### Principios

- Migracao aditiva primeiro.
- Nenhuma tabela antiga deve ser removida na Fase 2 inicial.
- Nenhum pedido antigo deve perder leitura.
- O calculo de preco deve ser validado contra o comportamento atual.
- O frontend novo deve conviver temporariamente com o contrato antigo.

### Backfill proposto

Conversoes:

- `PizzaSize` vira `ModifierGroup: Tamanho` + `ModifierOption`.
- `PizzaFlavor` vira `ModifierGroup: Sabores` + `ModifierOption`.
- `PizzaBorder` vira `ModifierGroup: Bordas` + `ModifierOption`.
- Produtos `OTHER` da categoria `Adicionais` viram opcoes de `ModifierGroup: Adicionais`.
- `PizzaFlavorPrice` vira `ModifierOptionPrice`.
- `PizzaBorderPrice` vira preco adicional de opcao ou `ModifierOptionPrice`.

### Compatibilidade com pedidos antigos

Durante a transicao:

- Continuar lendo `OrderItemFlavor`.
- Continuar exibindo `sizeName` e `borderName`.
- Adicionar leitura de `OrderItemModifier` para pedidos novos.
- Impressao e modal de pedido devem suportar os dois formatos.

## Plano de Execucao por Etapas

### Etapa 2.1 - Fechamento do desenho tecnico

Objetivo:

- Definir schema final dos modificadores.
- Confirmar enums.
- Confirmar necessidade de `ModifierOptionPrice`.
- Definir contrato de API v2.

Resultado esperado:

- Documento tecnico aprovado.
- Nenhuma alteracao de banco ainda.

### Etapa 2.2 - Prisma aditivo

Objetivo:

- Adicionar novas tabelas genericas.
- Manter tabelas antigas.

Entregas:

- Models Prisma novos.
- Migration apenas aditiva.
- Prisma Client atualizado.

Validacao:

- `npx prisma validate`.
- `npx prisma generate`.
- Build do backend.

### Etapa 2.3 - Backfill idempotente

Objetivo:

- Criar script ou servico para copiar dados atuais para a nova estrutura.

Regras:

- Pode rodar mais de uma vez sem duplicar dados.
- Deve registrar referencias antigas.
- Deve gerar relatorio de contagem antes/depois.

Validacao:

- Quantidade de tamanhos convertidos.
- Quantidade de sabores convertidos.
- Quantidade de bordas convertidas.
- Quantidade de precos convertidos.

### Etapa 2.4 - Backend generico

Objetivo:

- Criar modulos de modificadores.
- Criar motor generico de preco.
- Criar DTO novo de pedido.

Entregas:

- `modifier-groups`.
- `modifier-options`.
- `product-modifier-groups`.
- Servico de precificacao.
- Pedido v2 aceitando `selectedModifiers`.

Validacao:

- Pizza com 1 sabor.
- Pizza meio a meio.
- Pizza com borda.
- Pizza com adicionais.
- Bebida simples.
- Produto com modificador simples.

### Etapa 2.5 - Cardapio publico v2

Objetivo:

- Expor produtos com grupos de modificadores.

Contrato sugerido:

- `products[]`
  - dados do produto.
  - `modifierGroups[]`
    - dados do grupo.
    - `options[]`

Compatibilidade:

- Manter endpoint antigo enquanto o frontend nao for migrado.

### Etapa 2.6 - Carrinho e checkout genericos

Objetivo:

- Substituir campos fixos de pizza por `selectedModifiers`.

Antes:

- `sizeId`
- `flavorIds`
- `borderId`
- `additionalItems`

Depois:

- `selectedModifiers[]`
  - `groupId`
  - `groupName`
  - `optionId`
  - `optionName`
  - `priceDelta`
  - `quantity`

### Etapa 2.7 - Impressao e WhatsApp

Objetivo:

- Renderizar modificadores dinamicamente.

Nova exibicao:

- Produto.
- Grupo: Opcao.
- Quantidade.
- Observacoes.

Regra:

- Evitar inferir nomes como `Pizza Meio a Meio` pelo numero de sabores.
- Se desejar manter esse titulo comercial, ele deve vir de regra explicita do grupo ou do produto.

### Etapa 2.8 - Dashboard de cardapio generico

Objetivo:

- Substituir telas especificas de pizza por um editor de produtos e modificadores.

Nova estrutura sugerida:

- Produtos.
- Categorias.
- Grupos de modificadores.
- Opcoes.
- Vinculos produto/grupo.
- Precificacao.

Importante:

- Remover gradualmente o comportamento destrutivo baseado em `deleteMany` por payload completo.
- Preferir operacoes explicitas de criar, atualizar, inativar e reordenar.

### Etapa 2.9 - Corte gradual do legado

Objetivo:

- Parar de usar modelos antigos no fluxo novo.

Somente depois de validado:

- Congelar endpoints antigos.
- Remover uso no frontend.
- Manter leitura historica.
- Planejar fase futura para remocao fisica de tabelas, se necessario.

## Riscos Identificados

### Risco alto: quebra no calculo de preco

O comportamento atual de pizza usa maior preco entre sabores, mais borda, mais adicionais. O novo motor precisa reproduzir isso exatamente antes de substituir o fluxo atual.

### Risco alto: perda de dados por sincronizacao destrutiva

`menu-management.service.ts` usa exclusoes por `notIn`. Durante a migracao, isso pode apagar registros se o payload novo nao contiver todos os dados esperados.

### Risco alto: pedidos antigos

Pedidos existentes usam `OrderItemFlavor`, `sizeName` e `borderName`. A tela de pedidos, impressao e WhatsApp precisam continuar lendo esse formato.

### Risco medio: contrato publico muito especifico

O frontend publico depende de `sizes`, `flavors`, `flavorPrices`, `borders` e `borderPrices`. Trocar o contrato de uma vez quebra o cardapio.

### Risco medio: dashboard acoplado a pizzas

O dashboard atual organiza a gestao em abas de pizza. A mudanca para modificadores exige redesenho de fluxo, nao apenas troca de nomes.

### Risco medio: adicionais como produtos

Adicionais hoje sao produtos `OTHER` em categoria `Adicionais`. No modelo novo, devem ser opcoes de modificador, mas a migracao precisa preservar preco e exibicao.

### Risco baixo: textos e branding de pizzaria

Ha textos como `pizzaria`, `Parada Pizza`, `classic-pizza` e icones de pizza em varias telas. Isso nao bloqueia a arquitetura, mas deve entrar em etapa posterior de generalizacao visual.

## Recomendacao Final

A Fase 2 deve seguir uma estrategia de convivencia entre legado e novo modelo.

Ordem recomendada:

1. Fechar schema generico.
2. Criar tabelas novas sem remover antigas.
3. Backfill idempotente.
4. Criar motor de preco generico.
5. Criar pedido v2.
6. Criar cardapio publico v2.
7. Migrar carrinho e checkout.
8. Migrar impressao e WhatsApp.
9. Migrar dashboard.
10. Planejar desativacao gradual do legado.

Nao e recomendado iniciar pelo frontend. O backend e o banco precisam oferecer compatibilidade primeiro, porque o maior risco da Fase 2 esta no calculo de preco e na preservacao dos pedidos atuais.
