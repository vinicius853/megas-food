# Relatorio de auditoria - .gitignore e arquivos rastreados

Data: 31/05/2026

Projeto: Megas Food

Objetivo: analisar por que arquivos de `node_modules`, `.turbo`, `.next`, logs e caches estao sendo rastreados pelo Git, sem alterar arquivos e sem executar comandos de limpeza.

## 1. Conteudo atual do `.gitignore`

```gitignore
# Dependencies
node_modules

# Local environment variables
.env
**/.env
*.env.local
```

## 2. Itens ausentes

O `.gitignore` atual esta incompleto para um projeto com Next.js, NestJS, Prisma e Turbo.

Itens recomendados que estao ausentes:

```gitignore
# Dependencies
node_modules/
**/node_modules/

# Next.js
.next/
**/.next/
out/

# Turbo
.turbo/
**/.turbo/

# Logs
logs/
**/logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Caches
.cache/
**/.cache/
.parcel-cache/
.eslintcache
*.tsbuildinfo

# Build outputs
dist/
build/
coverage/

# OS / editor
.DS_Store
Thumbs.db
.vscode/
.idea/
```

## 3. Itens incorretos ou incompletos

### `node_modules`

O item atual:

```gitignore
node_modules
```

funciona em muitos casos, mas e melhor declarar como diretorio e cobrir subpastas:

```gitignore
node_modules/
**/node_modules/
```

Isso deixa claro que o alvo e uma pasta gerada por instalacao de dependencias.

### Variaveis de ambiente

Os itens atuais:

```gitignore
.env
**/.env
*.env.local
```

estao parcialmente corretos.

Para cobrir melhor os casos comuns, recomenda-se:

```gitignore
.env
**/.env
.env.*
**/.env.*
!.env.example
```

Assim arquivos reais de segredo continuam ignorados, mas exemplos podem ser versionados.

### Caches e builds

Faltam regras para:

- `.turbo/`
- `.next/`
- `dist/`
- `build/`
- `coverage/`
- `*.log`
- `*.tsbuildinfo`
- `.cache/`

Esses arquivos sao gerados localmente e nao devem ir para o Git.

## 4. Arquivos que deveriam ser ignorados mas estao sendo rastreados

Foram encontrados arquivos rastreados pelo Git dentro de pastas que deveriam ser ignoradas.

Exemplos:

```text
.turbo/cache/089c57e083d7a746-manifest.json
.turbo/cache/089c57e083d7a746-meta.json
.turbo/cache/089c57e083d7a746.tar.zst
apps/web/.turbo/turbo-build.log
node_modules/.bin/acorn
node_modules/.bin/next
node_modules/.bin/tsc
node_modules/.package-lock.json
node_modules/@babel/*
node_modules/next/*
```

Tambem apareceu este arquivo legitimo do sistema, que nao deve ser ignorado:

```text
apps/web/app/master/logs/page.tsx
```

Observacao importante: `apps/web/app/master/logs/page.tsx` contem `logs` no caminho, mas e codigo-fonte da rota de Logs do Painel Master. Ele nao deve ser removido do Git.

Por isso, a regra de ignore deve mirar pastas de log geradas, como:

```gitignore
logs/
**/logs/
*.log
```

e nao remover manualmente qualquer caminho que apenas contenha a palavra `logs`.

## Por que isso aconteceu?

O motivo mais provavel e:

1. `node_modules`, `.turbo` e logs foram adicionados ao Git antes de existir um `.gitignore` completo.
2. Depois que um arquivo ja esta rastreado, o `.gitignore` nao remove esse arquivo automaticamente.
3. O `.gitignore` so impede novos arquivos nao rastreados de entrarem.

Portanto, mesmo adicionando novas regras ao `.gitignore`, sera necessario limpar o indice do Git com `git rm --cached`.

## 5. Comandos Git necessarios para limpar o indice sem apagar arquivos locais

Estes comandos removem os arquivos apenas do controle do Git. Eles nao apagam os arquivos locais da maquina.

### Limpeza principal

```bash
git rm -r --cached node_modules
git rm -r --cached .turbo
git rm -r --cached apps/web/.turbo
git rm -r --cached apps/web/.next
git rm -r --cached apps/api/.turbo
```

### Logs e arquivos `.log`

Usar com cuidado para nao remover codigo-fonte de rotas chamadas `logs`.

Seguro:

```bash
git rm --cached "*.log"
```

Se existir uma pasta real de logs gerados no projeto:

```bash
git rm -r --cached logs
```

ou, se houver logs gerados dentro de apps especificos:

```bash
git rm -r --cached apps/web/logs
git rm -r --cached apps/api/logs
```

Nao executar:

```bash
git rm -r --cached apps/web/app/master/logs
```

porque isso removeria a pagina real do Painel Master.

### Conferencia depois da limpeza

```bash
git status
```

### Fluxo recomendado

1. Atualizar o `.gitignore`.
2. Remover do indice os arquivos gerados.
3. Conferir o status.
4. Comitar a limpeza.

Comandos:

```bash
git add .gitignore
git status
git commit -m "chore: ignore generated files and caches"
```

Se a limpeza do indice gerar muitas remocoes, revisar antes do commit:

```bash
git status --short
```

## Conclusao

O `.gitignore` atual nao e suficiente para o tamanho e estrutura do projeto.

Os principais problemas confirmados sao:

- `node_modules` esta rastreado.
- `.turbo` esta rastreado.
- `apps/web/.turbo/turbo-build.log` esta rastreado.
- Regras para `.next`, caches, logs e outputs de build estao ausentes.

O ajuste correto deve ser feito em duas partes:

1. Melhorar o `.gitignore`.
2. Limpar o indice do Git com `git rm --cached`, sem apagar os arquivos locais.

