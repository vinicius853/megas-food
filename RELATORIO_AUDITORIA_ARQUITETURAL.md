# 📊 AUDITORIA ARQUITETURAL — ACOPLAMENTO COM PIZZA
**Data:** 30 de maio de 2026  
**Escopo:** Análise de impacto para evolução a hamburgueria, churrascaria e outros segmentos  
**Restrição:** Análise somente, sem alterações no código

---

## 1. RESUMO EXECUTIVO

O Megas Food **possui um acoplamento ALTO com a arquitetura específica de pizza**. O sistema foi projetado do zero para pizzarias, resultando em:

- ✅ **Força:** Solução otimizada para pizzas com tabelas normalizadas
- ❌ **Fraqueza:** Arquitetura não é genérica; requer refatoração significativa para outros segmentos

**Estimativa de impacto:** **65-75% do código frontend, 40-50% do backend**

---

## 2. ANÁLISE PRISMA — MODELO DE DADOS

### 2.1 Tabelas Específicas de Pizza

| Tabela | Propósito | Acoplamento |
|--------|-----------|------------|
| `PizzaSize` | Tamanho da pizza (CM, SLICES, CUSTOM) | MUITO ALTO |
| `PizzaFlavor` | Sabores disponíveis | MUITO ALTO |
| `PizzaBorder` | Bordas recheadas | MUITO ALTO |
| `PizzaFlavorPrice` | Matriz de preços: Product × Size × Flavor | MUITO ALTO |
| `PizzaBorderPrice` | Matriz de preços: Product × Size × Border | MUITO ALTO |
| `OrderItemFlavor` | Sabores misturados em um item | MUITO ALTO |

### 2.2 Tabelas Genéricas (Mas com Referências a Pizza)

```prisma
model Product {
  type: ProductType  // PIZZA_ROUND | PIZZA_SQUARE | DRINK | OTHER
  
  // Relacionamentos PIZZA-específicos:
  sizes: PizzaSize[]                // ← Só faz sentido se type = PIZZA_*
  flavorPrices: PizzaFlavorPrice[]  // ← Só faz sentido se type = PIZZA_*
  borderPrices: PizzaBorderPrice[]  // ← Só faz sentido se type = PIZZA_*
}

model OrderItem {
  sizeId: String?         // ← Requer PizzaSize
  borderId: String?       // ← Requer PizzaBorder
  sizeName: String?       // Redundante (normalizado)
  borderName: String?     // Redundante (normalizado)
  
  flavors: OrderItemFlavor[]  // ← Só para pizzas
}
```

**Problema:** `Product` não é uma entidade agnóstica. Está acoplada a pizza via `ProductType`.

### 2.3 Dependências de Dados

```
Modelo de Relacionamentos:

Product (type=PIZZA_ROUND/SQUARE)
    ↓ 1:N
    PizzaSize
        ↓ FK
        PizzaFlavorPrice
        PizzaBorderPrice
    
PizzaFlavor → PizzaFlavorPrice
PizzaBorder → PizzaBorderPrice

OrderItem
    ↓ FK (sizeId, borderId)
    PizzaSize, PizzaBorder
    ↓ 1:N
    OrderItemFlavor → PizzaFlavor
```

**Cascata de Impacto:**
- Criar uma pizza nova → validar até 4 tamanhos
- Cada tamanho → até N sabores (matriz de preços)
- Cada tamanho → até M bordas (matriz de preços)
- Criar pedido → validar tamanho, sabores (maxFlavors), bordas

---

## 3. ANÁLISE BACKEND — MÓDULOS NESTJS

### 3.1 Módulos Específicos de Pizza

| Arquivo | Linhas | Funcionalidade | Dependências |
|---------|--------|---|---|
| `pizza-sizes/pizza-sizes.service.ts` | ~150 | CRUD tamanhos | Product, PizzaSize |
| `pizza-flavors/pizza-flavors.service.ts` | ~100 | CRUD sabores | PizzaFlavor, Category |
| `pizza-borders/pizza-borders.service.ts` | ~100 | CRUD bordas | PizzaBorder |
| `flavor-prices/flavor-prices.service.ts` | ~200 | Matriz de preços | PizzaFlavorPrice, Product, PizzaSize, PizzaFlavor |
| `border-prices/border-prices.service.ts` | ~200 | Matriz de preços | PizzaBorderPrice, Product, PizzaSize, PizzaBorder |

**Total: ~750 linhas de código específico de pizza**

### 3.2 Validações Hardcoded para Pizza

#### Em `pizza-sizes.service.ts`:
```typescript
// Máximo de 4 tamanhos por pizza
if (activeSizeCount >= 4) {
  throw new BadRequestException('Cada pizza pode ter no maximo 4 tamanhos.')
}

// maxFlavors limitado a 4
maxFlavors: Math.min(dto.maxFlavors ?? 1, 4)
```

#### Em `orders.service.ts`:
```typescript
// Validação específica para tipo de produto
if (product.type !== 'PIZZA_ROUND' && product.type !== 'PIZZA_SQUARE') {
  // Preço direto
  const unitPrice = Number(product.price ?? 0)
} else {
  // Fluxo pizza: tamanho obrigatório
  if (!item.sizeId) {
    throw new BadRequestException('Selecione um tamanho para a pizza.')
  }
  
  // Validar sabores
  if (flavors.length === 0) {
    throw new BadRequestException('Selecione pelo menos 1 sabor.')
  }
  
  // Validar limite de sabores
  if (flavors.length > size.maxFlavors) {
    throw new BadRequestException(`Máximo permitido: ${size.maxFlavors} sabores.`)
  }
  
  // Cálculo de preço: máximo entre sabores
  let itemPrice = 0
  for (const flavor of flavors) {
    const flavorPrice = await this.prisma.pizzaFlavorPrice.findFirst(...)
    if (Number(flavorPrice.price) > itemPrice) {
      itemPrice = Number(flavorPrice.price)
    }
  }
  
  // Validar borda se presente
  if (item.borderId) {
    const borderPrice = await this.prisma.pizzaBorderPrice.findFirst(...)
  }
}
```

**Problema:** Lógica condicional hardcoded. Um hambúrguer seria tratado como produto genérico.

### 3.3 PublicMenuService — Ponto Crítico

```typescript
// apps/api/src/public-menu/public-menu.service.ts

async findBySlug(slug: string) {
  const [
    allCategories,
    allProducts,
    sizes,          // ← Pizza específico
    flavors,        // ← Pizza específico
    flavorPrices,   // ← Pizza específico
    borders,        // ← Pizza específico
    borderPrices,   // ← Pizza específico
  ] = await Promise.all([...])
  
  // Lógica para criar categoria virtual "pizzas"
  const virtualPizzaCategory = {
    id: fixedPizzaCategory?.id ?? `virtual-pizzas-${tenant.id}`,
    name: 'Pizzas',
    slug: 'pizzas',
    type: 'PRODUCT_SECTION',
  }
  
  // Reatribui produtos PIZZA_ROUND/SQUARE para categoria virtual
  const products = allProducts.map((product) => {
    if (product.type === 'PIZZA_ROUND' || product.type === 'PIZZA_SQUARE') {
      return { ...product, categoryId: virtualPizzaCategory.id }
    }
  })
  
  return {
    categories: [...categoriesWithProducts, ...pizzaFlavorGroupCategories],
    products,
    sizes,
    flavors,
    flavorPrices,
    borders,
    borderPrices,  // ← Retorna todas as tabelas pizza para frontend montar UI
  }
}
```

**Impacto:** O endpoint público FORÇA o cliente a entender e processar estrutura pizza. Hamburgueria precisaria de output completamente diferente.

---

## 4. ANÁLISE FRONTEND — DASHBOARD

### 4.1 Componentes Específicos de Pizza

| Arquivo | Linhas | Uso |
|---------|--------|-----|
| `pizza-size-list.tsx` | ~80 | Listar tamanhos com ícone Ruler |
| `pizza-size-form.tsx` | ~120 | Criar/editar tamanho |
| `pizza-flavor-list.tsx` | ~80 | Listar sabores com ícone Tags |
| `pizza-flavor-form.tsx` | ~120 | Criar/editar sabor |
| `pizza-border-list.tsx` | ~70 | Listar bordas com ícone Wheat |
| `pizza-border-form.tsx` | ~100 | Criar/editar borda |
| `flavor-price-table.tsx` | ~150 | Matriz de preços Product × Size × Flavor |
| `flavor-price-form.tsx` | ~100 | Criar/editar preço sabor |
| `border-price-form.tsx` | ~100 | Criar/editar preço borda |
| `pizza-price-matrix.tsx` | ~200 | Visualização da matriz completa |

**Total: ~1,120 linhas de componentes específicos**

### 4.2 Páginas Dashboard Acopladas

```
app/dashboard/cardapio/
├── tamanhos/page.tsx        # Tela de tamanhos
├── sabores/page.tsx         # Tela de sabores
├── bordas/page.tsx          # Tela de bordas
├── precos/page.tsx          # Tela de preços (matriz)
├── matriz-pizzas/           # Componente matriz visual
└── hooks/use-menu-management.ts  # Hook monolítico ~800 linhas
```

### 4.3 Hook use-menu-management.ts — Ponto Crítico

```typescript
// Estado específico de pizza
const [sizes, setSizes] = useState<PizzaSizeConfig[]>([])
const [flavors, setFlavors] = useState<MenuManagementResponse['pizzaFlavors']>([])
const [flavorPrices, setFlavorPrices] = useState<MenuManagementResponse['flavorPrices']>([])
const [borders, setBorders] = useState<MenuManagementResponse['pizzaBorders']>([])
const [borderPrices, setBorderPrices] = useState<MenuManagementResponse['borderPrices']>([])

// Funções específicas de pizza
const pizzaFlavorGroups = useMemo(() => { ... }, [flavors])
function addFlavorPrice(productId, sizeId, flavorId, price) { ... }
function addBorderPrice(productId, sizeId, borderId, price) { ... }
function updatePizzaMode(mode: 'round' | 'square' | 'mixed') { ... }

// Cálculo de matriz
const availableSizesForProduct = useMemo(() => {
  if (selectedMode === 'round') return sizes.filter(isRoundSize)
  if (selectedMode === 'square') return sizes.filter(isSquareSize)
  return sizes
}, [sizes, selectedMode])
```

**Linhas:** ~800

---

## 5. ANÁLISE FRONTEND — CARDÁPIO PÚBLICO

### 5.1 Pizza Configurator Flow — Componente Monolítico

```typescript
// apps/web/components/public-menu/pizza-configurator-flow.tsx
// ~500 linhas

type Step = 
  | 'size'              // Escolher tamanho
  | 'mode'              // Inteira, meio-a-meio, ou múltiplos sabores
  | 'secondFlavor'      // Se meio-a-meio, escolher segundo sabor
  | 'borderQuestion'    // Quer borda?
  | 'borderSelect'      // Qual borda?
  | 'additionalQuestion'// Quer adicionais?
  | 'additionalSelect'  // Quais adicionais?
  | 'summary'           // Revisar pedido

// Estado complexo
const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null)
const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([])
const [selectedBorderId, setSelectedBorderId] = useState<string | null>(null)
const [selectedAdditionalIds, setSelectedAdditionalIds] = useState<string[]>([])
const [flavorFractions, setFlavorFractions] = useState<Record<string, number>>({})

// Cálculo de preço específico
function getFlavorPrice(flavorId: string) {
  return flavorPrices.find(
    fp => fp.productId === product.id &&
         fp.sizeId === selectedSize.id &&
         fp.flavorId === flavorId
  )?.price
}

// Validações específicas
function getAvailableFlavorsForSize() {
  return flavorPrices
    .filter(fp => fp.productId === product.id && fp.sizeId === selectedSize.id)
    .map(fp => flavors.find(f => f.id === fp.flavorId))
    .filter(Boolean)
}
```

**Problema:** ~500 linhas de lógica visual específica para pizza. Hamburger seria completamente diferente.

### 5.2 Fluxo de Carrinho

```typescript
// apps/web/components/public-menu/cart-context.tsx

type CartItem = {
  productId: string
  name: string
  quantity: number
  selectedSize?: { id: string; name: string }        // Pizza
  selectedBorder?: { id: string; name: string }      // Pizza
  selectedFlavors?: Array<{ id: string; name: string; fraction: number }>  // Pizza
  selectedAdditions?: Array<{ id: string; name: string }>
  totalPrice: number
}
```

**Impacto:** CartItem está modelado para pizza (size, flavors, border). Hamburger teria modifiers totalmente diferentes.

---

## 6. ANÁLISE DE PEDIDOS — ARMAZENAMENTO

### 6.1 Estrutura OrderItem

```prisma
model OrderItem {
  id         String  @id
  orderId    String
  productId  String?
  sizeId     String?         // Pizza
  borderId   String?         // Pizza
  name       String
  sizeName   String?         // Pizza (redundante)
  borderName String?         // Pizza (redundante)
  quantity   Int
  unitPrice  Decimal
  total      Decimal
  notes      String?

  flavors    OrderItemFlavor[]  // Pizza
}

model OrderItemFlavor {
  orderItemId String
  flavorId    String?
  flavorName  String     // Snapshot
  fraction    Decimal    // Pizza (meio, inteira, etc)
}
```

**Análise:**
- ✅ **Positivo:** Armazena snapshots (`sizeName`, `borderName`, `flavorName`) para imutabilidade
- ❌ **Negativo:** Tabela `OrderItemFlavor` é específica de pizza
- ❌ **Negativo:** `sizeId` e `borderId` fazem sentido APENAS para pizza

**Impacto para Hamburgueria:** Precisaria de nova tabela `OrderItemModifier` ou refatorar para genérico.

### 6.2 Impressão de Pedido

```typescript
// apps/web/app/dashboard/pedidos/print-order.ts
// ~600 linhas

function getItemFlavors(item: any) {
  return Array.isArray(item.flavors)
    ? item.flavors
        .map((flavor: any) => cleanText(flavor.flavorName ?? flavor.name))
        .join(', ')
    : 'Sem sabores'
}

function buildItemsHtml(order: any, mode: 'kitchen' | 'customer') {
  // Lógica específica para pizza
  for (const item of order.items) {
    const flavors = getItemFlavors(item)
    const size = item.sizeName || 'Sem tamanho'
    const border = item.borderName || ''
    
    html += `<tr>
      <td>${item.name}</td>
      <td>${size}</td>
      <td>${flavors}</td>
      <td>${border}</td>
      <td>${item.quantity}x</td>
    </tr>`
  }
}
```

**Impacto:** A impressão está hardcoded para pizza. Hamburguer teria layout diferente.

---

## 7. TABELA DE DEPENDÊNCIAS ARQUITETURAIS

| Entidade | Arquivos Dependentes | Nível de Acoplamento | Impacto se Remover |
|----------|---------------------|-----|-----|
| **PizzaSize** | 12 | 🔴 MUITO ALTO | ❌ Impossível criar pizza; tela inteira quebra |
| **PizzaFlavor** | 15 | 🔴 MUITO ALTO | ❌ Sem sabores; cardápio público não funciona |
| **PizzaBorder** | 8 | 🟠 ALTO | ❌ Sem borda; validação de pedido quebra |
| **PizzaFlavorPrice** | 10 | 🟠 ALTO | ❌ Sem preços; cálculo de valor quebra |
| **PizzaBorderPrice** | 8 | 🟠 ALTO | ❌ Sem preços de borda; cálculo quebra |
| **OrderItemFlavor** | 6 | 🟠 ALTO | ❌ Pedidos de pizza não armazenam sabores |
| **Product.type (PIZZA_*)** | 25+ | 🔴 MUITO ALTO | ❌ Lógica de pedido inteira é condicional |

---

## 8. ANÁLISE DE VIABILIDADE — MIGRAÇÃO PARA ARQUITETURA GENÉRICA

### 8.1 Arquitetura Alvo Desejada

```prisma
// Novo modelo genérico
model Product {
  id        String
  tenantId  String
  name      String
  type      ProductType  // PIZZA | HAMBURGER | STEAK | DRINK | OTHER
  
  modifierGroups  ModifierGroup[]
  prices          ProductPrice[]  // Preço base ou por modificador
}

model ModifierGroup {
  id          String
  productId   String
  name        String              // "Tamanho", "Sabor", "Borda", "Pão", "Ponto"
  type        ModifierGroupType  // SIZE, FLAVOR, ADDON, SIDE, SAUCE
  required    Boolean
  multiSelect Boolean
  maxOptions  Int?
  
  options     ModifierOption[]
}

model ModifierOption {
  id              String
  groupId         String
  name            String
  priceModifier   Decimal  // +2.00 para borda, -1.00 para pão menor
  
  productPrices   ModifierOptionPrice[]
}

model ModifierOptionPrice {
  id          String
  optionId    String
  productId   String
  price       Decimal
}

model OrderItem {
  id          String
  orderId     String
  productId   String
  quantity    Int
  
  selections  OrderItemSelection[]  // Seleções de modificadores
}

model OrderItemSelection {
  id              String
  orderItemId     String
  modifierGroupId String
  optionId        String
  
  // Snapshot para imutabilidade
  optionName      String
  priceModifier   Decimal
}
```

### 8.2 Migração Necessária — Estimativa de Esforço

#### Backend:

| Tarefa | Esforço | Risco | Notas |
|--------|---------|-------|-------|
| Criar novos modelos Prisma | 2h | BAIXO | Schema novo, migrations de dados |
| Migração dados (PizzaSize → ModifierGroup) | 4h | MÉDIO | Precisa mapeamento de tipos |
| Refatorar OrdersService | 8h | ALTO | Lógica condicional complexa |
| Refatorar validações de pedido | 6h | ALTO | maxFlavors, allowBorder → genérico |
| Refatorar cálculo de preço | 6h | ALTO | Matrix de preços agora é genérica |
| Refatorar PublicMenuService | 4h | MÉDIO | Não carrega pizza-específico |
| Testes e ajustes | 8h | MÉDIO | E2E quebram |
| **TOTAL BACKEND** | **38h** | — | **5 dias de 1 dev** |

#### Frontend Dashboard:

| Tarefa | Esforço | Risco | Notas |
|--------|---------|-------|-------|
| Refatorar use-menu-management | 6h | ALTO | Hook monolítico, estado complexo |
| Criar componentes genéricos para ModifierGroup | 8h | MÉDIO | Substituir pizza-*-form |
| Refatorar matriz de preços | 4h | MÉDIO | Agora é ModifierOptionPrice |
| Refatorar telas de cardápio | 4h | BAIXO | Filtrar por ProductType |
| **TOTAL DASHBOARD** | **22h** | — | **3 dias de 1 dev** |

#### Frontend Público:

| Tarefa | Esforço | Risco | Notas |
|--------|---------|-------|-------|
| Refatorar pizza-configurator-flow | 12h | MUITO ALTO | ~500 linhas, estado complexo |
| Criar configurador genérico | 16h | MUITO ALTO | Precisa lidar com N tipos de produtos |
| Refatorar cálculo de preço | 4h | MÉDIO | ModifierOptionPrice |
| Refatorar carrinho | 6h | MÉDIO | CartItem não precisa de size/flavors hardcoded |
| Refatorar impressão de pedido | 6h | MÉDIO | Genérica para qualquer tipo |
| **TOTAL FRONTEND PÚBLICO** | **44h** | — | **6 dias de 1 dev** |

#### **TOTAL ESTIMADO: 104 horas = 13 dias úteis (2-3 semanas com 1 dev full-time)**

---

## 9. RISCO PARA CLIENTES EM PRODUÇÃO

### 9.1 Cenário: Sistema Hoje com Pizzarias Ativas

**Problema:** Como evoluir para suportar hamburgueria sem quebrar pizzarias?

#### Opção 1: Evoluir em Paralelo (RECOMENDADO)
```
Fase 1: Criar modelos genéricos ModifierGroup, ModifierOption
         ↓ (Migração de PizzaSize → ModifierGroup)
Fase 2: Adaptar OrdersService para lidar com ambos (legacy + novo)
         ↓ (Período de transição de 1-2 meses)
Fase 3: Migrar dados históricos de pizzarias
         ↓
Fase 4: Desativar código legacy (PizzaSize, PizzaFlavor, etc)
```

**Riscos:**
- ⚠️ Período de transição com código duplicado (technical debt)
- ⚠️ Testing complexo (validar ambos fluxos funcionam)
- ✅ Pizzarias continuam funcionando

#### Opção 2: Big Bang Refactor (NÃO RECOMENDADO)
```
Manutenção → Refatorar tudo → Testar → Deploy
```

**Riscos:**
- ❌ Alto risco de quebra em produção
- ❌ Downtime potencial
- ❌ Pizzarias podem cancelar assinatura

### 9.2 Classificação de Risco

| Aspecto | Classificação | Justificativa |
|---------|---|---|
| **Risco Técnico** | 🟠 MÉDIO | Refatoração viável, mas requer planejamento |
| **Risco de Negócio** | 🔴 ALTO | Impacta clientes, precisa transição suave |
| **Risco de Data Loss** | 🟡 MÉDIO | Snapshots em OrderItem protegem, mas precisa migration script |
| **Risco de Performance** | 🟡 MÉDIO | Schema genérico pode ser mais complexo para queries |

### 9.3 Recomendações para Mitigação

1. **Manter compatibilidade backward:** Suportar ambos os modelos por 3-6 meses
2. **Feature flag por tenant:** `enableGenericModifiers: boolean`
3. **Migration script testado:** Converter dados de pizza antigos sem perda
4. **Comunicação pro-ativa:** Avisar pizzarias sobre upgrade
5. **Rollback plan:** Se algo quebrar, revert para schema antiga

---

## 10. ESTADO ATUAL DA ARQUITETURA

### 10.1 Pontos Positivos

✅ **Normalização de dados:** PizzaFlavorPrice evita redundância  
✅ **Isolamento de dados:** Cada tenant tem seus próprios tamanhos/sabores  
✅ **Snapshots em OrderItem:** Preserva histórico mesmo se tamanho/sabor for deletado  
✅ **Validação stricta:** maxFlavors, allowBorder controlados no backend  
✅ **Multi-tenant já implementado:** Não precisa adicionar tenantId em novos modelos  

### 10.2 Pontos Críticos

❌ **Acoplamento alto:** PizzaSize, PizzaFlavor hardcoded em múltiplos lugares  
❌ **Modelo não genérico:** Product.type = PIZZA_* é enumerado, não extensível  
❌ **Lógica condicional:** OrdersService usa if/else para pizza vs outros  
❌ **Frontend monolítico:** pizza-configurator-flow ~500 linhas, não reutilizável  
❌ **Publich Menu específico:** Retorna 7 arrays (sizes, flavors, flavorPrices, borders...)  
❌ **Sem abstração:** Sem camada de ModifierGroup ou VariantOption  

### 10.3 Grau de Preparação para Hamburgueria

**Nota:** 3/10 🔴

- ❌ Não pode adicionar PizzaSize para hamburger (não faz sentido)
- ❌ Não pode reutilizar PizzaFlavor para toppings (diferente semanticamente)
- ❌ Não pode reutilizar PizzaFlavorPrice (hamburger precisa de outro modelo)
- ✅ Pode reutilizar Product, Category, Tenant, Order
- ✅ Pode reutilizar autenticação, billing, WebSocket

---

## 11. RELATÓRIO FINAL — RECOMENDAÇÃO TÉCNICA

### 11.1 Melhor Estratégia de Evolução

**Fase 1 — Preparar (2 semanas)**
- [ ] Design modelos genéricos (ModifierGroup, ModifierOption)
- [ ] Criar migrations Prisma
- [ ] Iniciar refatoração de OrdersService
- [ ] Setup feature flags por tenant

**Fase 2 — Implementar Suporte Dual (4 semanas)**
- [ ] Código novo suporta ambos Pizza e ModifierGroup
- [ ] Migração gradual de dados (pizza → ModifierGroup)
- [ ] Testes extensivos (legacy + novo)

**Fase 3 — Lançar Novo Segmento (2 semanas)**
- [ ] Habilitar ModifierGroup para novos tenants (hamburgueria, churrascaria)
- [ ] Manter backward compatibility para pizzarias existentes
- [ ] Deploy gradual, com monitoring

**Fase 4 — Deprecar Legacy (3-6 meses)**
- [ ] Oferecer migration plan para pizzarias antigas
- [ ] Remover tabelas PizzaSize, PizzaFlavor, etc
- [ ] Limpeza de technical debt

### 11.2 Investimento de Tempo

| Fase | Tempo | Dev | Risco |
|------|-------|-----|-------|
| Preparar | 2 sem | 1 | BAIXO |
| Implementar | 4 sem | 1.5 | MÉDIO |
| Lançar | 2 sem | 1 | MÉDIO |
| Deprecar | 3-6 meses | 0.25 (manutenção) | BAIXO |
| **TOTAL** | **11-14 semanas** | — | — |

### 11.3 Resposta Direta às Questões

#### **É possível migrar sem perder dados?**
✅ **SIM**, desde que:
1. Crie script de migração que mapeie PizzaSize → ModifierGroup
2. Mantenha OrderItem snapshots (já existem)
3. Valide dados antigos durante migração

#### **Qual o risco para pizzarias em produção?**
🟡 **MÉDIO-ALTO** se feito corretamente:
- Com dual-support: BAIXO risco
- Com rollback plan: MÉDIO risco
- Com big-bang: ALTO risco

#### **Poderá suportar hamburgueria sem quebrar pizza?**
✅ **SIM**, com:
1. Feature flags `enableGenericModifiers` por tenant
2. 3-6 meses de transição
3. Comunicação pro-ativa com clientes

#### **Que tabelas precisam permanecer por compatibilidade?**
- `Order`, `OrderItem`, `OrderItemFlavor` (por histórico)
- `Product`, `Category`, `Tenant` (fundação)
- Temporariamente: `PizzaSize`, `PizzaFlavor` (legacy)

---

## 12. CONCLUSÃO

O Megas Food é uma **solução bem implementada para pizzarias**, mas com **acoplamento arquitetural que restringe expansão**. 

A evolução para hamburgueria é **viável tecnicamente (104 horas)**,  mas requer:
1. ✅ Refatoração em 2-3 semanas
2. ✅ Período de transição de 3-6 meses
3. ✅ Duplo suporte temporário
4. ⚠️ Planejamento cuidadoso para não quebrar pizzarias ativas

**Recomendação:** Iniciar refatoração logo (antes de mais clientes entrar em produção) para minimizar impacto futuro.

---

**Fim da Auditoria Arquitetural**  
**Data:** 30 de maio de 2026  
**Analista:** Copilot Arquitetural
