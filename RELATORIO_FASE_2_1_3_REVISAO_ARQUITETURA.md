# MEGAS FOOD - FASE 2.1.3

# REVISAO DE ARQUITETURA

Este relatorio faz uma revisao critica da arquitetura proposta para a Fase 2 do Megas Food.

Escopo:

- Avaliar a modelagem baseada em produtos e modificadores.
- Identificar problemas de modelagem.
- Identificar gargalos de performance.
- Identificar riscos de manutencao futura.
- Identificar riscos para multi-tenant.
- Avaliar se a arquitetura atende pizzarias, hamburguerias e segmentos futuros.

Importante:

- Nenhum codigo foi implementado.
- Nenhuma migration foi criada.
- Nenhum arquivo de schema real foi alterado.
- Nenhuma alteracao foi feita no banco.

## Pontos fortes

### 1. Direcao arquitetural correta

A substituicao gradual da modelagem especifica de pizzaria por uma arquitetura baseada em produtos e modificadores e a decisao correta para um SaaS multi-segmento.

A estrutura proposta evita a criacao futura de tabelas especificas como:

- `BurgerSauce`
- `BurgerPoint`
- `DrinkSize`
- `ComboOption`
- `PizzaSweetFlavor`

Em vez disso, o sistema passa a usar:

- `Product`
- `ModifierGroup`
- `ModifierOption`
- `ProductModifierGroup`
- `ModifierOptionPrice`
- `OrderItemModifier`

### 2. Separacao saudavel entre grupo e opcao

`ModifierGroup` representa a regra de escolha.

Exemplos:

- Tamanho.
- Sabores.
- Bordas.
- Adicionais.
- Molhos.
- Ponto da carne.
- Bebida do combo.

`ModifierOption` representa a escolha concreta.

Exemplos:

- Grande.
- Calabresa.
- Catupiry.
- Bacon.
- Barbecue.
- Ao ponto.
- Coca-Cola lata.

Essa separacao e essencial para permitir reaproveitamento e configuracao dinamica.

### 3. ProductModifierGroup e necessario

`ProductModifierGroup` resolve corretamente o vinculo entre produto e grupo.

Isso permite que:

- Um grupo de bordas seja usado em varias pizzas.
- Um grupo de adicionais seja usado em pizzas e hamburgueres.
- Um grupo de bebidas seja usado em varios combos.
- Um produto tenha regras especificas de obrigatoriedade ou limite.

### 4. OrderItemModifier e essencial

`OrderItemModifier` e indispensavel porque pedido precisa ser historico.

O pedido nao pode depender do cardapio atual para exibir o que foi vendido no passado.

O snapshot deve guardar:

- Nome do grupo.
- Nome da opcao.
- Quantidade.
- Valor aplicado.
- Total aplicado.

Essa decisao protege:

- Impressao.
- WhatsApp.
- Historico de pedidos.
- Auditoria operacional.

### 5. ModifierOptionPrice resolve regra real de pizzaria

`ModifierOptionPrice` resolve um problema concreto do modelo atual:

- Preco do sabor depende do produto.
- Preco do sabor depende do tamanho.
- Preco da borda pode depender do tamanho.
- Pizza redonda e pizza quadrada podem ter precos diferentes.

Sem uma tabela de preco contextual, o sistema teria que duplicar produtos ou opcoes.

### 6. Arquitetura atende hamburgueria conceitualmente

Hamburgueria pode ser modelada com os mesmos blocos:

- Produto: X-Burger.
- Grupo: Ponto da carne.
- Grupo: Queijo.
- Grupo: Molhos.
- Grupo: Adicionais.
- Grupo: Bebida do combo.

Nao ha necessidade de novas tabelas especificas para hamburgueria.

## Problemas encontrados

### 1. ModifierOptionPrice com apenas uma dependencia pode ser limitado

O campo `dependsOnOptionId` resolve bem cenarios simples:

```text
Sabor depende do tamanho.
Borda depende do tamanho.
```

Mas pode ser insuficiente para cenarios com mais de uma dependencia.

Exemplo:

```text
Produto: Pizza
Tamanho: Grande
Massa: Sem gluten
Sabor: Camarao
```

Nesse caso, o preco do sabor poderia depender de:

- Produto.
- Tamanho.
- Tipo de massa.
- Sabor.

Com apenas um `dependsOnOptionId`, a regra nao representa uma combinacao composta.

Impacto:

- Baixo no curto prazo.
- Medio no medio prazo.
- Alto se o sistema vender produtos com precos altamente condicionais.

### 2. ProductModifierGroup controla o grupo, mas nao controla opcoes por produto

`ProductModifierGroup` vincula um grupo inteiro a um produto.

Problema:

Se o grupo `Adicionais` tiver 30 opcoes, todos os produtos vinculados ao grupo receberiam potencialmente as 30 opcoes.

Exemplos de necessidade real:

- Bacon disponivel para hamburguer, mas nao para pizza doce.
- Borda chocolate disponivel para pizza doce, mas nao para pizza salgada.
- Molho barbecue disponivel para hamburguer, mas nao para bebida.
- Adicional camarao disponivel apenas em pizzas premium.

Sem uma entidade de controle por opcao/produto, isso teria que ser resolvido criando grupos duplicados.

Risco:

- Duplicacao de grupos.
- Dashboard mais dificil de manter.
- Cardapios inconsistentes entre produtos.

### 3. ProductPricingMode pode gerar inconsistencia

`ProductPricingMode` ajuda a expressar intencao:

- `FIXED`
- `FROM_MODIFIERS`

Mas tambem pode criar combinacoes invalidas:

```text
Produto FIXED com grupo obrigatorio que altera preco.
Produto FROM_MODIFIERS sem nenhum grupo precificavel.
Produto com basePrice e grupo REPLACE_BASE conflitante.
```

O motor de preco precisara validar essas inconsistencias.

Alternativa:

- Remover `ProductPricingMode` e inferir pelo produto e grupos.
- Ou manter o campo, mas criar validacoes fortes.

### 4. Ambiguidade entre priceDelta e ModifierOptionPrice

`ModifierOption.priceDelta` e `ModifierOptionPrice.price` podem conflitar.

Exemplo:

```text
Opcao Bacon tem priceDelta R$ 5,00.
ModifierOptionPrice para Bacon no X-Burger diz R$ 6,00.
```

O motor precisa ter regra clara:

```text
Se existir preco contextual aplicavel, ele prevalece.
Caso contrario, usa priceDelta.
```

Sem essa regra, dashboard, cardapio publico e pedido podem calcular valores diferentes.

### 5. Product.type legado pode contaminar a nova arquitetura

Manter `Product.type` e necessario na migracao, mas perigoso no longo prazo.

Risco:

- O sistema continuar perguntando se produto e `PIZZA_ROUND` ou `PIZZA_SQUARE`.
- Novos segmentos exigirem novos valores no enum.
- A arquitetura generica virar apenas uma camada em cima do modelo antigo.

Recomendacao:

- Durante a migracao, manter `Product.type`.
- No fluxo novo, nao usar `Product.type` para regra de preco.
- Futuramente substituir por classificacao mais generica ou templates de produto.

### 6. Falta uma entidade para templates ou segmentos

Para SaaS multi-segmento, pode ser util ter uma camada de template.

Exemplos:

- Template Pizzaria.
- Template Hamburgueria.
- Template Acai.
- Template Pastelaria.

Sem isso, cada tenant precisara configurar tudo do zero ou o sistema dependera de scripts rigidos.

Essa entidade nao precisa entrar obrigatoriamente na primeira migration, mas deve estar prevista no roadmap.

### 7. Falta politica clara para inativacao versus delecao

Em SaaS com pedidos historicos, dados de cardapio raramente devem ser deletados fisicamente.

Risco:

- Deletar opcao usada em pedidos antigos.
- Quebrar relatorios.
- Perder contexto historico.

Recomendacao:

- Usar `isActive`.
- Evitar `deleteMany` destrutivo.
- Tratar exclusao no dashboard como inativacao.

## Riscos futuros

### 1. Risco de performance no cardapio publico

Com poucos tenants, a arquitetura funciona bem.

Com 100 ou 500 tenants, o endpoint publico pode ficar pesado se fizer:

- Uma query por produto.
- Uma query por grupo.
- Uma query por opcao.
- Uma query por preco.

O cardapio publico v2 deve carregar dados em lote.

Formato recomendado:

```text
products[]
  modifierGroups[]
    options[]
      prices[]
```

Evitar listas soltas demais tambem reduz trabalho no frontend.

### 2. Risco de payload grande

Pizzarias com muitos sabores podem gerar payload grande.

Exemplo:

- 2 produtos de pizza.
- 5 tamanhos.
- 80 sabores.
- 10 bordas.
- Muitos precos contextuais.

Isso pode gerar centenas ou milhares de linhas em `ModifierOptionPrice`.

Mitigacoes:

- Cache por tenant e versao de cardapio.
- ETag ou controle de `updatedAt`.
- Carregamento seletivo por produto, se necessario.
- Indices corretos em `tenantId`, `productId` e `modifierOptionId`.

### 3. Risco multi-tenant

Todas as tabelas novas incluem `tenantId`, o que e correto.

Mas apenas ter `tenantId` nao impede erro de associacao cruzada.

Exemplo de erro:

```text
Product do tenant A
ModifierOption do tenant B
ModifierOptionPrice criado juntando os dois
```

O banco pode permitir isso se as FKs forem apenas por `id`.

Mitigacao:

- Validar tenant na aplicacao em toda escrita.
- Considerar constraints compostas quando viavel.
- Criar testes de isolamento multi-tenant.

### 4. Risco de dashboard generico demais

Um dashboard 100% generico pode ficar ruim para o usuario.

Pizzaria precisa de:

- Matriz de precos.
- Tamanhos.
- Sabores.
- Bordas.

Hamburgueria precisa de:

- Adicionais.
- Molhos.
- Ponto da carne.
- Combos.

Recomendacao:

- Motor generico por baixo.
- Experiencia guiada por segmento por cima.

### 5. Risco de retrabalho em 6 meses

As principais decisoes que podem gerar retrabalho:

- Nao ter controle de opcoes por produto.
- Usar `Product.type` para regra nova.
- Nao definir precedencia entre `priceDelta` e preco contextual.
- Nao isolar o motor de preco em servico proprio.
- Nao criar snapshot completo em `OrderItemModifier`.
- Criar dashboard acoplado novamente a pizzaria.

## Escalabilidade

### Com 10 pizzarias

A arquitetura suporta sem preocupacao relevante.

Principais cuidados:

- Validar regra de preco.
- Garantir compatibilidade com pedidos antigos.
- Evitar regressao no cardapio publico.

### Com 100 pizzarias

A arquitetura continua saudavel, desde que:

- Queries sejam feitas em lote.
- Todas as consultas filtrem por `tenantId`.
- Indices sejam aplicados corretamente.
- O endpoint publico tenha resposta agregada.

### Com 500 pizzarias

A arquitetura ainda e viavel, mas exigira disciplina operacional:

- Cache de cardapio.
- Evitar N+1 queries.
- Evitar deletes fisicos.
- Monitorar tempo de resposta do cardapio publico.
- Monitorar crescimento de `ModifierOptionPrice`.
- Criar testes de carga para tenants com muitos sabores e precos.

## Suporte a hamburgueria

A arquitetura suporta hamburgueria sem adaptacoes estruturais, desde que o dashboard permita criar grupos livremente.

Exemplo:

Produto:

- X-Burger.

Grupos:

- Ponto da carne.
- Tipo de pao.
- Queijo.
- Molhos.
- Adicionais.

Produto:

- Combo Burger.

Grupos:

- Bebida do combo.
- Acompanhamento.
- Upgrade de batata.
- Extras.

Nao e necessario criar novas entidades para hamburgueria.

O risco esta mais na experiencia administrativa do que no banco.

## Melhorias recomendadas

### 1. Adicionar ProductModifierOption

Entidade recomendada:

```prisma
model ProductModifierOption {
  id String @id @default(uuid())

  tenantId String
  productId String
  modifierGroupId String
  modifierOptionId String

  isActive Boolean @default(true)
  sortOrder Int @default(0)
  priceDeltaOverride Decimal? @db.Decimal(10, 2)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, productId, modifierOptionId])
  @@index([tenantId, productId, modifierGroupId])
}
```

Beneficios:

- Controla quais opcoes aparecem em cada produto.
- Evita duplicar grupos.
- Permite inativar opcao apenas em um produto.
- Permite ordenacao por produto.
- Permite sobrescrever preco simples por produto.

### 2. Considerar renomear ModifierOptionPrice

`ModifierOptionPrice` funciona, mas o nome pode ser limitado.

Alternativa:

```text
ModifierPriceRule
```

Esse nome comunica melhor que a tabela representa uma regra contextual de preco, nao apenas um preco simples.

Campos possiveis:

- `productId`
- `targetOptionId`
- `contextOptionId`
- `price`
- `pricingMode`

### 3. Definir regra de precedencia de preco

Regra recomendada:

```text
1. Se houver regra contextual aplicavel, usa ModifierOptionPrice.
2. Se houver override por ProductModifierOption, usa override.
3. Caso contrario, usa ModifierOption.priceDelta.
4. Se nada existir, valor zero.
```

A ordem exata precisa ser aprovada antes da migration.

### 4. Fortalecer OrderItemModifier

Recomendacao para snapshot:

- `groupName`
- `groupCode`
- `optionName`
- `optionCode`
- `pricingMode`
- `quantity`
- `unitPriceDelta`
- `totalDelta`
- `sortOrder`

Isso melhora:

- Impressao.
- WhatsApp.
- Historico.
- Relatorios.

### 5. Isolar motor de preco

O motor de preco deve ser um servico proprio.

Entrada:

```text
tenantId
productId
quantity
selectedModifiers[]
```

Saida:

```text
unitPrice
total
appliedModifiers[]
validationErrors[]
```

O motor nao deve ficar espalhado entre controller, public orders e checkout.

### 6. Planejar templates por segmento

Nao precisa entrar na primeira migration, mas deve ser considerado.

Exemplos:

- Template de pizzaria.
- Template de hamburgueria.
- Template de acai.
- Template de pastelaria.

Isso reduz setup manual e melhora onboarding.

## Aprovacao para Migration

Conclusao rigorosa:

A arquitetura esta aprovada conceitualmente, mas ainda nao esta pronta para migration.

Antes de gerar migration, devem ser decididos:

1. Se `ProductModifierOption` entra no schema inicial.
2. Se `ModifierOptionPrice` mantem esse nome ou vira `ModifierPriceRule`.
3. Qual a precedencia entre `priceDelta`, override e preco contextual.
4. Como sera garantido isolamento multi-tenant nas escritas.
5. Se `ProductPricingMode` sera mantido ou inferido.
6. Qual sera o formato final do cardapio publico v2.
7. Qual sera o snapshot final de `OrderItemModifier`.
8. Se delecao fisica sera proibida nos novos cadastros de cardapio.

Parecer:

```text
Arquitetura base: aprovada.
Migration imediata: nao aprovada.
Necessita refinamento antes da Fase 2.2.
```

Principal ajuste recomendado antes da migration:

- Incluir controle de opcoes por produto, provavelmente via `ProductModifierOption`.

Esse ajuste reduz risco de duplicacao, melhora a experiencia do dashboard e evita retrabalho em poucos meses.
