import type { PublicMenuV2Product } from "./public-menu.types";

export type AdditionalProduct = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: string | number;
};

export type Step =
  | "size"
  | "mode"
  | "secondFlavor"
  | "borderQuestion"
  | "borderSelect"
  | "additionalQuestion"
  | "additionalSelect"
  | "summary"
  | "drinkSuggestion";

export type SelectionMode = "whole" | "multi";

export type PizzaConfiguratorFlowProps = {
  open: boolean;
  tenantSlug: string;
  product: PublicMenuV2Product | null;
  initialFlavorOptionId: string | null;
  additionalProducts?: AdditionalProduct[];
  onClose: () => void;
  shouldOfferDrinkSuggestion?: boolean;
  onDrinkSuggestionShown?: () => void;
  onViewDrinks: () => void;
  onOpenCart: () => void;
  onItemAdded?: (item: { name: string; imageUrl?: string }) => void;
};
