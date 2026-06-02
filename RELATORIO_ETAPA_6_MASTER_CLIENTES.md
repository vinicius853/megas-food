# Relatorio tecnico - Etapa 6: master/clientes/page.tsx

## Arquivo analisado

`apps/web/app/master/clientes/page.tsx`

## Objetivo

Mapear responsabilidades e propor uma divisao segura para reduzir o arquivo de aproximadamente `1381` linhas para abaixo de `800` linhas, sem alterar comportamento.

## Tamanho atual

O arquivo possui aproximadamente `1381` linhas.

## Responsabilidades atuais

O arquivo concentra praticamente toda a tela de clientes do Painel Master.

### Tipos

- `TenantUser`
- `Tenant`
- `Plan`
- `TenantForm`
- `TenantEditForm`
- `ResetPasswordForm`
- `ChangePlanForm`

### Estados iniciais

- `initialForm`
- `initialEditForm`
- `initialResetPasswordForm`
- `initialChangePlanForm`

### Formatadores e helpers

- `slugify`
- `formatDate`
- `formatFullDate`
- `formatMoney`
- `parseMoneyInput`
- `onlyDigits`
- `formatCpfCnpj`
- `formatPhone`
- `formatCep`
- `formatDocumentInput`
- `formatZipInput`
- `formatWhatsappInput`
- `getPlanName`
- `getCurrentSubscription`
- `getErrorMessage`

### Estado da pagina

- lista de clientes/tenants;
- lista de planos;
- role atual;
- permissoes atuais;
- loading;
- saving;
- loading de reset de senha;
- modal de criacao;
- modal de detalhes;
- modal de edicao;
- modal de reset de senha;
- modal de alteracao de plano;
- formulario de criacao;
- formulario de edicao;
- formulario de reset de senha;
- formulario de alteracao de plano;
- erro;
- sucesso.

### Permissoes

- `canManageClients`
- `canCreateClients`
- `canDeleteClients`
- `canResetClientPassword`
- `canManagePlans`

### Chamadas de API

- `GET /tenants`
- `GET /billing/plans`
- `POST /tenants`
- `PATCH /tenants/:id`
- `DELETE /tenants/:id`
- `POST /tenants/:id/reset-owner-password`
- `POST /billing/tenants/:id/change-plan`

### Acoes administrativas

- carregar clientes;
- carregar planos;
- criar pizzaria;
- abrir modal de edicao;
- atualizar pizzaria;
- ativar/desativar cliente;
- excluir cliente;
- abrir modal de reset de senha;
- redefinir senha do dono;
- abrir modal de alteracao de plano;
- atualizar formulario de plano;
- alterar plano/assinatura do cliente.

### Formularios

- criacao de pizzaria;
- edicao de dados administrativos;
- reset de senha do dono;
- alteracao de plano/assinatura.

### Tabela

Exibe:

- codigo interno;
- pizzaria;
- cidade/UF;
- responsavel;
- WhatsApp;
- status;
- plano;
- cliente desde;
- acoes.

### Modais

- nova pizzaria;
- editar pizzaria;
- detalhes da pizzaria;
- redefinir senha;
- alterar plano.

### Componente auxiliar

- `DetailItem`

## Mistura de responsabilidades

Existe muita coisa misturada no mesmo arquivo.

### JSX

O arquivo renderiza:

- header da pagina;
- mensagens de erro e sucesso;
- tabela completa;
- cinco modais;
- formulario de criacao;
- formulario de edicao;
- formulario de detalhes;
- formulario de reset de senha;
- formulario de alteracao de plano.

### Estado

O arquivo controla:

- dados da tela;
- permissoes;
- modais;
- formularios;
- feedback visual;
- loading/saving.

### Filtros e derivacoes

O arquivo faz:

- busca do owner do tenant;
- busca de assinatura atual;
- busca do nome do plano;
- formatacao de telefone, documento, CEP, dinheiro e datas.

### Formularios

Cada modal possui formulario proprio, mas todos ficam no mesmo arquivo.

### Modais

Os modais sao grandes e independentes, mas estao embutidos na pagina.

### Chamadas de API

Todas as acoes administrativas chamam API diretamente no arquivo da pagina.

### Acoes administrativas

Acoes sensiveis estao misturadas com JSX:

- ativar/desativar cliente;
- excluir cliente;
- resetar senha;
- alterar plano.

### Clientes

Listagem, criacao, edicao, detalhes e status ficam no mesmo arquivo.

### Planos e assinatura

Carregamento de planos, exibicao de assinatura e alteracao de contrato ficam no mesmo arquivo.

### Reset de senha

Formulario, payload, validacao por senha de operador e feedback ficam no mesmo arquivo.

## Plano de divisao seguro

### `clientes.types.ts`

Mover:

- `TenantUser`
- `Tenant`
- `Plan`
- `TenantForm`
- `TenantEditForm`
- `ResetPasswordForm`
- `ChangePlanForm`

### `clientes-formatters.ts`

Mover:

- `slugify`
- `formatDate`
- `formatFullDate`
- `formatMoney`
- `parseMoneyInput`
- `onlyDigits`
- `formatCpfCnpj`
- `formatPhone`
- `formatCep`
- `formatDocumentInput`
- `formatZipInput`
- `formatWhatsappInput`
- `getPlanName`
- `getCurrentSubscription`
- `getErrorMessage`

### `clientes-api.ts`

Possivel etapa futura para wrappers:

- carregar clientes;
- carregar planos;
- criar tenant;
- editar tenant;
- ativar/desativar tenant;
- excluir tenant;
- resetar senha;
- alterar plano.

Observacao: nao deve ser criado primeiro, porque envolve endpoints e payloads.

### `clientes-table.tsx`

Extrair a tabela:

- linhas;
- colunas;
- botoes de acao;
- estados de carregamento e vazio.

### `cliente-create-modal.tsx`

Extrair modal de nova pizzaria.

### `cliente-edit-modal.tsx`

Extrair modal de edicao.

### `cliente-details-modal.tsx`

Extrair modal de detalhes.

### `cliente-reset-password-modal.tsx`

Extrair modal de redefinir senha.

### `cliente-plan-modal.tsx`

Extrair modal de alteracao de plano.

### `use-master-clientes.ts`

Possivel etapa futura para estado e acoes.

Observacao: deve ser feito depois dos componentes visuais, porque concentra a parte mais sensivel.

## Ordem de execucao

Do menor risco para o maior:

### 1. Tipos

Criar `clientes.types.ts`.

Risco: baixo.

### 2. Formatadores/helpers

Criar `clientes-formatters.ts`.

Risco: baixo.

### 3. Componente visual simples

Extrair `DetailItem`.

Risco: baixo.

### 4. Tabela

Criar `clientes-table.tsx`.

Risco: medio.

Motivo:

- envolve permissoes e botoes de acao.

### 5. Modal de detalhes

Criar `cliente-details-modal.tsx`.

Risco: medio.

Motivo:

- nao envia payload, mas exibe dados sensiveis de assinatura.

### 6. Modal de criacao

Criar `cliente-create-modal.tsx`.

Risco: medio/alto.

Motivo:

- envolve formulario obrigatorio e slug automatico.

### 7. Modal de edicao

Criar `cliente-edit-modal.tsx`.

Risco: medio/alto.

Motivo:

- envolve dados administrativos e payload de edicao.

### 8. Modal de reset de senha

Criar `cliente-reset-password-modal.tsx`.

Risco: alto.

Motivo:

- envolve seguranca e senha de operador.

### 9. Modal de alteracao de plano

Criar `cliente-plan-modal.tsx`.

Risco: alto.

Motivo:

- envolve assinatura e valores contratados.

### 10. Hook `use-master-clientes.ts`

Extrair estado e acoes.

Risco: alto.

Motivo:

- concentra carregamento, modais, permissoes e acoes administrativas.

### 11. API service

Criar `clientes-api.ts`.

Risco: alto.

Motivo:

- qualquer alteracao em payload ou endpoint pode quebrar fluxo master.

## Estimativa de reducao

### Tipos

- reducao estimada: `100-130` linhas.

### Formatadores/helpers

- reducao estimada: `120-160` linhas.

### Tabela

- reducao estimada: `170-220` linhas.

### Modal de criacao

- reducao estimada: `90-130` linhas.

### Modal de edicao

- reducao estimada: `100-140` linhas.

### Modal de detalhes

- reducao estimada: `160-220` linhas.

### Modal de reset de senha

- reducao estimada: `80-110` linhas.

### Modal de alteracao de plano

- reducao estimada: `120-170` linhas.

### Hook/API

- reducao estimada: `250-400` linhas, dependendo da abordagem.

## Tamanho final estimado

### Apos tipos + helpers

Entre `1080` e `1160` linhas.

### Apos tabela + modais visuais

Entre `350` e `550` linhas.

### Com hook separado

Entre `180` e `300` linhas na pagina.

## Vale a pena dividir?

**SIM.**

## Justificativa tecnica

Vale a pena porque:

- o arquivo possui `1381` linhas;
- mistura renderizacao, regras administrativas, payloads, permissoes e formularios;
- possui muitos modais independentes;
- e uma tela critica do Painel Master;
- reduzir complexidade melhora manutencao;
- modais podem ser extraidos com risco controlado se as props forem bem preservadas.

Porem, a divisao deve acontecer em subetapas.

Nao e recomendavel extrair API ou hook primeiro.

## O que nao deve ser extraido agora

Nao comecar por:

- chamadas de API;
- payload de criacao de tenant;
- payload de edicao de tenant;
- payload de reset de senha;
- payload de alteracao de plano;
- logica de permissoes;
- `canManageClients`;
- `canCreateClients`;
- `canDeleteClients`;
- `canResetClientPassword`;
- `canManagePlans`;
- `toggleTenant`;
- `resetOwnerPassword`;
- `changeTenantPlan`;
- `useEffect` inicial de carregamento;
- `loadTenants`;
- `loadPlans`.

## Testes necessarios

Caso a divisao seja aprovada:

1. Abrir `/master/clientes`.
2. Confirmar carregamento de clientes.
3. Confirmar carregamento de planos.
4. Confirmar permissoes dos botoes.
5. Abrir modal "Nova pizzaria".
6. Criar pizzaria.
7. Confirmar slug automatico.
8. Confirmar mascaras de CPF/CNPJ, WhatsApp e CEP.
9. Abrir modal "Editar".
10. Editar dados administrativos.
11. Abrir modal "Detalhes".
12. Conferir codigo interno.
13. Conferir dados do responsavel.
14. Conferir dados de assinatura.
15. Abrir cardapio publico pelo botao.
16. Ativar cliente.
17. Desativar cliente com senha de confirmacao.
18. Cancelar desativacao sem senha.
19. Excluir cliente, se usuario `MASTER_OWNER`.
20. Abrir modal de redefinir senha.
21. Redefinir senha com senha do operador.
22. Conferir erro se senha do operador estiver vazia.
23. Abrir modal "Alterar plano".
24. Alterar plano.
25. Conferir valor contratado.
26. Conferir que alteracao de plano nao muda outros clientes.
27. Confirmar mensagens de erro/sucesso.
28. Recarregar pagina e conferir persistencia.

## Recomendacao de primeira subetapa

Comecar com:

### Etapa Master Clientes 1A - tipos + estados iniciais + formatadores

Criar:

- `apps/web/app/master/clientes/clientes.types.ts`
- `apps/web/app/master/clientes/clientes-formatters.ts`

Mover somente:

- tipos;
- `initialForm`;
- `initialEditForm`;
- `initialResetPasswordForm`;
- `initialChangePlanForm`;
- formatadores/helpers puros.

Nao mover:

- API;
- permissoes;
- modais;
- JSX;
- handlers;
- payloads;
- carregamento inicial;
- acoes administrativas.

## Conclusao

O arquivo deve ser dividido.

O caminho mais seguro e comecar por tipos e helpers puros, depois extrair tabela e modais visuais, e somente por ultimo avaliar hook/API.
