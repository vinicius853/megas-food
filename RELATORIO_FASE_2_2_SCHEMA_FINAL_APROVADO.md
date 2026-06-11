# MEGAS FOOD - FASE 2.2

# SCHEMA FINAL APROVADO

Relatorio consolidado do schema final para a migration aditiva da Fase 2.

## Models finais

Novos models aprovados:

- `ModifierGroup`
- `ModifierOption`
- `ProductModifierGroup`
- `ProductModifierOption`
- `ModifierOptionPrice`
- `OrderItemModifier`

Models atuais que recebem relacoes/campos novos:

- `Product`
- `OrderItem`

Resumo das relacoes:

- `Product` possui muitos `ProductModifierGroup`.
- `Product` possui muitos `ProductModifierOption`.
- `Product` possui muitos `ModifierOptionPrice`.
- `ModifierGroup` possui muitas `ModifierOption`.
- `ModifierGroup` pertence a muitos produtos via `ProductModifierGroup`.
- `ModifierOption` pode ser habilitada por produto via `ProductModifierOption`.
- `ModifierOptionPrice` define preco contextual por produto/opcao/dependencia.
- `OrderItem` possui muitos `OrderItemModifier`.
- `OrderItemModifier` salva snapshot dos modificadores do pedido.

## Enums finais

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
```

Enums legados permanecem:

- `ProductType`
- `PizzaSizeType`
- `CategoryType`

## Indices

Indices recomendados:

- `Product`: `tenantId`, `tenantId + categoryId`, `tenantId + isActive`, `tenantId + sortOrder`
- `ModifierGroup`: `tenantId`, `tenantId + isActive`, `tenantId + sortOrder`
- `ModifierOption`: `tenantId`, `groupId`, `tenantId + isActive`, `tenantId + sortOrder`
- `ProductModifierGroup`: `tenantId`, `productId`, `modifierGroupId`, `tenantId + productId + sortOrder`
- `ProductModifierOption`: `tenantId`, `productId`, `modifierGroupId`, `modifierOptionId`, `tenantId + productId + modifierGroupId`
- `ModifierOptionPrice`: `tenantId`, `productId`, `modifierOptionId`, `dependsOnOptionId`, `tenantId + productId`
- `OrderItemModifier`: `orderItemId`, `modifierGroupId`, `modifierOptionId`, `orderItemId + sortOrder`

## Constraints

Uniques aprovadas:

- `ModifierGroup`: `tenantId + code`
- `ModifierOption`: `tenantId + groupId + name`
- `ProductModifierGroup`: `tenantId + productId + modifierGroupId`
- `ProductModifierOption`: `tenantId + productId + modifierOptionId`
- `ModifierOptionPrice`: `tenantId + productId + modifierOptionId + dependsOnOptionId`

## Compatibilidade com legado

Tabelas legadas permanecem temporariamente:

- `PizzaSize`
- `PizzaFlavor`
- `PizzaFlavorPrice`
- `PizzaBorder`
- `PizzaBorderPrice`
- `OrderItemFlavor`

Campos/estruturas legadas permanecem temporariamente:

- `Product.type`
- `Product.price`, se ainda existir no schema real
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
- `PizzaSizeType`
- `CategoryType.PIZZA_FLAVOR_GROUP`

Pedidos antigos continuam sendo lidos pelo formato legado. Pedidos novos futuramente gravarao `OrderItemModifier`.

## Pendencias bloqueantes

Nao ha pendencias bloqueantes para uma migration apenas aditiva.

Condicoes obrigatorias:

- Nao remover tabelas legadas.
- Nao remover campos legados.
- Nao alterar fluxo atual de pedidos.
- Nao migrar dados automaticamente nesta primeira migration estrutural.
- Apenas adicionar enums, models, relacoes, indices e constraints novas.

MIGRATION ADITIVA PODE SER INICIADA.
