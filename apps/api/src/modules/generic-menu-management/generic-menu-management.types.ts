import {
  CategoryType,
  ModifierPricingMode,
  ModifierSelectionType,
  ProductPricingMode,
  ProductType,
} from '@prisma/client';

export type GenericMenuManagementResponse = {
  categories: GenericMenuCategoryAdminDto[];
  products: GenericProductAdminDto[];
};

export type GenericMenuCategoryAdminDto = {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  sortOrder: number;
  isActive: boolean;
};

export type GenericProductAdminDto = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  type: ProductType;
  pricingMode: ProductPricingMode;
  basePrice: number | null;
  price: number | null;
  isActive: boolean;
  sortOrder: number;
  modifierGroups: GenericModifierGroupAdminDto[];
};

export type GenericModifierGroupAdminDto = {
  id: string;
  productModifierGroupId: string;
  code: string;
  name: string;
  description: string | null;
  selectionType: ModifierSelectionType;
  pricingMode: ModifierPricingMode;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  isActive: boolean;
  options: GenericModifierOptionAdminDto[];
};

export type GenericModifierOptionAdminDto = {
  id: string;
  productModifierOptionId: string;
  code: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  displayCategoryId: string | null;
  priceDelta: number;
  sortOrder: number;
  isActive: boolean;
  prices: ContextualPriceDto[];
  rules: ConditionalRuleDto[];
};

export type ContextualPriceDto = {
  id: string;
  dependsOnOptionId: string | null;
  price: number;
  isActive: boolean;
};

export type ConditionalRuleDto = {
  id: string;
  targetGroupId: string;
  targetGroupCode: string;
  isEnabled: boolean;
  minSelections: number | null;
  maxSelections: number | null;
  metadata: unknown;
};
