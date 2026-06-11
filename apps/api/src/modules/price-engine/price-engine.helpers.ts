import { ModifierPricingMode, ProductPricingMode } from '@prisma/client';

import {
  AppliedModifier,
  PriceEngineCatalog,
  PriceEngineResult,
  PriceEngineValidationError,
  SelectedModifierInput,
} from './price-engine.types';

type PreparedSelection = {
  input: SelectedModifierInput;
  productOption: PriceEngineCatalog['productOptions'][number];
  group: PriceEngineCatalog['productGroups'][number]['modifierGroup'];
  quantity: number;
  unitPrice: number;
};

type GroupRule = {
  group: PriceEngineCatalog['productGroups'][number]['modifierGroup'];
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
};

export function calculatePrice(
  catalog: PriceEngineCatalog,
  selectedModifiers: SelectedModifierInput[],
  quantity: number,
): PriceEngineResult {
  const validationErrors: PriceEngineValidationError[] = [];
  const productQuantity = normalizeQuantity(quantity);
  const groupRules = getGroupRules(catalog);
  const selectedByGroup = new Map<string, PreparedSelection[]>();
  const appliedModifiers: AppliedModifier[] = [];

  for (const selected of selectedModifiers) {
    const prepared = prepareSelection(catalog, selected, validationErrors);

    if (!prepared) {
      continue;
    }

    const items = selectedByGroup.get(prepared.group.id) ?? [];
    items.push(prepared);
    selectedByGroup.set(prepared.group.id, items);
  }

  validateGroupRules(groupRules, selectedByGroup, validationErrors);

  const basePrice = resolveBasePrice(catalog);
  let unitPrice = basePrice;
  let replaceBasePrice: number | null = null;

  for (const rule of groupRules) {
    const selections = selectedByGroup.get(rule.group.id) ?? [];
    const groupApplied = buildAppliedModifiers(rule.group, selections);
    const groupTotal = calculateGroupTotal(rule.group.pricingMode, selections);

    if (rule.group.pricingMode === ModifierPricingMode.REPLACE_BASE) {
      replaceBasePrice = Math.max(replaceBasePrice ?? 0, groupTotal);
    } else {
      unitPrice += groupTotal;
    }

    appliedModifiers.push(...groupApplied);
  }

  if (
    catalog.product.pricingMode === ProductPricingMode.FROM_MODIFIERS &&
    replaceBasePrice !== null
  ) {
    unitPrice = replaceBasePrice + unitPrice - basePrice;
  } else if (replaceBasePrice !== null) {
    unitPrice = replaceBasePrice + unitPrice - basePrice;
  }

  unitPrice = roundMoney(unitPrice);

  return {
    unitPrice,
    totalPrice: roundMoney(unitPrice * productQuantity),
    appliedModifiers,
    validationErrors,
  };
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toMoney(value: unknown) {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveBasePrice(catalog: PriceEngineCatalog) {
  if (catalog.product.pricingMode === ProductPricingMode.FROM_MODIFIERS) {
    return toMoney(catalog.product.basePrice);
  }

  return toMoney(catalog.product.basePrice ?? catalog.product.price);
}

function normalizeQuantity(quantity: number | undefined) {
  if (!quantity || quantity < 1) {
    return 1;
  }

  return quantity;
}

function getGroupRules(catalog: PriceEngineCatalog) {
  return catalog.productGroups.map((productGroup): GroupRule => {
    const group = productGroup.modifierGroup;

    return {
      group,
      isRequired: productGroup.isRequiredOverride ?? group.isRequired,
      minSelections: productGroup.minSelectionsOverride ?? group.minSelections,
      maxSelections: productGroup.maxSelectionsOverride ?? group.maxSelections,
    };
  });
}

function prepareSelection(
  catalog: PriceEngineCatalog,
  selected: SelectedModifierInput,
  validationErrors: PriceEngineValidationError[],
): PreparedSelection | null {
  const productOption = catalog.productOptions.find(
    (option) => option.modifierOptionId === selected.optionId,
  );

  if (!productOption) {
    validationErrors.push({
      code: 'OPTION_NOT_ALLOWED',
      message: 'Opcao nao permitida para este produto.',
      groupCode: selected.groupCode,
      optionId: selected.optionId,
    });
    return null;
  }

  const group = catalog.productGroups.find(
    (productGroup) =>
      productGroup.modifierGroup.id === productOption.modifierGroupId,
  )?.modifierGroup;

  if (!group) {
    validationErrors.push({
      code: 'GROUP_NOT_ALLOWED',
      message: 'Grupo de modificador nao permitido para este produto.',
      groupCode: selected.groupCode,
      optionId: selected.optionId,
    });
    return null;
  }

  if (!productOption.isActive || !productOption.modifierOption.isActive) {
    validationErrors.push({
      code: 'OPTION_INACTIVE',
      message: 'Opcao inativa para este produto.',
      groupCode: group.code,
      optionId: selected.optionId,
    });
  }

  const unitPrice = resolveOptionPrice(
    catalog,
    productOption,
    selected,
    group,
    validationErrors,
  );

  return {
    input: selected,
    productOption,
    group,
    quantity: normalizeQuantity(selected.quantity),
    unitPrice,
  };
}

function resolveOptionPrice(
  catalog: PriceEngineCatalog,
  productOption: PriceEngineCatalog['productOptions'][number],
  selected: SelectedModifierInput,
  group: PriceEngineCatalog['productGroups'][number]['modifierGroup'],
  validationErrors: PriceEngineValidationError[],
) {
  if (selected.dependsOnOptionId) {
    const contextualPrice = catalog.optionPrices.find(
      (price) =>
        price.modifierOptionId === selected.optionId &&
        price.dependsOnOptionId === selected.dependsOnOptionId,
    );

    if (!contextualPrice) {
      validationErrors.push({
        code: 'CONTEXTUAL_PRICE_NOT_FOUND',
        message: 'Preco contextual nao encontrado para a opcao selecionada.',
        groupCode: group.code,
        optionId: selected.optionId,
      });
    }

    if (contextualPrice) {
      return toMoney(contextualPrice.price);
    }
  }

  return toMoney(
    productOption.priceDeltaOverride ?? productOption.modifierOption.priceDelta,
  );
}

function validateGroupRules(
  groupRules: GroupRule[],
  selectedByGroup: Map<string, PreparedSelection[]>,
  validationErrors: PriceEngineValidationError[],
) {
  for (const rule of groupRules) {
    const selectedCount = selectedByGroup.get(rule.group.id)?.length ?? 0;

    if (rule.isRequired && selectedCount === 0) {
      validationErrors.push({
        code: 'REQUIRED_GROUP_MISSING',
        message: 'Grupo obrigatorio nao selecionado.',
        groupCode: rule.group.code,
      });
    }

    if (selectedCount < rule.minSelections) {
      validationErrors.push({
        code: 'MIN_SELECTIONS_NOT_REACHED',
        message: 'Quantidade minima de selecoes nao atingida.',
        groupCode: rule.group.code,
      });
    }

    if (selectedCount > rule.maxSelections) {
      validationErrors.push({
        code: 'MAX_SELECTIONS_EXCEEDED',
        message: 'Quantidade maxima de selecoes excedida.',
        groupCode: rule.group.code,
      });
    }
  }
}

function calculateGroupTotal(
  pricingMode: ModifierPricingMode,
  selections: PreparedSelection[],
) {
  if (pricingMode === ModifierPricingMode.INCLUDED) {
    return 0;
  }

  if (
    pricingMode === ModifierPricingMode.HIGHEST_SELECTED ||
    pricingMode === ModifierPricingMode.REPLACE_BASE
  ) {
    return Math.max(0, ...selections.map((selection) => selection.unitPrice));
  }

  return selections.reduce(
    (total, selection) => total + selection.unitPrice * selection.quantity,
    0,
  );
}

function buildAppliedModifiers(
  group: PriceEngineCatalog['productGroups'][number]['modifierGroup'],
  selections: PreparedSelection[],
) {
  const highestPrice =
    group.pricingMode === ModifierPricingMode.HIGHEST_SELECTED
      ? Math.max(0, ...selections.map((selection) => selection.unitPrice))
      : null;
  let highestApplied = false;

  return selections.map((selection): AppliedModifier => {
    const option = selection.productOption.modifierOption;
    const appliesHighest =
      highestPrice !== null &&
      !highestApplied &&
      selection.unitPrice === highestPrice;

    if (appliesHighest) {
      highestApplied = true;
    }

    const totalDelta = resolveAppliedDelta(
      group.pricingMode,
      selection,
      appliesHighest,
    );

    return {
      groupId: group.id,
      groupCode: group.code,
      groupName: group.name,
      optionId: option.id,
      optionCode: option.code ?? undefined,
      optionName: option.name,
      pricingMode: group.pricingMode,
      quantity: selection.quantity,
      fraction: selection.input.fraction,
      dependsOnOptionId: selection.input.dependsOnOptionId,
      unitPriceDelta: roundMoney(selection.unitPrice),
      totalDelta: roundMoney(totalDelta),
    };
  });
}

function resolveAppliedDelta(
  pricingMode: ModifierPricingMode,
  selection: PreparedSelection,
  appliesHighest: boolean,
) {
  if (pricingMode === ModifierPricingMode.INCLUDED) {
    return 0;
  }

  if (pricingMode === ModifierPricingMode.HIGHEST_SELECTED) {
    return appliesHighest ? selection.unitPrice : 0;
  }

  if (pricingMode === ModifierPricingMode.REPLACE_BASE) {
    return selection.unitPrice;
  }

  return selection.unitPrice * selection.quantity;
}
