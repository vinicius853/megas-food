import {
  ModifierPricingMode,
  ModifierSelectionType,
  ProductPricingMode,
} from '@prisma/client';

export type SelectedModifierInput = {
  groupCode?: string;
  groupId?: string;
  optionId: string;
  quantity?: number;
  dependsOnOptionId?: string;
  fraction?: number;
};

export type PriceEngineInput = {
  tenantId: string;
  productId: string;
  quantity: number;
  selectedModifiers: SelectedModifierInput[];
};

export type AppliedModifier = {
  groupId: string;
  groupCode: string;
  groupName: string;
  optionId: string;
  optionCode?: string;
  optionName: string;
  pricingMode: ModifierPricingMode;
  quantity: number;
  fraction?: number;
  dependsOnOptionId?: string;
  unitPriceDelta: number;
  totalDelta: number;
};

export type PriceEngineValidationError = {
  code: string;
  message: string;
  groupCode?: string;
  optionId?: string;
};

export type PriceEngineResult = {
  unitPrice: number;
  totalPrice: number;
  appliedModifiers: AppliedModifier[];
  validationErrors: PriceEngineValidationError[];
};

export type PriceEngineProduct = {
  id: string;
  tenantId: string;
  pricingMode: ProductPricingMode;
  basePrice: unknown;
  price: unknown;
};

export type PriceEngineGroup = {
  id: string;
  code: string;
  name: string;
  selectionType: ModifierSelectionType;
  pricingMode: ModifierPricingMode;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
};

export type PriceEngineProductGroup = {
  id: string;
  sortOrder: number;
  isRequiredOverride: boolean | null;
  minSelectionsOverride: number | null;
  maxSelectionsOverride: number | null;
  modifierGroup: PriceEngineGroup;
};

export type PriceEngineOption = {
  id: string;
  groupId: string;
  code: string | null;
  name: string;
  priceDelta: unknown;
  isActive: boolean;
};

export type PriceEngineProductOption = {
  id: string;
  productId: string;
  modifierGroupId: string;
  modifierOptionId: string;
  isActive: boolean;
  priceDeltaOverride: unknown;
  modifierOption: PriceEngineOption;
};

export type PriceEngineOptionPrice = {
  id: string;
  modifierOptionId: string;
  dependsOnOptionId: string | null;
  price: unknown;
};

export type PriceEngineCatalog = {
  product: PriceEngineProduct;
  productGroups: PriceEngineProductGroup[];
  productOptions: PriceEngineProductOption[];
  optionPrices: PriceEngineOptionPrice[];
};
