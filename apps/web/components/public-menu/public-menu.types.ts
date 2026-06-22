export type ProductType = "PIZZA_ROUND" | "PIZZA_SQUARE" | "DRINK" | "OTHER";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  whatsapp?: string | null;
  logoUrl?: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  type?: "PRODUCT_SECTION" | "PIZZA_FLAVOR_GROUP";
  sortOrder: number;
  isActive: boolean;
};

export type PublicMenuV2Price = {
  id: string;
  dependsOnOptionId: string | null;
  price: number;
  isActive?: boolean;
};

export type PublicMenuV2Option = {
  id: string;
  code: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: {
    id: string;
    name: string;
    sortOrder: number;
  } | null;
  rules: Array<{
    id: string;
    targetGroupId: string;
    targetGroupCode: string;
    isEnabled: boolean;
    minSelections: number | null;
    maxSelections: number | null;
    metadata: unknown;
  }>;
  priceDelta: number;
  sortOrder: number;
  isActive: boolean;
  prices: PublicMenuV2Price[];
};

export type PublicMenuV2ModifierGroup = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  selectionType: "SINGLE" | "MULTIPLE";
  pricingMode: "INCLUDED" | "ADDITIVE" | "REPLACE_BASE" | "HIGHEST_SELECTED";
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  options: PublicMenuV2Option[];
};

export type PublicMenuV2Product = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  type: ProductType;
  pricingMode: "FIXED" | "FROM_MODIFIERS";
  basePrice: number | null;
  price: number | null;
  sortOrder: number;
  modifierGroups: PublicMenuV2ModifierGroup[];
};

export type PublicMenuV2Category = Category & {
  products: PublicMenuV2Product[];
};

export type PublicMenuV2Response = {
  tenant: Tenant;
  customization?: MenuCustomization;
  delivery?: DeliverySettings;
  subscription?: PublicSubscription;
  categories: PublicMenuV2Category[];
};

export type MenuCustomization = {
  logoUrl?: string;
  coverUrl?: string;
  coverPositionX?: number;
  coverPositionY?: number;
  paletteId?: string;
  brandName?: string;
  tagline?: string;
};

export type DeliveryZone = {
  id: string;
  name: string;
  fee: number;
  eta: string;
  isActive: boolean;
};

export type OpeningHourRange = {
  enabled?: boolean;
  open: string;
  close: string;
};

export type DeliveryOpeningHours = {
  monday?: OpeningHourRange;
  tuesday?: OpeningHourRange;
  wednesday?: OpeningHourRange;
  thursday?: OpeningHourRange;
  friday?: OpeningHourRange;
  weekday?: OpeningHourRange;
  saturday?: OpeningHourRange;
  sunday?: OpeningHourRange;
};

export type DeliverySettings = {
  isDeliveryOpen?: boolean;
  city?: string;
  state?: string;
  storeCep?: string;
  storeAddress?: string;
  whatsapp?: string;
  zones?: DeliveryZone[];
  openingHours?: DeliveryOpeningHours;
};

export type PublicSubscription = {
  status: string;
  canAcceptOrders: boolean;
  canAccessDashboard: boolean;
  accessUntil?: string | null;
  nextBillingDate?: string | null;
  message?: string | null;
};

export type MenuPalette = {
  id: string;
  primary: string;
  secondary: string;
  accent: string;
  soft: string;
  textOnPrimary: string;
};

export type FlavorCard = {
  id: string;
  name: string;
  description: string;
  categoryName: string;
  categorySortOrder: number;
  image?: string;
  minPrice: number;
  prices: {
    label: string;
    subtitle?: string | null;
    value: number;
  }[];
};

export type FixedProductCard = {
  id: string;
  product: PublicMenuV2Product;
  name: string;
  description: string | null;
  categoryName: string;
  categorySortOrder: number;
  image?: string;
  price: number;
};

export type MenuSection =
  | {
      id: string;
      title: string;
      sortOrder: number;
      type: "flavors";
      items: FlavorCard[];
    }
  | {
      id: string;
      title: string;
      sortOrder: number;
      type: "products";
      items: FixedProductCard[];
    };
