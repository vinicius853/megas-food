# MEGAS FOOD - FASE 2.1.1

# SCHEMA PROPOSTO

Este relatorio documenta a proposta final de schema Prisma para a nova arquitetura generica do Megas Food baseada em produtos e modificadores.

Importante:

- Este documento nao implementa mudancas.
- Nenhum arquivo de codigo foi alterado.
- Nenhuma migration foi criada.
- Nenhuma tabela atual deve ser removida nesta etapa.
- O schema abaixo e uma proposta arquitetural para aprovacao antes da etapa de migration.

## Models Prisma

```prisma
enum ModifierSelectionType {
  SINGLE
  MULTIPLE
}

enum ModifierPricingMode {
  INCLUDED
  ADDITIVE
  REPLACE_BASE
  HIGHEST_SELECTED
}

enum ProductPricingMode {
  FIXED
  FROM_MODIFIERS
}

model Product {
  id          String   @id @default(uuid())
  tenantId    String
  categoryId  String
  name        String
  description String?
  imageUrl    String?

  type        ProductType
  pricingMode ProductPricingMode @default(FIXED)
  basePrice   Decimal? @db.Decimal(10, 2)

  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  modifierGroups       ProductModifierGroup[]
  modifierOptionPrices ModifierOptionPrice[]
  orderItems           OrderItem[]

  sizes        PizzaSize[]
  flavorPrices PizzaFlavorPrice[]
  borderPrices PizzaBorderPrice[]

  @@index([tenantId])
  @@index([tenantId, categoryId])
  @@index([tenantId, isActive])
  @@index([tenantId, sortOrder])
  @@map("products")
}

model ModifierGroup {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  code        String
  description String?

  selectionType ModifierSelectionType
  pricingMode   ModifierPricingMode @default(ADDITIVE)

  minSelections Int     @default(0)
  maxSelections Int     @default(1)
  isRequired    Boolean @default(false)

  sortOrder Int     @default(0)
  isActive  Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  options            ModifierOption[]
  products           ProductModifierGroup[]
  orderItemModifiers OrderItemModifier[]

  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([tenantId, isActive])
  @@index([tenantId, sortOrder])
  @@map("modifier_groups")
}

model ModifierOption {
  id       String @id @default(uuid())
  tenantId String
  groupId  String

  name        String
  code        String?
  description String?
  imageUrl    String?

  priceDelta Decimal @default(0) @db.Decimal(10, 2)

  sortOrder Int     @default(0)
  isActive  Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  group  ModifierGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)

  contextualPrices ModifierOptionPrice[] @relation("ModifierOptionContextualPrices")
  dependentPrices  ModifierOptionPrice[] @relation("ModifierOptionDependentPrices")
  orderItemModifiers OrderItemModifier[]

  @@unique([tenantId, groupId, name])
  @@index([tenantId])
  @@index([groupId])
  @@index([tenantId, isActive])
  @@index([tenantId, sortOrder])
  @@map("modifier_options")
}

model ProductModifierGroup {
  id              String @id @default(uuid())
  tenantId        String
  productId       String
  modifierGroupId String

  sortOrder Int @default(0)

  isRequiredOverride    Boolean?
  minSelectionsOverride Int?
  maxSelectionsOverride Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant        Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  product       Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  modifierGroup ModifierGroup @relation(fields: [modifierGroupId], references: [id], onDelete: Cascade)

  @@unique([tenantId, productId, modifierGroupId])
  @@index([tenantId])
  @@index([productId])
  @@index([modifierGroupId])
  @@index([tenantId, productId, sortOrder])
  @@map("product_modifier_groups")
}

model ModifierOptionPrice {
  id String @id @default(uuid())

  tenantId String
  productId String

  modifierOptionId String
  dependsOnOptionId String?

  price Decimal @db.Decimal(10, 2)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  modifierOption ModifierOption @relation("ModifierOptionContextualPrices", fields: [modifierOptionId], references: [id], onDelete: Cascade)
  dependsOnOption ModifierOption? @relation("ModifierOptionDependentPrices", fields: [dependsOnOptionId], references: [id], onDelete: Cascade)

  @@unique([tenantId, productId, modifierOptionId, dependsOnOptionId])
  @@index([tenantId])
  @@index([productId])
  @@index([modifierOptionId])
  @@index([dependsOnOptionId])
  @@map("modifier_option_prices")
}

model OrderItem {
  id        String @id @default(uuid())
  orderId   String
  productId String?

  name      String
  quantity  Int @default(1)
  unitPrice Decimal @db.Decimal(10, 2)
  total     Decimal @db.Decimal(10, 2)
  notes     String?

  sizeId     String?
  borderId   String?
  sizeName   String?
  borderName String?

  order   Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id], onDelete: SetNull)

  modifiers OrderItemModifier[]
  flavors   OrderItemFlavor[]

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

model OrderItemModifier {
  id String @id @default(uuid())

  orderItemId String

  modifierGroupId  String?
  modifierOptionId String?

  groupName  String
  optionName String

  quantity Int @default(1)

  unitPriceDelta Decimal @default(0) @db.Decimal(10, 2)
  totalDelta     Decimal @default(0) @db.Decimal(10, 2)

  orderItem OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)

  modifierGroup  ModifierGroup?  @relation(fields: [modifierGroupId], references: [id], onDelete: SetNull)
  modifierOption ModifierOption? @relation(fields: [modifierOptionId], references: [id], onDelete: SetNull)

  @@index([orderItemId])
  @@index([modifierGroupId])
  @@index([modifierOptionId])
  @@map("order_item_modifiers")
}
```

## Relacionamentos

`Product` continua sendo a entidade principal de venda. Ele pertence a um `Tenant` e a uma `Category`.

`ModifierGroup` pertence a um `Tenant` e representa um grupo de escolhas, como tamanho, sabores, bordas, adicionais, molhos ou ponto da carne.

`ModifierOption` pertence a um `ModifierGroup` e representa uma opcao dentro desse grupo.

`ProductModifierGroup` liga produtos a grupos de modificadores. Essa tabela permite reaproveitar o mesmo grupo em varios produtos.

`ModifierOptionPrice` define precos contextuais. Ela permite que uma opcao tenha preco diferente conforme produto e outra opcao selecionada.

`OrderItemModifier` grava o snapshot dos modificadores escolhidos no pedido. Ele pode manter referencia ao grupo/opcao original, mas tambem salva nomes e valores para preservar historico.

## Indices

Indices recomendados em `Product`:

- `@@index([tenantId])`
- `@@index([tenantId, categoryId])`
- `@@index([tenantId, isActive])`
- `@@index([tenantId, sortOrder])`

Indices recomendados em `ModifierGroup`:

- `@@index([tenantId])`
- `@@index([tenantId, isActive])`
- `@@index([tenantId, sortOrder])`

Indices recomendados em `ModifierOption`:

- `@@index([tenantId])`
- `@@index([groupId])`
- `@@index([tenantId, isActive])`
- `@@index([tenantId, sortOrder])`

Indices recomendados em `ProductModifierGroup`:

- `@@index([tenantId])`
- `@@index([productId])`
- `@@index([modifierGroupId])`
- `@@index([tenantId, productId, sortOrder])`

Indices recomendados em `ModifierOptionPrice`:

- `@@index([tenantId])`
- `@@index([productId])`
- `@@index([modifierOptionId])`
- `@@index([dependsOnOptionId])`

Indices recomendados em `OrderItemModifier`:

- `@@index([orderItemId])`
- `@@index([modifierGroupId])`
- `@@index([modifierOptionId])`

## Constraints

Constraints recomendadas:

```prisma
@@unique([tenantId, code])
```

Em `ModifierGroup`, evita grupos duplicados por tenant.

```prisma
@@unique([tenantId, groupId, name])
```

Em `ModifierOption`, evita opcoes duplicadas dentro do mesmo grupo.

```prisma
@@unique([tenantId, productId, modifierGroupId])
```

Em `ProductModifierGroup`, evita vincular o mesmo grupo duas vezes ao mesmo produto.

```prisma
@@unique([tenantId, productId, modifierOptionId, dependsOnOptionId])
```

Em `ModifierOptionPrice`, evita precos contextuais duplicados.

## Compatibilidade com legado

As seguintes tabelas atuais devem continuar existindo temporariamente:

- `PizzaSize`
- `PizzaFlavor`
- `PizzaFlavorPrice`
- `PizzaBorder`
- `PizzaBorderPrice`
- `OrderItemFlavor`

Essas tabelas nao devem ser deletadas na primeira fase de migration porque:

- Pedidos antigos dependem delas.
- O dashboard atual ainda usa elas.
- O cardapio publico atual ainda consome arrays separados de tamanhos, sabores, bordas e precos.
- A migracao precisa permitir comparacao entre calculo antigo e calculo novo.

Campos atuais mantidos temporariamente por compatibilidade:

- `Product.type`
- `Product.price`, se mantido no schema real atual
- `OrderItem.sizeId`
- `OrderItem.borderId`
- `OrderItem.sizeName`
- `OrderItem.borderName`
- `OrderItem.flavors`
- `Category.type`
- `ProductType.PIZZA_ROUND`
- `ProductType.PIZZA_SQUARE`
- `ProductType.DRINK`
- `ProductType.OTHER`
- `CategoryType.PIZZA_FLAVOR_GROUP`

Durante a transicao, o sistema deve aceitar dois formatos:

- Pedido legado com `OrderItemFlavor`, `sizeName` e `borderName`.
- Pedido novo com `OrderItemModifier`.

## Estrategia de migracao

### Pizza tradicional

Produto:

- Pizza redonda.
- Pizza quadrada.

Grupos:

- Tamanho.
- Sabores.
- Bordas.
- Adicionais.

Configuracao:

- Tamanho: `SINGLE`, obrigatorio.
- Sabores: `MULTIPLE`, obrigatorio, `HIGHEST_SELECTED`.
- Bordas: `SINGLE`, opcional, `ADDITIVE`.
- Adicionais: `MULTIPLE`, opcional, `ADDITIVE`.

### Pizza doce

Pode usar:

- Grupo `Sabores doces`.
- Categoria visual `Doces`.
- Bordas doces dentro do grupo `Bordas`.

A regra de preco continua igual a pizza tradicional.

### Pizza especial

Pode ser modelada como produto proprio:

- `Pizza especial da casa`.
- `Pizza premium`.
- `Pizza promocional`.

Esse produto pode ter:

- Preco base.
- Grupo de tamanho.
- Grupo opcional de borda.
- Grupo opcional de adicionais.
- Nenhum grupo de sabores, se for uma pizza fechada.

### Bebidas

Modelagem simples:

- Produto com `pricingMode = FIXED`.
- `basePrice` preenchido.

Modelagem com opcoes:

- Produto `Refrigerante`.
- Grupo `Volume`.
- Opcoes `Lata`, `600ml`, `2L`.

### Hamburguerias futuras

Produto:

- X-Burger.
- X-Salada.
- Combo.

Grupos possiveis:

- Ponto da carne.
- Tipo de pao.
- Queijo.
- Molhos.
- Adicionais.
- Bebida do combo.

Configuracao:

- Ponto da carne: `SINGLE`, obrigatorio, `INCLUDED`.
- Queijo: `SINGLE`, opcional ou obrigatorio.
- Molhos: `MULTIPLE`, opcional.
- Adicionais: `MULTIPLE`, opcional, `ADDITIVE`.
- Bebida do combo: `SINGLE`, obrigatorio ou opcional.

## Precificacao

### Preco por tamanho

O tamanho vira uma `ModifierOption`.

Ha duas possibilidades:

- O tamanho substitui o preco base usando `REPLACE_BASE`.
- O tamanho participa de `ModifierOptionPrice` como opcao dependente.

Para pizzas, a segunda opcao e mais fiel ao sistema atual.

### Maior preco entre sabores

O grupo `Sabores` usa `ModifierPricingMode.HIGHEST_SELECTED`.

Exemplo:

- Calabresa grande: R$ 59,90.
- Portuguesa grande: R$ 64,90.
- Pedido meio a meio Calabresa + Portuguesa: R$ 64,90.

O motor de preco deve:

1. Identificar o grupo de sabores.
2. Buscar os precos contextuais conforme produto e tamanho.
3. Selecionar o maior preco entre os sabores escolhidos.

### Bordas

O grupo `Bordas` usa `ADDITIVE`.

Exemplo:

- Borda catupiry: + R$ 8,00.
- Borda cheddar: + R$ 9,00.

Se o preco da borda variar por tamanho, usar `ModifierOptionPrice` com `dependsOnOptionId` apontando para o tamanho.

### Adicionais

O grupo `Adicionais` usa `MULTIPLE` e `ADDITIVE`.

Exemplo:

- Bacon: + R$ 5,00.
- Queijo extra: + R$ 4,00.

Cada opcao selecionada soma ao item.

### Modificadores simples

Para escolhas sem impacto de preco, usar `INCLUDED`.

Exemplos:

- Sem cebola.
- Ponto da carne.
- Tipo de embalagem.
- Talher descartavel.

## Necessidade do ModifierOptionPrice

`ModifierOptionPrice` e recomendado e deve fazer parte da arquitetura final.

Motivo:

O sistema atual nao tem apenas preco fixo por opcao. O preco depende de contexto:

- Produto.
- Tamanho.
- Sabor.
- Borda.

Exemplo atual:

- Calabresa pequena tem um preco.
- Calabresa grande tem outro preco.
- Calabresa na pizza quadrada pode ter outro preco.
- Borda em tamanho pequeno pode custar diferente da borda em tamanho grande.

Um simples `ModifierOption.priceDelta` nao representa isso sem duplicar opcoes ou produtos.

Alternativa:

- Criar produtos separados para cada tamanho.
- Exemplo: `Pizza pequena`, `Pizza media`, `Pizza grande`.

Problema da alternativa:

- Duplica produtos.
- Dificulta a gestao do cardapio.
- Dificulta pizza redonda e quadrada.
- Dificulta matriz de precos por sabor.
- Deixa a experiencia do dashboard pior para pizzarias.

Conclusao:

`ModifierOptionPrice` e a melhor escolha para preservar o comportamento atual e abrir caminho para outros segmentos.

## Aprovação para Migration

Antes de implementar qualquer migration, devem ser aprovados:

- Nome final dos enums.
- Se `Product.price` sera mantido ou substituido por `basePrice`.
- Se `ProductType` continuara temporariamente.
- Se `CategoryType.PIZZA_FLAVOR_GROUP` continuara temporariamente.
- Se novos pedidos gravarao apenas `OrderItemModifier` ou gravacao dupla temporaria.
- Se `ModifierOptionPrice.dependsOnOptionId` e suficiente para todos os cenarios de preco contextual.
- Se o primeiro backfill sera apenas leitura/comparacao ou ja gravara os novos modificadores.

Nenhuma migration deve ser gerada antes dessa aprovacao.
