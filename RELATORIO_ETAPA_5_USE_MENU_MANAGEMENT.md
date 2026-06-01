# Relatorio tecnico - Etapa 5: use-menu-management.ts

## Arquivo analisado

`apps/web/app/dashboard/cardapio/hooks/use-menu-management.ts`

## Objetivo

Entender como o hook esta organizado hoje e propor uma divisao segura.

Este arquivo e um dos principais candidatos para preparacao antes da futura arquitetura generica baseada em:

- `Products`
- `ModifierGroups`
- `ModifierOptions`

Importante: este relatorio nao inicia a arquitetura generica.

## Tamanho atual

O arquivo possui aproximadamente `1050` linhas.

## Responsabilidades atuais

O hook funciona como o cerebro do dashboard de cardapio.

Ele concentra:

### Estado de navegacao

- `activeTab`
- `pizzaMode`
- `search`

### Estado de dados principais

- `categories`
- `products`
- `sizes`
- `flavors`
- `flavorPrices`
- `borders`
- `borderPrices`

### Estado operacional

- `loading`
- `saving`
- `error`
- `success`

### Controle de autosave

- `autoSaveTimerRef`
- `hasLoadedMenuRef`
- `skipNextAutoSaveRef`

### Constantes

- `pizzaModes`
- `fixedProductSectionSlugs`

### Helpers locais

- `temporaryId`
- `generateSlug`
- `getErrorMessage`
- `normalizeCategory`
- `ensureFixedProductSection`
- `ensurePizzaProduct`
- `ensureBaseData`

### Carregamento de dados

- `loadMenu`
- `applyMenuData`
- chamada `GET /menu-management`

### Derivacoes e mapeamentos

- produto de pizza redonda;
- produto de pizza quadrada;
- secoes de produto;
- secoes customizadas;
- secao de produto selecionada;
- produtos da secao selecionada;
- grupos de sabores de pizza;
- bebidas;
- adicionais;
- tamanhos visiveis;
- tamanhos com borda;
- tamanhos redondos;
- tamanhos quadrados;
- sabores filtrados por busca.

### Sabores

- adicionar sabor;
- remover sabor;
- atualizar nome;
- atualizar descricao;
- atualizar imagem;
- atualizar categoria;
- criar precos iniciais para novos sabores.

### Tamanhos

- adicionar tamanho redondo;
- adicionar tamanho quadrado;
- limitar ate 4 tamanhos por modelo;
- remover tamanho;
- remover precos vinculados ao tamanho;
- remover precos de borda vinculados ao tamanho.

### Precos

- atualizar preco de sabor por produto/tamanho;
- criar preco caso ainda nao exista.

### Produtos

- adicionar bebida;
- adicionar produto extra;
- atualizar produto;
- remover produto.

### Categorias

- adicionar categoria;
- atualizar categoria;
- gerar slug automaticamente ao editar nome;
- remover categoria;
- remover produtos vinculados;
- limpar tamanhos ligados a produtos removidos;
- limpar precos ligados a produtos removidos;
- limpar precos de borda ligados a produtos removidos;
- desvincular sabores de grupos removidos.

### Bordas

- adicionar borda;
- criar precos de borda para tamanhos que aceitam borda;
- atualizar nome da borda;
- atualizar preco da borda;
- remover borda;
- remover precos vinculados.

### Payload

- `buildPayload`
- normalizacao de categorias;
- garantia dos dados base;
- conversao de preco com `parseMoney`;
- conversao de maximo de sabores com `parsePositiveInteger`;
- montagem de:
  - `categories`
  - `products`
  - `pizzaSizes`
  - `pizzaFlavors`
  - `flavorPrices`
  - `pizzaBorders`
  - `borderPrices`

### Salvamento

- `saveMenu`
- chamada `PUT /menu-management`
- aplicacao da resposta;
- mensagens de sucesso;
- mensagens de erro.

### Autosave

- debounce de 900ms;
- ignora primeira aplicacao de dados;
- evita salvar logo apos `applyMenuData`;
- salva quando qualquer colecao principal muda.

### Acao auxiliar

- `openPublicMenu`

## Mistura de responsabilidades

O arquivo mistura varias camadas.

### Estado

Todos os estados da tela ficam no mesmo hook.

### API

As chamadas `GET /menu-management` e `PUT /menu-management` estao no mesmo arquivo que manipula estado e regras locais.

### Payloads

`buildPayload` esta no hook principal e define exatamente o contrato enviado ao backend.

### Normalizacao

Funcoes como `normalizeCategory`, `ensureBaseData`, `ensurePizzaProduct` e `ensureFixedProductSection` ficam misturadas com estado de tela.

### Transformacao de dados

Filtros, seletores e agrupamentos ficam misturados com handlers.

### Regras locais

O hook contem regras de negocio de frontend, como:

- limite de 4 tamanhos;
- criacao automatica de preco inicial;
- remocao local em cascata;
- categorias base obrigatorias;
- produtos base de pizza obrigatorios.

### Autosave

O autosave fica junto de todas as demais responsabilidades.

Um erro nessa parte pode gerar salvamento em loop ou salvar estado incompleto.

## Plano de divisao seguro

### `menu-management-constants.ts`

Mover:

- `pizzaModes`
- `fixedProductSectionSlugs`

### `menu-management-utils.ts`

Mover:

- `temporaryId`
- `generateSlug`
- `getErrorMessage`

### `menu-management-normalizers.ts`

Mover:

- `normalizeCategory`
- `ensureFixedProductSection`
- `ensurePizzaProduct`
- `ensureBaseData`

### `menu-management-api.ts`

Criar wrappers simples para:

- carregar menu;
- salvar menu.

Importante:

- manter endpoint igual;
- manter metodo igual;
- manter retorno igual.

### `menu-management-payload.ts`

Mover:

- `buildPayload`

Importante:

- receber as colecoes por parametro;
- gerar exatamente o mesmo payload atual.

### `menu-management-selectors.ts`

Extrair funcoes puras para derivar:

- secoes de produto;
- secoes customizadas;
- grupos de sabores;
- bebidas;
- adicionais;
- tamanhos visiveis;
- tamanhos com borda;
- tamanhos redondos;
- tamanhos quadrados;
- sabores filtrados.

### Possivel etapa futura

Somente depois das extracoes puras:

- `useMenuFlavors`
- `useMenuSizes`
- `useMenuProducts`
- `useMenuCategories`
- `useMenuBorders`

Esses sub-hooks teriam risco maior porque compartilham muito estado.

## Ordem de execucao recomendada

Do menor risco para o maior:

### 1. Constantes

Extrair:

- `pizzaModes`
- `fixedProductSectionSlugs`

Risco: baixo.

### 2. Utils puras

Extrair:

- `temporaryId`
- `generateSlug`
- `getErrorMessage`

Risco: baixo.

### 3. Normalizadores/base data

Extrair:

- `normalizeCategory`
- `ensureFixedProductSection`
- `ensurePizzaProduct`
- `ensureBaseData`

Risco: medio.

Motivo:

- essas funcoes garantem categorias/produtos obrigatorios;
- qualquer diferenca afeta dados base do cardapio.

### 4. Selectors puros

Extrair filtros e derivacoes.

Risco: medio.

Motivo:

- precisa manter dependencias de `useMemo` equivalentes.

### 5. Payload builder

Extrair `buildPayload`.

Risco: alto.

Motivo:

- define exatamente o contrato enviado ao backend.

### 6. API service

Extrair wrappers de `GET` e `PUT`.

Risco: medio.

Motivo:

- nao pode mudar endpoint, metodo, retorno ou tratamento de resposta.

### 7. Sub-hooks por dominio

Extrair:

- sabores;
- tamanhos;
- bordas;
- produtos;
- categorias.

Risco: alto.

Motivo:

- handlers compartilham muitas colecoes;
- uma mudanca pode quebrar autosave ou remocao em cascata.

### 8. Autosave

Deixar por ultimo.

Risco: alto.

Motivo:

- pode salvar em loop;
- pode salvar antes da carga inicial;
- pode salvar resposta recem-aplicada.

## Estimativa de reducao

### Extracao segura inicial

Constantes + utils:

- reducao estimada: `70-100` linhas;
- tamanho final aproximado: `950-980` linhas.

### Normalizadores + selectors + API

- reducao estimada adicional: `250-350` linhas;
- tamanho final aproximado: `650-750` linhas.

### Payload builder

- reducao adicional: `90-120` linhas;
- tamanho final aproximado: `500-650` linhas.

### Sub-hooks completos

- reducao adicional: `300-500` linhas;
- tamanho final aproximado: `250-400` linhas.

## Vale a pena dividir?

**SIM.**

## Justificativa tecnica

Vale a pena porque:

- o arquivo esta acima de `1000` linhas;
- e um ponto central do dashboard de cardapio;
- concentra regras sensiveis;
- sera uma das bases para a futura arquitetura generica;
- separar funcoes puras primeiro reduz risco;
- `buildPayload` precisa ficar mais facil de auditar antes de uma mudanca maior.

Mas nao deve ser dividido de uma vez.

## O que nao deve ser extraido agora

Nao extrair primeiro:

- `buildPayload`;
- `saveMenu`;
- autosave;
- `useEffect` de autosave;
- handlers que mexem em varias colecoes ao mesmo tempo:
  - `removeCategory`
  - `addSize`
  - `removeSize`
  - `addFlavor`
  - `addBorder`
- sub-hooks por dominio;
- qualquer coisa que mude dependencias do autosave;
- qualquer mudanca nos nomes ou formatos enviados ao backend;
- qualquer regra ligada ao limite de 4 tamanhos;
- qualquer regra de criacao automatica de categorias/produtos base.

## Testes obrigatorios se houver divisao

1. Abrir `/dashboard/cardapio`.
2. Confirmar carregamento inicial.
3. Confirmar categorias base:
   - Pizzas
   - Bebidas
   - Adicionais
   - Salgadas
   - Doces
4. Adicionar sabor.
5. Editar nome do sabor.
6. Editar descricao.
7. Trocar categoria do sabor.
8. Alterar imagem do sabor.
9. Remover sabor.
10. Alterar preco de sabor por tamanho.
11. Adicionar tamanho redondo.
12. Adicionar tamanho quadrado.
13. Confirmar limite de 4 tamanhos.
14. Remover tamanho.
15. Confirmar remocao de precos ligados ao tamanho.
16. Adicionar bebida.
17. Editar bebida.
18. Remover bebida.
19. Adicionar adicional.
20. Editar adicional.
21. Remover adicional.
22. Adicionar categoria.
23. Editar categoria e slug.
24. Remover categoria.
25. Confirmar produtos vinculados removidos corretamente.
26. Confirmar sabores desvinculados de grupo removido.
27. Adicionar borda.
28. Editar preco de borda.
29. Remover borda.
30. Clicar em "Salvar agora".
31. Confirmar autosave.
32. Recarregar pagina e confirmar persistencia.
33. Abrir cardapio publico e conferir reflexo dos dados.
34. Confirmar que nenhum payload mudou.

## Recomendacao de primeira subetapa

Comecar pela etapa minima:

### Etapa 5A - constantes e utils puras

Criar:

- `apps/web/app/dashboard/cardapio/hooks/menu-management-constants.ts`
- `apps/web/app/dashboard/cardapio/hooks/menu-management-utils.ts`

Mover somente:

- `pizzaModes`
- `fixedProductSectionSlugs`
- `temporaryId`
- `generateSlug`
- `getErrorMessage`

Nao mover nesta etapa:

- normalizadores;
- payload;
- autosave;
- API;
- handlers;
- seletores;
- sub-hooks.

## Conclusao

O arquivo deve ser dividido, mas apenas em etapas pequenas.

O caminho mais seguro e comecar por constantes e helpers puros antes de tocar em payload, autosave ou handlers.
