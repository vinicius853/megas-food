import type {
  Category,
  FlavorOptionMatrixRow,
  FlavorPrice,
  SizeOptionMatrixRow,
} from "../types/menu-management";

export type PizzaPricingModuleProps = {
  flavorGroups: Category[];
  flavorPrices: FlavorPrice[];
  flavors: FlavorOptionMatrixRow[];
  search: string;
  sizes: SizeOptionMatrixRow[];
  setSearch: (value: string) => void;
  onAddFlavor: () => string;
  onAddSize: (type: "round" | "square") => string | null;
  onRemoveFlavor: (id: string) => void;
  onRemoveSize: (id: string) => void;
  onSetFlavorSizeAvailability: (
    productId: string,
    flavorId: string,
    sizeId: string,
    enabled: boolean,
  ) => void;
  onUpdateFlavorActive: (id: string, value: boolean) => void;
  onUpdateFlavorCategory: (id: string, value: string) => void;
  onUpdateFlavorDescription: (id: string, value: string) => void;
  onUpdateFlavorImage: (id: string, value: string | null) => void;
  onUpdateFlavorName: (id: string, value: string) => void;
  onUpdatePizzaPrice: (
    productId: string,
    flavorId: string,
    sizeId: string,
    value: string,
  ) => void;
  onUpdateSize: (
    id: string,
    patch: Partial<SizeOptionMatrixRow>,
  ) => void;
};
