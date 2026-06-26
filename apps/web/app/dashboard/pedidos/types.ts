export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type OrderType = "ONLINE" | "TAKEAWAY" | "DELIVERY";

export type OrderItemModifier = {
  id: string;
  modifierGroupId?: string | null;
  modifierOptionId?: string | null;
  groupName: string;
  groupCode?: string | null;
  optionName: string;
  optionCode?: string | null;
  pricingMode?: string | null;
  quantity: number;
  fraction?: string | number | null;
  dependsOnOptionId?: string | null;
  unitPriceDelta: string | number;
  totalDelta: string | number;
  sortOrder: number;
  metadata?: unknown;
};

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: string | number;
  total: string | number;
  notes?: string | null;
  modifiers: OrderItemModifier[];
};

export type OrderListItem = {
  id: string;
  number?: number | null;
  dailyNumber?: number | null;
  dailyOrderNumber?: number | null;
  businessDate?: string | null;
  displayNumber?: string | number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  type: OrderType;
  status: OrderStatus;
  total: string | number;
  createdAt: string;
  itemsCount: number;
  itemsSummary: string;
};

export type Order = {
  id: string;
  number?: number | null;
  dailyNumber?: number | null;
  dailyOrderNumber?: number | null;
  businessDate?: string | null;
  displayNumber?: string | number | null;
  tenant?: {
    name?: string | null;
  } | null;
  customerName?: string | null;
  customerPhone?: string | null;
  type: OrderType;
  status: OrderStatus;
  subtotal: string | number;
  deliveryFee: string | number;
  total: string | number;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
};
