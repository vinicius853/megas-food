# MEGAS FOOD - FASE 2.1.4

# DECISAO PRODUCTMODIFIEROPTION

Este relatorio valida se a entidade `ProductModifierOption` deve entrar na primeira migration da Fase 2.

Importante:

- Nenhum codigo foi implementado.
- Nenhuma migration foi criada.
- Nenhum arquivo de schema real foi alterado.
- Nenhuma alteracao foi feita no banco.

## Necessario?

SIM.

`ProductModifierOption` deve fazer parte da arquitetura da Fase 2.

## Motivos

`ProductModifierGroup` controla quais grupos de modificadores pertencem a um produto.

Exemplo:

```text
Produto: Pizza salgada
Grupo: Bordas
```

Mas ele nao controla quais opcoes desse grupo estao disponiveis para aquele produto.

Exemplo do problema:

```text
Grupo Bordas:
- Catupiry
- Cheddar
- Chocolate
- Nutella
```

Pizza salgada deve permitir:

```text
Catupiry
Cheddar
```

Pizza doce deve permitir:

```text
Chocolate
Nutella
```

Sem `ProductModifierOption`, o sistema teria apenas tres alternativas ruins:

1. Criar grupos duplicados, como `Bordas salgadas` e `Bordas doces`.
2. Mostrar opcoes indevidas no cardapio e bloquear por codigo.
3. Criar regras condicionais espalhadas pelo dashboard, cardapio publico e motor de preco.

`ProductModifierOption` resolve problemas concretos:

- Permite ativar ou inativar uma opcao por produto.
- Permite limitar opcoes dentro de um grupo compartilhado.
- Permite ordenar opcoes por produto.
- Permite sobrescrever preco simples por produto, se necessario.
- Evita duplicacao de grupos.
- Reduz regra hardcoded no codigo.
- Facilita manutencao do cardapio em varios segmentos.

## Impacto na pizzaria

Impacto positivo e relevante.

Casos reais:

```text
Pizza salgada:
- Catupiry permitido
- Cheddar permitido
- Chocolate bloqueado
- Nutella bloqueado
```

```text
Pizza doce:
- Catupiry bloqueado
- Cheddar bloqueado
- Chocolate permitido
- Nutella permitido
```

Outros exemplos:

- Pizza promocional pode nao aceitar borda.
- Pizza premium pode aceitar apenas algumas bordas.
- Pizza doce pode aceitar apenas adicionais doces.
- Pizza salgada pode bloquear ingredientes doces.

Sem `ProductModifierOption`, a pizzaria tenderia a acumular grupos duplicados e regras manuais.

## Impacto na hamburgueria

Impacto positivo.

Exemplo:

```text
Grupo Adicionais:
- Bacon
- Ovo
- Queijo extra
- Hamburguer extra
- Banana
- Chocolate
```

Produtos diferentes podem permitir opcoes diferentes:

```text
X-Burger:
- Bacon
- Ovo
- Queijo extra
- Hamburguer extra
```

```text
Burger vegetariano:
- Ovo
- Queijo extra
- Molhos
- Sem bacon
```

```text
Combo infantil:
- Poucos adicionais
- Sem itens premium
```

Sem `ProductModifierOption`, hamburgueria tambem teria que duplicar grupos ou depender de condicoes no codigo.

## Entrar agora ou depois?

Deve entrar agora, na primeira migration da Fase 2.

Adicionar depois teria custo maior porque exigiria:

- Nova migration estrutural.
- Refatoracao do dashboard.
- Refatoracao do motor de preco.
- Refatoracao do cardapio publico.
- Backfill dos vinculos produto/opcao.
- Limpeza de grupos duplicados que provavelmente seriam criados antes.

Mesmo que o primeiro uso seja simples, a entidade cria a base correta desde o inicio.

## Decisao recomendada

Incluir `ProductModifierOption` na primeira migration da Fase 2.

Parecer:

```text
ProductModifierOption: aprovado para entrar no schema inicial da Fase 2.
Migration imediata: ainda depende da aprovacao geral do schema final.
```

Conclusao:

`ProductModifierOption` adiciona uma pequena complexidade ao schema, mas reduz bastante a complexidade operacional do dashboard, evita duplicacao de grupos, melhora a manutencao e torna a arquitetura mais sustentavel para pizzarias, hamburguerias e segmentos futuros.
