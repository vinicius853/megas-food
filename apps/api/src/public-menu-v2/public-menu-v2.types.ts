import {
  CategoryType,
  ModifierPricingMode,
  ModifierSelectionType,
  ProductPricingMode,
  ProductType,
} from '@prisma/client';

export type PublicMenuV2Tenant = {
  id: string;
  slug: string;
  name: string;
  whatsapp: string | null;
  logoUrl: string | null;
};

export type PublicMenuV2Price = {
  id: string;
  dependsOnOptionId: string | null;
  price: number;
  isActive: boolean;
};

export type PublicMenuV2OptionRule = {
  id: string;
  targetGroupId: string;
  targetGroupCode: string;
  isEnabled: boolean;
  minSelections: number | null;
  maxSelections: number | null;
  metadata: unknown;
};

export type PublicMenuV2Option = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: {
    id: string;
    name: string;
    sortOrder: number;
  } | null;
  rules: PublicMenuV2OptionRule[];
  priceDelta: number;
  sortOrder: number;
  isActive: boolean;
  prices: PublicMenuV2Price[];
};

export type PublicMenuV2ModifierGroup = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  selectionType: ModifierSelectionType;
  pricingMode: ModifierPricingMode;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  options: PublicMenuV2Option[];
};

export type PublicMenuV2Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  type: ProductType;
  pricingMode: ProductPricingMode;
  basePrice: number | null;
  price: number | null;
  sortOrder: number;
  modifierGroups: PublicMenuV2ModifierGroup[];
};

export type PublicMenuV2Category = {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  sortOrder: number;
  isActive: boolean;
  products: PublicMenuV2Product[];
};

export type PublicMenuV2Customization = {
  logoUrl: string;
  coverUrl: string;
  paletteId: string;
  brandName: string;
  tagline: string;
};

export type PublicMenuV2Delivery = {
  isDeliveryOpen: boolean;
  city: string;
  state: string;
  storeCep: string;
  storeAddress: string;
  whatsapp: string;
  zones: unknown[];
  openingHours: Record<string, unknown>;
};

export type PublicMenuV2Subscription = {
  status: string;
  canAcceptOrders: boolean;
  canAccessDashboard: boolean;
  accessUntil?: Date | string | null;
  nextBillingDate?: Date | string | null;
  message?: string | null;
};

export type PublicMenuV2Response = {
  tenant: PublicMenuV2Tenant;
  customization: PublicMenuV2Customization;
  delivery: PublicMenuV2Delivery;
  subscription: PublicMenuV2Subscription;
  categories: PublicMenuV2Category[];
};

export type PublicMenuV2SelectedModifier = {
  groupCode?: string;
  groupId?: string;
  optionId: string;
  quantity?: number;
  dependsOnOptionId?: string;
  fraction?: number;
};

export type PublicMenuV2PriceRequest = {
  productId: string;
  quantity?: number;
  selectedModifiers: PublicMenuV2SelectedModifier[];
};
