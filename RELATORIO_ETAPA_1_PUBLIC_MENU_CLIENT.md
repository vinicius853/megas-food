# Relatorio tecnico - Etapa 1: public-menu-client.tsx

Data: 01/06/2026

Projeto: Megas Food

Arquivo analisado:

```text
apps/web/components/public-menu/public-menu-client.tsx
```

Objetivo: propor uma divisao segura do arquivo grande do cardapio publico, sem alterar comportamento, regra de negocio, backend, banco, checkout, calculo de pizza, pedidos, cobranca, Mercado Pago ou autenticacao.

Status: somente analise. Nenhuma refatoracao aplicada.

## Analise

O arquivo `public-menu-client.tsx` possui atualmente aproximadamente **1264 linhas**.

Ele concentra muitas responsabilidades em um unico lugar:

- Declaracao de tipos do cardapio publico.
- Constantes de imagens fallback.
- Constantes de paletas de cor.
- Formatacao de dinheiro.
- Normalizacao de categorias.
- Icones e prioridade de categorias.
- Regras auxiliares de ordenacao.
- Calculo de horario de funcionamento.
- Verificacao se a loja esta aberta para pedidos.
- Mapeamento da resposta da API para cards visuais.
- Agrupamento de sabores e produtos por categoria.
- Criacao das tabs de categoria.
- Carregamento do cardapio via API.
- Controle de estado da busca.
- Controle da categoria ativa.
- Controle do carrinho.
- Controle do configurador de pizza.
- Controle da sugestao de bebida.
- Controle do feedback visual de item adicionado.
- Renderizacao do loading.
- Renderizacao do erro.
- Renderizacao do header com capa/logo.
- Renderizacao da busca.
- Renderizacao das tabs.
- Renderizacao das secoes do cardapio.
- Renderizacao dos cards de pizza.
- Renderizacao dos cards de produto fixo.
- Renderizacao da barra inferior do carrinho.
- Renderizacao do toast de item adicionado.
- Integracao com `PizzaConfiguratorFlow`.
- Integracao com `CartDrawer`.

O principal problema e que o arquivo mistura:

- layout;
- estado;
- mapeamento;
- helpers;
- formatadores;
- regras auxiliares de horario;
- regras auxiliares de categoria;
- renderizacao de cards;
- orquestracao do fluxo do cliente.

Isso dificulta manutencao e aumenta o risco de quebrar comportamento ao fazer pequenos ajustes.

## Plano de divisao

A divisao proposta e segura porque extrai primeiro codigo puro e componentes visuais, mantendo o arquivo principal como orquestrador.

### 1. Criar `public-menu.types.ts`

Responsabilidade:

Centralizar os tipos compartilhados do cardapio publico.

Tipos a mover:

- `ProductType`
- `Tenant`
- `Category`
- `Product`
- `PizzaSize`
- `PizzaFlavor`
- `FlavorPrice`
- `PizzaBorder`
- `BorderPrice`
- `PublicMenuResponse`
- `MenuCustomization`
- `DeliveryZone`
- `OpeningHourRange`
- `DeliveryOpeningHours`
- `DeliverySettings`
- `PublicSubscription`
- `MenuPalette`
- `FlavorCard`
- `FixedProductCard`
- `MenuSection`

Impacto esperado:

- Nenhuma mudanca de comportamento.
- Apenas mudanca de imports.

### 2. Criar `public-menu-theme.ts`

Responsabilidade:

Centralizar imagens fallback e paletas do cardapio.

Codigo a mover:

- `PIZZA_IMAGES`
- `PRODUCT_IMAGES`
- `MENU_PALETTES`
- `getMenuPalette`

Impacto esperado:

- Nenhuma mudanca visual.
- Mantem as mesmas cores e imagens fallback.

### 3. Criar `public-menu-formatters.ts`

Responsabilidade:

Centralizar formatadores e helpers puros de texto/categoria.

Codigo a mover:

- `parseMoney`
- `formatMoney`
- `formatShortMoney`
- `normalizeCategoryLabel`
- `getCategoryIcon`
- `getCategoryPriority`
- `compareCategoryOrder`
- `getSectionDomId`

Impacto esperado:

- Nenhuma mudanca de calculo.
- Nenhuma mudanca de exibicao esperada.
- Mantem mesmo comportamento de categorias e ordenacao.

### 4. Criar `public-menu-hours.ts`

Responsabilidade:

Centralizar calculo de horario de funcionamento e status da loja.

Codigo a mover:

- `timeToMinutes`
- `defaultOpeningRange`
- `weekDays`
- `getOpeningRange`
- `getNextOpeningMessage`
- `getStoreOpenStatus`

Impacto esperado:

- Nenhuma mudanca de regra.
- Continua bloqueando pedidos fora do horario.
- Continua mantendo o cardapio visivel quando pedidos estao pausados.

### 5. Criar `public-menu-mappers.ts`

Responsabilidade:

Centralizar transformacao da resposta da API em dados de tela.

Codigo a mover:

- `isPizzaProduct`
- `getPizzaProduct`
- `mapFlavorCards`
- `mapFixedProductCards`
- `isAdditionalCategory`
- `groupByCategory`
- `buildMenuSections`
- `buildCategoryTabs`

Impacto esperado:

- Nenhuma mudanca de payload.
- Nenhuma mudanca de preco.
- Nenhuma mudanca no limite de tamanhos exibidos.
- Nenhuma mudanca no agrupamento de categorias.

### 6. Criar `public-menu-product-card.tsx`

Responsabilidade:

Extrair os cards visuais repetidos dentro do `.map`.

Componentes sugeridos:

- `PublicFlavorCard`
- `PublicFixedProductCard`

Props sugeridas para `PublicFlavorCard`:

- `flavor`
- `palette`
- `storeOpen`
- `onAdd`

Props sugeridas para `PublicFixedProductCard`:

- `product`
- `palette`
- `storeOpen`
- `onAdd`

Impacto esperado:

- Mesmo HTML visual, apenas movido.
- Mesmo botao de adicionar.
- Mesmo disabled quando loja fechada.
- Mesmo layout responsivo de tamanhos.

### 7. Criar `public-menu-feedback.tsx`

Responsabilidade:

Extrair feedback visual do carrinho.

Componentes sugeridos:

- `AddedToCartToast`
- `BottomCartBar`

Props sugeridas para `AddedToCartToast`:

- `item`
- `palette`

Props sugeridas para `BottomCartBar`:

- `totalItems`
- `totalPrice`
- `palette`
- `cartPulseKey`
- `onOpenCart`

Impacto esperado:

- Mesma barra inferior.
- Mesmo contador.
- Mesmo subtotal.
- Mesmo toast de item adicionado.
- Mesma animacao.

### 8. Opcional: `public-menu-status.tsx`

Responsabilidade:

Extrair estados visuais simples:

- loading;
- erro;
- aviso de loja fechada.

Este arquivo pode ficar para uma segunda passada se a primeira divisao ja reduzir o arquivo principal abaixo de 800 linhas.

## Imports que seriam alterados

O arquivo principal passaria a importar tipos e helpers:

```ts
import type {
  FixedProductCard,
  PublicMenuResponse,
} from './public-menu.types'

import { getMenuPalette } from './public-menu-theme'

import {
  formatMoney,
  getCategoryIcon,
  getSectionDomId,
} from './public-menu-formatters'

import { getStoreOpenStatus } from './public-menu-hours'

import {
  buildCategoryTabs,
  buildMenuSections,
  getPizzaProduct,
  isAdditionalCategory,
  mapFixedProductCards,
  mapFlavorCards,
} from './public-menu-mappers'

import {
  PublicFlavorCard,
  PublicFixedProductCard,
} from './public-menu-product-card'

import {
  AddedToCartToast,
  BottomCartBar,
} from './public-menu-feedback'
```

Imports existentes que devem permanecer:

```ts
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Plus, Search, ShoppingBasket, ShoppingCart } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { CartDrawer } from './cart-drawer'
import { CartProvider, useCart } from './cart-context'
import { PizzaConfiguratorFlow } from './pizza-configurator-flow'
```

Depois da extracao visual, varios icones provavelmente deixam de ser usados no arquivo principal e passam para os componentes novos.

## O que NAO sera alterado

Nao sera alterado:

- backend;
- banco;
- Prisma;
- migrations;
- API `/public-menu/:slug`;
- payload enviado ao carrinho;
- payload enviado ao checkout;
- calculo de preco;
- regra de meio a meio;
- regra de borda;
- regra de adicionais;
- regra de sugestao de bebida;
- regra de horario de funcionamento;
- regra de assinatura bloqueando pedidos;
- fluxo visual inline/progressivo;
- `CartProvider`;
- `CartDrawer`;
- `PizzaConfiguratorFlow`;
- estilos principais;
- layout final do cardapio publico;
- textos visiveis;
- IDs de DOM usados para rolagem;
- comportamento do botao de carrinho;
- comportamento da busca;
- comportamento das categorias.

## Alteracoes propostas

O `public-menu-client.tsx` deve passar a cuidar principalmente de:

- carregar o menu publico;
- controlar estado local da tela;
- montar dados usando os helpers importados;
- compor header, busca, categorias, secoes, configurador e carrinho;
- coordenar eventos entre cardapio, carrinho e pizza flow.

A extracao deve ser feita sem mudar a ordem de execucao e sem alterar dados.

Estimativa de reducao:

- de aproximadamente **1264 linhas**;
- para algo entre **500 e 700 linhas**, dependendo se loading/erro forem extraidos nessa etapa.

## Testes manuais recomendados

Apos aplicar a divisao, testar:

1. Abrir `/c/[slug]`.
2. Confirmar que o cardapio carrega normalmente.
3. Confirmar que logo, capa e paleta continuam aplicadas.
4. Buscar pizzas pelo campo de busca.
5. Buscar bebidas pelo campo de busca.
6. Trocar categorias:
   - Todos;
   - Salgadas;
   - Doces;
   - Bebidas;
   - Adicionais;
   - Esfirra.
7. Clicar em uma pizza.
8. Confirmar abertura do fluxo de configuracao.
9. Escolher tamanho.
10. Escolher inteira ou meio a meio.
11. Escolher borda, se disponivel.
12. Escolher adicional, se disponivel.
13. Adicionar pizza ao carrinho.
14. Confirmar que a pizza entra no carrinho antes da sugestao de bebida.
15. Confirmar que a sugestao de bebida aparece apenas uma vez.
16. Clicar em "Sim, ver bebidas".
17. Confirmar rolagem ate Bebidas.
18. Adicionar bebida ao carrinho.
19. Confirmar toast de item adicionado.
20. Confirmar barra inferior com contador e subtotal.
21. Abrir carrinho.
22. Fechar carrinho.
23. Iniciar checkout.
24. Confirmar que entrega, retirada, pagamento e observacoes continuam iguais.
25. Testar loja fora do horario.
26. Confirmar que o cardapio continua visivel, mas pedidos ficam bloqueados.

## Criterios de aceite

A etapa so deve ser considerada concluida se:

- `public-menu-client.tsx` ficar abaixo de 800 linhas;
- app compilar sem erro;
- imports estiverem corretos;
- comportamento visual permanecer igual;
- nenhum payload for alterado;
- nenhuma regra de negocio for alterada;
- TypeScript nao apresentar erros;
- fluxo manual de teste for listado e executavel.

## Conclusao

A divisao proposta e segura porque move primeiro codigo puro e componentes visuais, sem alterar regras.

O arquivo principal deve continuar sendo o orquestrador do cardapio publico, mas deixara de carregar todos os detalhes internos de tipos, mapeamento, horario, formatacao e cards visuais.

Essa etapa prepara o projeto para futuras melhorias sem iniciar ainda a refatoracao generica para `Products`, `ModifierGroups` e `ModifierOptions`.

