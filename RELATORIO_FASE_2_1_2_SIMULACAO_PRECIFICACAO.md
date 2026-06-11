# MEGAS FOOD - FASE 2.1.2

# SIMULACAO DE PRECIFICACAO COM A NOVA MODELAGEM

Este relatorio valida a arquitetura proposta na Fase 2.1.1 por meio de 10 cenarios reais de precificacao.

Importante:

- Este documento nao implementa codigo.
- Nenhuma migration foi criada.
- Nenhum arquivo de aplicacao foi alterado.
- Nenhuma alteracao foi feita no banco.
- O objetivo e validar conceitualmente a modelagem baseada em produtos e modificadores.

## Modelagem considerada

A simulacao usa a arquitetura baseada em:

- `Product`
- `ModifierGroup`
- `ModifierOption`
- `ProductModifierGroup`
- `ModifierOptionPrice`
- `OrderItemModifier`

## Regras gerais do motor de preco

O motor de preco deve seguir a seguinte ordem logica:

1. Carregar o `Product`.
2. Iniciar pelo `Product.basePrice`, quando aplicavel.
3. Carregar os `ModifierGroups` vinculados ao produto.
4. Validar `minSelections`, `maxSelections` e `isRequired`.
5. Calcular cada grupo conforme `ModifierPricingMode`.
6. Usar `ModifierOptionPrice` quando o preco depender de contexto.
7. Somar ou substituir valores conforme a regra do grupo.
8. Gerar snapshot em `OrderItem` e `OrderItemModifier`.

Modos de preco considerados:

- `INCLUDED`: nao altera o preco.
- `ADDITIVE`: soma ao preco do item.
- `REPLACE_BASE`: substitui o preco base.
- `HIGHEST_SELECTED`: usa o maior valor entre as opcoes selecionadas.

---

## Cenario 1 - Pizza inteira

Produto:

- `Product`: Pizza Redonda
- `pricingMode`: `FROM_MODIFIERS`
- `basePrice`: R$ 0,00

Grupos:

- Tamanho
- Sabores

Selecao do cliente:

- Tamanho: Grande
- Sabor: Calabresa

Precos contextuais:

- Grande + Calabresa: R$ 59,90

Passo a passo:

```text
Base do produto: R$ 0,00
Grupo Tamanho: Grande selecionado
Grupo Sabores: Calabresa selecionado
Modo do grupo Sabores: HIGHEST_SELECTED
Preco encontrado em ModifierOptionPrice: R$ 59,90

Total unitario: R$ 59,90
```

Resultado:

```text
Pizza Redonda
- Tamanho: Grande
- Sabor: Calabresa
Total: R$ 59,90
```

Validacao:

- A arquitetura atende pizza inteira sem depender de `PizzaSize` ou `PizzaFlavor` no fluxo novo.

---

## Cenario 2 - Pizza meio a meio

Produto:

- `Product`: Pizza Redonda
- `pricingMode`: `FROM_MODIFIERS`

Selecao do cliente:

- Tamanho: Grande
- Sabores: Calabresa e Portuguesa

Precos contextuais:

- Grande + Calabresa: R$ 59,90
- Grande + Portuguesa: R$ 64,90

Passo a passo:

```text
Base do produto: R$ 0,00
Tamanho selecionado: Grande
Sabores selecionados: Calabresa, Portuguesa
Modo do grupo Sabores: HIGHEST_SELECTED

Calabresa: R$ 59,90
Portuguesa: R$ 64,90

Maior preco encontrado: R$ 64,90

Total unitario: R$ 64,90
```

Resultado:

```text
Pizza Meio a Meio
- Tamanho: Grande
- Sabores: Calabresa / Portuguesa
Total: R$ 64,90
```

Validacao:

- Meio a meio e apenas uma selecao multipla dentro do grupo `Sabores`.
- A regra do maior preco fica em `ModifierPricingMode.HIGHEST_SELECTED`.

---

## Cenario 3 - Pizza com 3 sabores

Produto:

- `Product`: Pizza Redonda

Selecao do cliente:

- Tamanho: Familia
- Sabores: Frango, Portuguesa, Quatro Queijos

Configuracao do grupo:

- `ModifierGroup`: Sabores
- `selectionType`: `MULTIPLE`
- `minSelections`: 1
- `maxSelections`: 4
- `pricingMode`: `HIGHEST_SELECTED`

Precos contextuais:

- Familia + Frango: R$ 72,90
- Familia + Portuguesa: R$ 79,90
- Familia + Quatro Queijos: R$ 84,90

Passo a passo:

```text
Base do produto: R$ 0,00
Tamanho selecionado: Familia
Quantidade de sabores: 3
Limite permitido: ate 4

Frango: R$ 72,90
Portuguesa: R$ 79,90
Quatro Queijos: R$ 84,90

Maior preco encontrado: R$ 84,90

Total unitario: R$ 84,90
```

Resultado:

```text
Pizza 3 Sabores
- Frango
- Portuguesa
- Quatro Queijos
Total: R$ 84,90
```

Validacao:

- A arquitetura suporta 3 sabores sem nova tabela.
- O limite fica configurado no proprio grupo.

---

## Cenario 4 - Pizza com 4 sabores

Produto:

- `Product`: Pizza Redonda

Selecao do cliente:

- Tamanho: Familia
- Sabores: Calabresa, Frango, Portuguesa, Camarao

Precos contextuais:

- Familia + Calabresa: R$ 72,90
- Familia + Frango: R$ 72,90
- Familia + Portuguesa: R$ 79,90
- Familia + Camarao: R$ 96,90

Passo a passo:

```text
Base do produto: R$ 0,00
Tamanho selecionado: Familia
Quantidade de sabores: 4
Limite permitido no grupo: 4

Calabresa: R$ 72,90
Frango: R$ 72,90
Portuguesa: R$ 79,90
Camarao: R$ 96,90

Maior preco encontrado: R$ 96,90

Total unitario: R$ 96,90
```

Resultado:

```text
Pizza 4 Sabores
- Calabresa
- Frango
- Portuguesa
- Camarao
Total: R$ 96,90
```

Validacao:

- A arquitetura suporta pizza com 4 sabores.
- A regra continua sendo de maior preco entre os sabores selecionados.

---

## Cenario 5 - Pizza com borda

Produto:

- `Product`: Pizza Redonda

Selecao do cliente:

- Tamanho: Grande
- Sabor: Calabresa
- Borda: Catupiry

Grupos:

- Sabores: `HIGHEST_SELECTED`
- Bordas: `ADDITIVE`

Precos:

- Grande + Calabresa: R$ 59,90
- Borda Catupiry: R$ 8,00

Passo a passo:

```text
Base do produto: R$ 0,00
Preco calculado pelo grupo Sabores: R$ 59,90
Borda selecionada: Catupiry
Modo do grupo Bordas: ADDITIVE
Valor da borda: + R$ 8,00

Total unitario: R$ 67,90
```

Resultado:

```text
Pizza Grande Calabresa
- Borda: Catupiry
Total: R$ 67,90
```

Validacao:

- Bordas entram como modificadores opcionais.
- Se a borda variar por tamanho, `ModifierOptionPrice` cobre o caso usando `dependsOnOptionId`.

---

## Cenario 6 - Pizza com adicionais

Produto:

- `Product`: Pizza Redonda

Selecao do cliente:

- Tamanho: Grande
- Sabor: Frango com Catupiry
- Adicionais: Bacon e Queijo extra

Grupos:

- Sabores: `HIGHEST_SELECTED`
- Adicionais: `MULTIPLE` + `ADDITIVE`

Precos:

- Grande + Frango com Catupiry: R$ 62,90
- Bacon: R$ 5,00
- Queijo extra: R$ 4,00

Passo a passo:

```text
Base do produto: R$ 0,00
Preco do sabor: R$ 62,90

Adicional Bacon: + R$ 5,00
Adicional Queijo extra: + R$ 4,00

Total de adicionais: R$ 9,00

Total unitario: R$ 71,90
```

Resultado:

```text
Pizza Grande Frango com Catupiry
- Bacon
- Queijo extra
Total: R$ 71,90
```

Validacao:

- Adicionais deixam de ser produtos avulsos no pedido e passam a ser opcoes de modificador.
- O snapshot fica em `OrderItemModifier`.

---

## Cenario 7 - Pizza doce

Produto:

- `Product`: Pizza Redonda

Selecao do cliente:

- Tamanho: Media
- Sabor doce: Chocolate com Morango
- Borda: Chocolate

Grupos:

- Sabores Doces: `HIGHEST_SELECTED`
- Bordas: `ADDITIVE`

Precos:

- Media + Chocolate com Morango: R$ 58,90
- Borda Chocolate: R$ 10,00

Passo a passo:

```text
Base do produto: R$ 0,00
Tamanho selecionado: Media
Sabor doce selecionado: Chocolate com Morango
Preco contextual do sabor doce: R$ 58,90
Borda chocolate: + R$ 10,00

Total unitario: R$ 68,90
```

Resultado:

```text
Pizza Doce Media
- Chocolate com Morango
- Borda Chocolate
Total: R$ 68,90
```

Validacao:

- Pizza doce nao exige tabela propria.
- Pode ser apenas outro grupo de sabores ou outra categoria visual.

---

## Cenario 8 - Bebida

Produto:

- `Product`: Coca-Cola 2L
- `pricingMode`: `FIXED`
- `basePrice`: R$ 14,00

Selecao do cliente:

- Nenhum modificador.

Passo a passo:

```text
Base do produto: R$ 14,00
Nenhum grupo obrigatorio
Nenhum adicional

Total unitario: R$ 14,00
```

Resultado:

```text
Coca-Cola 2L
Total: R$ 14,00
```

Validacao:

- Bebida simples continua simples.
- Nao precisa passar por tamanho, sabor ou borda.

---

## Cenario 9 - Hamburguer

Produto:

- `Product`: X-Burger
- `pricingMode`: `FIXED`
- `basePrice`: R$ 24,90

Selecao do cliente:

- Ponto da carne: Ao ponto
- Queijo: Cheddar
- Adicionais: Bacon e Ovo
- Molho: Barbecue

Grupos:

- Ponto da carne: `SINGLE` + `INCLUDED`
- Queijo: `SINGLE` + `ADDITIVE`
- Adicionais: `MULTIPLE` + `ADDITIVE`
- Molhos: `MULTIPLE` + `INCLUDED`

Precos:

- Base: R$ 24,90
- Ponto da carne: R$ 0,00
- Cheddar: R$ 3,00
- Bacon: R$ 5,00
- Ovo: R$ 3,00
- Barbecue: R$ 0,00

Passo a passo:

```text
Base do produto: R$ 24,90
Ponto da carne INCLUDED: + R$ 0,00
Cheddar ADDITIVE: + R$ 3,00
Bacon ADDITIVE: + R$ 5,00
Ovo ADDITIVE: + R$ 3,00
Molho Barbecue INCLUDED: + R$ 0,00

Total unitario: R$ 35,90
```

Resultado:

```text
X-Burger
- Ao ponto
- Cheddar
- Bacon
- Ovo
- Barbecue
Total: R$ 35,90
```

Validacao:

- A mesma modelagem atende hamburgueria.
- Nao sao necessarias tabelas especificas como `BurgerSauce`, `BurgerPoint` ou `BurgerAdditional`.

---

## Cenario 10 - Combo

Produto:

- `Product`: Combo Burger
- `pricingMode`: `FIXED`
- `basePrice`: R$ 39,90

Selecao do cliente:

- Bebida: Coca-Cola lata
- Upgrade de batata: Batata grande
- Molho extra

Grupos:

- Bebida do combo: `SINGLE` + `INCLUDED`
- Upgrade de batata: `SINGLE` + `ADDITIVE`
- Extras: `MULTIPLE` + `ADDITIVE`

Precos:

- Base: R$ 39,90
- Coca-Cola lata: R$ 0,00
- Batata grande: R$ 4,00
- Molho extra: R$ 2,00

Passo a passo:

```text
Base do produto: R$ 39,90
Bebida do combo INCLUDED: + R$ 0,00
Upgrade Batata Grande ADDITIVE: + R$ 4,00
Molho extra ADDITIVE: + R$ 2,00

Total unitario: R$ 45,90
```

Resultado:

```text
Combo Burger
- Bebida: Coca-Cola lata
- Batata grande
- Molho extra
Total: R$ 45,90
```

Validacao:

- Combo pode ser modelado como produto com grupos de modificadores.
- Nao e obrigatorio criar tabela propria de combos na primeira versao.

---

# Validacao final da arquitetura

A simulacao valida que a modelagem proposta cobre:

- Pizza inteira.
- Pizza meio a meio.
- Pizza com 3 sabores.
- Pizza com 4 sabores.
- Pizza com borda.
- Pizza com adicionais.
- Pizza doce.
- Bebida simples.
- Hamburguer.
- Combo.

## Papel do ModifierOptionPrice

`ModifierOptionPrice` se mostrou necessario para preservar a regra atual de pizzarias.

Sem ele, seria dificil representar corretamente:

- Preco de sabor por tamanho.
- Preco de sabor por produto.
- Preco de borda por tamanho.
- Precos diferentes entre pizza redonda e quadrada.

Exemplo que exige preco contextual:

```text
Produto: Pizza Redonda
Tamanho: Grande
Sabor: Portuguesa
Preco: R$ 64,90
```

Esse preco nao pertence somente ao sabor `Portuguesa`, porque o mesmo sabor pode ter outro valor em outro tamanho ou produto.

## Conclusao

A arquitetura proposta esta validada conceitualmente para seguir para a proxima etapa.

Recomendacao:

- Manter `ModifierOptionPrice`.
- Manter compatibilidade com tabelas antigas durante a migracao.
- Implementar primeiro o motor de preco generico em paralelo ao motor atual.
- Comparar resultados entre motor antigo e novo antes de migrar pedidos reais.

Esta etapa nao aprova automaticamente a criacao de migration. A migration deve ser autorizada em etapa propria.
