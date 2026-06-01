# Relatorio tecnico - Etapa 2: pizza-configurator-flow.tsx

Data: 01/06/2026

Projeto: Megas Food

Arquivo analisado:

```text
apps/web/components/public-menu/pizza-configurator-flow.tsx
```

Objetivo: propor uma divisao segura do configurador de pizza, reduzindo o arquivo para abaixo de 800 linhas sem alterar comportamento, calculos, payloads, textos, classes CSS ou regras de negocio.

Status: somente analise. Nenhuma refatoracao aplicada.

## Analise

O arquivo `pizza-configurator-flow.tsx` possui atualmente aproximadamente **817 linhas**.

Ele esta pouco acima da meta, mas concentra responsabilidades sensiveis do fluxo de configuracao de pizza.

Responsabilidades atuais:

- Declaracao de tipos locais:
  - produto;
  - tamanho;
  - sabor;
  - preco de sabor;
  - borda;
  - preco de borda;
  - adicional.
- Declaracao de tipos do fluxo:
  - `Step`;
  - `SelectionMode`;
  - `PizzaConfiguratorFlowProps`.
- Helpers puros:
  - `toNumber`;
  - `getFlavorLimitLabel`;
  - `getSizeFlavorDescription`;
  - `normalizeMaxFlavors`;
  - `formatMoney`.
- Componente visual reutilizado:
  - `OptionCard`.
- Controle de estado do fluxo:
  - etapa atual;
  - tamanho selecionado;
  - modo inteira/multiplos sabores;
  - primeiro sabor;
  - sabores extras;
  - borda selecionada;
  - adicionais selecionados;
  - observacao.
- Filtragem de tamanhos disponiveis.
- Filtragem de sabores disponiveis por tamanho.
- Busca de preco de sabor.
- Calculo do preco unitario pelo maior preco entre sabores.
- Calculo do preco da borda.
- Calculo do total de adicionais.
- Calculo do total final.
- Decisao da proxima etapa do fluxo.
- Controle de voltar etapa.
- Controle de selecao de sabores extras.
- Controle de selecao de adicionais.
- Montagem do payload do item do carrinho.
- Adicao da pizza ao carrinho.
- Exibicao da sugestao de bebida.
- Renderizacao completa do fluxo:
  - tamanho;
  - modo;
  - segundo sabor;
  - pergunta de borda;
  - selecao de borda;
  - pergunta de adicionais;
  - selecao de adicionais;
  - resumo;
  - sugestao de bebida;
  - footer de adicionar;
  - footer de bebida.

O maior risco desse arquivo e misturar:

- regra de fluxo;
- calculo de preco;
- payload de carrinho;
- JSX;
- estado local.

Por isso, a divisao deve comecar por tipos e helpers puros antes de mover qualquer JSX.

## Plano de divisao

### 1. `pizza-configurator.types.ts`

Responsabilidade:

Centralizar os tipos do configurador de pizza.

Tipos a mover:

- `Product`
- `PizzaSize`
- `PizzaFlavor`
- `FlavorPrice`
- `PizzaBorder`
- `BorderPrice`
- `AdditionalProduct`
- `Step`
- `SelectionMode`
- `PizzaConfiguratorFlowProps`

Impacto esperado:

- Nenhuma mudanca visual.
- Nenhuma mudanca de regra.
- Apenas mudanca de imports.

Risco: baixo.

### 2. `pizza-configurator-helpers.ts`

Responsabilidade:

Centralizar helpers puros usados pelo configurador.

Funcoes a mover:

- `toNumber`
- `getFlavorLimitLabel`
- `getSizeFlavorDescription`
- `normalizeMaxFlavors`
- `formatMoney`

Impacto esperado:

- Nenhuma mudanca de calculo.
- Nenhuma mudanca de formatacao esperada.
- Apenas mudanca de imports.

Risco: baixo.

### 3. `pizza-configurator-option-card.tsx`

Responsabilidade:

Isolar o componente visual `OptionCard`.

Codigo a mover:

- `OptionCard`

Dependencias:

- `Check` de `lucide-react`;
- `formatMoney` de `pizza-configurator-helpers`.

Impacto esperado:

- Nenhuma mudanca visual.
- Mesmo HTML.
- Mesmas classes.
- Mesmo comportamento de clique.

Risco: baixo a medio.

### 4. `pizza-configurator-price.ts`

Possivel etapa futura, nao recomendada como primeiro movimento.

Poderia centralizar:

- busca de preco de sabor;
- calculo do maior preco entre sabores;
- calculo de borda;
- soma de adicionais.

Risco: medio a alto, porque toca diretamente em calculo.

Recomendacao: nao fazer agora.

### 5. `pizza-configurator-summary.tsx`

Possivel etapa futura.

Poderia isolar o JSX do resumo do pedido.

Risco: medio, porque envolve exibicao de preco, borda, adicionais, sabores e observacao.

Recomendacao: avaliar apenas depois da 2A e 2B.

### 6. `pizza-configurator-steps.tsx`

Possivel etapa futura.

Poderia isolar blocos de etapas.

Risco: alto, porque envolve muitos handlers e transicoes de etapa.

Recomendacao: nao fazer agora.

## O que NAO sera alterado

Nao sera alterado:

- calculo de preco;
- regra de maior preco em pizzas com multiplos sabores;
- meio a meio;
- limite de sabores;
- `normalizeMaxFlavors` com limite maximo de 4;
- borda;
- preco de borda;
- adicionais;
- preco dos adicionais;
- sugestao de bebida;
- payload do carrinho;
- `addItem`;
- `crypto.randomUUID`;
- observacoes do item;
- fluxo inline/progressivo;
- textos;
- classes CSS;
- layout visual;
- regras de produto;
- regras de tamanho;
- comportamento do botao voltar;
- comportamento do botao fechar;
- `onItemAdded`;
- `onDrinkSuggestionShown`;
- `onViewDrinks`;
- `onOpenCart`.

## Subetapas seguras

### Etapa 2A - Tipos e helpers puros

Criar:

```text
apps/web/components/public-menu/pizza-configurator.types.ts
apps/web/components/public-menu/pizza-configurator-helpers.ts
```

Mover apenas:

- tipos;
- interfaces/type aliases;
- `toNumber`;
- `getFlavorLimitLabel`;
- `getSizeFlavorDescription`;
- `normalizeMaxFlavors`;
- `formatMoney`.

Nao mover:

- JSX;
- hooks;
- estado;
- handlers;
- carrinho;
- `OptionCard`;
- etapas visuais.

Estimativa:

- remove cerca de 120 a 150 linhas;
- arquivo principal deve cair de 817 para algo em torno de 670 a 700 linhas;
- deve ficar abaixo de 800 ja nessa subetapa.

Risco: baixo.

### Etapa 2B - Extrair OptionCard

Criar:

```text
apps/web/components/public-menu/pizza-configurator-option-card.tsx
```

Mover apenas:

- `OptionCard`.

Nao alterar:

- props;
- classes;
- visual;
- comportamento.

Estimativa:

- remove cerca de 40 linhas;
- arquivo principal pode ficar em torno de 630 a 660 linhas.

Risco: baixo a medio.

### Etapa 2C - Avaliar se precisa continuar

Depois da 2A e 2B, parar e validar.

Se ainda fizer sentido reduzir mais, discutir separadamente:

```text
pizza-configurator-summary.tsx
pizza-configurator-drink-suggestion.tsx
```

Recomendacao: nao extrair etapas inteiras automaticamente.

## Testes manuais recomendados

Apos aplicar cada subetapa, testar:

1. Abrir o cardapio publico.
2. Clicar em uma pizza.
3. Confirmar que o configurador abre.
4. Selecionar tamanho.
5. Confirmar textos:
   - `Inteira`;
   - `Meio a meio`;
   - `Ate 3 sabores`;
   - `Ate 4 sabores`.
6. Selecionar pizza inteira.
7. Selecionar meio a meio.
8. Selecionar 3 ou 4 sabores quando o tamanho permitir.
9. Confirmar que nao passa do limite de sabores.
10. Confirmar que o preco final usa o maior preco dos sabores.
11. Escolher borda.
12. Pular borda.
13. Escolher adicionais.
14. Pular adicionais.
15. Digitar observacao do item.
16. Adicionar ao carrinho.
17. Confirmar item no carrinho com:
    - tamanho;
    - sabores;
    - borda;
    - adicionais;
    - observacao;
    - preco.
18. Confirmar sugestao de bebida.
19. Clicar em `Sim, ver bebidas`.
20. Clicar em `Nao, ir para o carrinho`.

## Criterios de aceite

A etapa so deve ser considerada concluida se:

- `pizza-configurator-flow.tsx` ficar abaixo de 800 linhas;
- app compilar sem erro;
- imports estiverem corretos;
- comportamento visual permanecer igual;
- nenhum payload for alterado;
- nenhuma regra de negocio for alterada;
- nenhum calculo for alterado;
- TypeScript nao apresentar erros.

## Conclusao

O melhor caminho e executar primeiro a **Etapa 2A**, movendo somente tipos e helpers puros.

Essa subetapa deve ser suficiente para colocar o arquivo abaixo de 800 linhas com baixo risco.

Depois disso, a **Etapa 2B** pode extrair `OptionCard`, tambem com risco controlado.

Nao e recomendado extrair calculos de preco ou etapas inteiras nesta primeira passagem, porque isso aumentaria o risco de regressao no fluxo mais sensivel do cardapio publico.

