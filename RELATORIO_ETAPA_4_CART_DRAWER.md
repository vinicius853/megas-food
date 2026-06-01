# Relatorio tecnico - Etapa 4: cart-drawer.tsx

## Arquivo analisado

`apps/web/components/public-menu/cart-drawer.tsx`

## Objetivo

Analisar se o arquivo realmente precisa ser dividido neste momento.

## Tamanho atual

O arquivo possui aproximadamente `601` linhas.

## Responsabilidades atuais

O arquivo atualmente:

- Define tipos locais:
  - `CartDrawerProps`
  - `MenuPalette`
  - `DeliveryZone`
  - `DeliverySettings`
  - `AppliedCoupon`
- Define helpers locais:
  - `toNumber`
  - `formatMoney`
  - `itemSubtitle`
- Consome `CartContext`:
  - `items`
  - `removeItem`
  - `increaseQuantity`
  - `decreaseQuantity`
  - `removeFlavor`
  - `removeBorder`
  - `removeAdditionalItem`
  - `totalItems`
  - `totalPrice`
- Controla estado local:
  - abertura do checkout;
  - abertura do campo de cupom;
  - codigo do cupom;
  - loading do cupom;
  - erro do cupom;
  - cupom aplicado.
- Valida cupom via API:
  - `POST /public-coupons/${tenantSlug}/validate`
- Revalida cupom quando o carrinho muda.
- Calcula subtotal com desconto.
- Renderiza:
  - overlay do carrinho;
  - cabecalho;
  - estado vazio;
  - lista de itens;
  - sabores removiveis;
  - borda removivel;
  - adicionais removiveis;
  - observacao do item;
  - bloco de cupom;
  - subtotal;
  - aviso de loja fechada;
  - botao finalizar;
  - `CheckoutModal`.

## Mistura de responsabilidades

Existe mistura, mas ela ainda esta sob controle.

### JSX

Grande parte do arquivo e JSX do carrinho:

- cabecalho;
- lista de itens;
- cards de item;
- cupom;
- subtotal;
- botao finalizar;
- chamada do `CheckoutModal`.

### Estado

O arquivo controla estados locais de cupom e abertura do checkout:

- `checkoutOpen`
- `couponOpen`
- `couponCode`
- `couponLoading`
- `couponError`
- `appliedCoupon`

### Calculos

Calculos presentes:

- `discountedSubtotal`
- formatacao de valores com `formatMoney`
- subtitulo do item com `itemSubtitle`

Nao ha calculo complexo de pedido neste arquivo.

### Manipulacao do carrinho

O arquivo chama diretamente funcoes do `CartContext`:

- remover item;
- aumentar quantidade;
- diminuir quantidade;
- remover sabor;
- remover borda;
- remover adicional.

### Integracao com checkout

O arquivo abre `CheckoutModal` e passa:

- itens;
- total;
- cupom;
- desconto;
- WhatsApp;
- tenant;
- paleta;
- entrega;
- status de pedidos.

## Plano de divisao possivel

Se no futuro for necessario dividir, a divisao segura seria:

### `cart-drawer.types.ts`

Mover:

- `CartDrawerProps`
- `MenuPalette`
- `DeliveryZone`
- `DeliverySettings`
- `AppliedCoupon`

### `cart-drawer-formatters.ts`

Mover:

- `toNumber`
- `formatMoney`
- `itemSubtitle`

### `cart-item-card.tsx`

Extrair o card de cada item do carrinho:

- imagem;
- nome;
- subtitulo;
- preco;
- quantidade;
- remover item;
- sabores;
- borda;
- adicionais;
- observacao.

### `cart-coupon-box.tsx`

Extrair:

- cupom aplicado;
- formulario de cupom;
- erro de cupom;
- botao de aplicar/remover.

### `cart-drawer-footer.tsx`

Extrair:

- subtotal;
- aviso de loja fechada;
- botao finalizar pedido.

## Estimativa de reducao

Divisao completa poderia retirar:

- Tipos/helpers: cerca de `45-55` linhas.
- `cart-item-card.tsx`: cerca de `190-230` linhas.
- `cart-coupon-box.tsx`: cerca de `70-90` linhas.
- `cart-drawer-footer.tsx`: cerca de `70-90` linhas.

Tamanho final estimado com divisao completa:

- entre `220` e `320` linhas.

Tamanho final com divisao minima de tipos/helpers:

- entre `545` e `560` linhas.

## Vale a pena dividir agora?

**NAO.**

## Justificativa

O arquivo possui aproximadamente `601` linhas, ou seja:

- ja esta abaixo da meta obrigatoria de `800` linhas;
- esta praticamente dentro do limite ideal de `600` linhas;
- o ganho de dividir agora nao compensa o risco.

A extracao que realmente reduziria bastante seria `cart-item-card.tsx`, mas ela envolve muitos handlers do carrinho:

- remover item;
- remover sabor;
- remover borda;
- remover adicional;
- aumentar quantidade;
- diminuir quantidade.

Isso aumenta o risco de regressao em um fluxo sensivel.

## O que nao deve ser extraido agora

Nao extrair neste momento:

- `applyCoupon`;
- revalidacao do cupom no `useEffect`;
- abertura do `CheckoutModal`;
- integracao com `useCart`;
- handlers de remover sabor, borda e adicional;
- calculo de `discountedSubtotal`;
- passagem de `couponCode` e `discountAmount` para o checkout.

Essas areas conectam carrinho, cupom e checkout.

## Riscos

### Baixo risco

- mover tipos;
- mover helpers puros.

### Medio risco

- extrair bloco de cupom;
- extrair footer.

### Medio/alto risco

- extrair card de item do carrinho, pois concentra varias acoes sensiveis.

## Testes necessarios se houver divisao futura

1. Abrir e fechar carrinho.
2. Carrinho vazio.
3. Carrinho com pizza.
4. Carrinho com bebida.
5. Aumentar quantidade.
6. Diminuir quantidade.
7. Remover item inteiro.
8. Remover sabor em pizza meio a meio.
9. Remover borda.
10. Remover adicional.
11. Ver observacao do item.
12. Aplicar cupom valido.
13. Aplicar cupom invalido.
14. Remover cupom.
15. Alterar carrinho com cupom aplicado e verificar revalidacao.
16. Conferir subtotal com desconto.
17. Abrir checkout.
18. Confirmar que cupom e desconto chegam ao checkout.
19. Confirmar que `CheckoutModal` abre com os itens reais.
20. Confirmar que loja fechada desabilita finalizar.

## Recomendacao final

Nao dividir `cart-drawer.tsx` agora.

O arquivo esta aceitavel para o tamanho atual do Megas Food.

A recomendacao e seguir para a proxima etapa oficial:

`apps/web/app/dashboard/cardapio/hooks/use-menu-management.ts`
