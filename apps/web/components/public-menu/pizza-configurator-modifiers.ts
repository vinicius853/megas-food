import type { CartItem } from "./cart-context";
import type { PublicMenuV2Option } from "./public-menu.types";
import type { PriceEngineSelectedModifier } from "./price-engine-shadow";

export const SIZE_GROUP_CODE = "pizza_size";
export const FLAVOR_GROUP_CODE = "pizza_flavor";
export const BORDER_GROUP_CODE = "pizza_border";

export type ConfiguratorSizeOption = PublicMenuV2Option & {
  minFlavors: number;
  maxFlavors: number;
  allowBorder: boolean;
};

export function buildSelectedModifierRequest(input: {
  productId: string;
  sizeOptionId: string;
  flavorOptionIds: string[];
  borderOptionId?: string;
}) {
  const fraction =
    input.flavorOptionIds.length > 1 ? 1 / input.flavorOptionIds.length : 1;
  const selectedModifiers: PriceEngineSelectedModifier[] = [
    {
      groupCode: SIZE_GROUP_CODE,
      optionId: input.sizeOptionId,
    },
    ...input.flavorOptionIds.map((optionId) => ({
      groupCode: FLAVOR_GROUP_CODE,
      optionId,
      dependsOnOptionId: input.sizeOptionId,
      fraction,
    })),
  ];

  if (input.borderOptionId) {
    selectedModifiers.push({
      groupCode: BORDER_GROUP_CODE,
      optionId: input.borderOptionId,
      dependsOnOptionId: input.sizeOptionId,
    });
  }

  return {
    productId: input.productId,
    quantity: 1,
    selectedModifiers,
  };
}

export function withSelectedModifierDisplay(
  modifiers: PriceEngineSelectedModifier[],
  input: {
    selectedSize: ConfiguratorSizeOption;
    selectedFlavors: PublicMenuV2Option[];
    selectedBorder?: PublicMenuV2Option;
    selectedBorderPrice: number;
  },
): CartItem["selectedModifiers"] {
  let flavorIndex = -1;

  return modifiers.map((modifier) => {
    if (modifier.groupCode === SIZE_GROUP_CODE) {
      return {
        ...modifier,
        groupName: "Tamanho",
        optionName: input.selectedSize.name,
      };
    }

    if (modifier.groupCode === FLAVOR_GROUP_CODE) {
      flavorIndex += 1;
      const flavor = input.selectedFlavors[flavorIndex];

      return {
        ...modifier,
        groupName: "Sabores",
        optionName: flavor?.name,
      };
    }

    if (modifier.groupCode === BORDER_GROUP_CODE) {
      return {
        ...modifier,
        groupName: "Borda",
        optionName: input.selectedBorder?.name,
        unitPriceDelta: input.selectedBorderPrice,
        totalDelta: input.selectedBorderPrice,
      };
    }

    return modifier;
  });
}

export function buildCartDisplayGroups(
  modifiers: CartItem["selectedModifiers"],
): CartItem["displayGroups"] {
  const groups = new Map<
    string,
    NonNullable<CartItem["displayGroups"]>[number]
  >();

  for (const modifier of modifiers) {
    const group = groups.get(modifier.groupCode) ?? {
      code: modifier.groupCode,
      name: modifier.groupName ?? modifier.groupCode,
      options: [],
    };

    group.options.push({
      name: modifier.optionName ?? "Opcao",
      fraction: modifier.fraction,
      price: modifier.totalDelta,
    });
    groups.set(modifier.groupCode, group);
  }

  return Array.from(groups.values());
}
