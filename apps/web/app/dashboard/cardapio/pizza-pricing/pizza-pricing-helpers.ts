import type {
  FlavorPrice,
  SizeOptionMatrixRow,
} from "../types/menu-management";

export function getPizzaModelLabel(sizes: SizeOptionMatrixRow[]) {
  const active = sizes.filter((size) => size.isActive);
  const hasRound = active.some((size) => size.type === "CM");
  const hasSquare = active.some((size) => size.type === "SLICES");

  if (hasRound && hasSquare) return "Redondas e quadradas";
  if (hasRound) return "Pizzas redondas";
  if (hasSquare) return "Pizzas quadradas";
  return "Nenhum modelo ativo";
}

export function getSizeSlices(size: SizeOptionMatrixRow) {
  const match = String(size.subtitle ?? "").match(/(\d+)/);
  return match ? Number(match[1]) : "";
}

export function formatSlices(value: string) {
  const slices = Number(value);
  return Number.isFinite(slices) && slices > 0
    ? `${Math.trunc(slices)} fatias`
    : "";
}

export function findFlavorPriceRecord(
  prices: FlavorPrice[],
  productId: string,
  flavorId: string,
  sizeId: string,
) {
  return prices.find(
    (price) =>
      price.productId === productId &&
      price.flavorId === flavorId &&
      price.sizeId === sizeId,
  );
}

export function countAvailableSizes(
  prices: FlavorPrice[],
  flavorId: string,
) {
  return new Set(
    prices
      .filter((price) => price.flavorId === flavorId)
      .map((price) => `${price.productId}:${price.sizeId}`),
  ).size;
}

