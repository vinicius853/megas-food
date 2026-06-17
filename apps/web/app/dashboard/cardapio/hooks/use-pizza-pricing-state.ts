"use client";

import { type SetStateAction, useState } from "react";

import type {
  Category,
  FlavorOptionMatrixRow,
  FlavorPrice,
  Product,
  SizeOptionMatrixRow,
} from "../types/menu-management";
import { isNewFlavorDraft, isNewSizeDraft } from "./menu-management-drafts";
import {
  dedupeFlavorPrices,
  upsertFlavorPrice,
} from "./menu-management-prices";
import { getPizzaProduct } from "./menu-management-selectors";
import { temporaryId } from "./menu-management-utils";

type PizzaPricingStateOptions = {
  products: Product[];
  flavorGroups: Category[];
  onError: (message: string) => void;
  onMoveSize: (sizeId: string, productId: string) => void;
  onRemoveSize: (sizeId: string, removePrices: boolean) => void;
};

export function usePizzaPricingState({
  products,
  flavorGroups,
  onError,
  onMoveSize,
  onRemoveSize,
}: PizzaPricingStateOptions) {
  const [sizes, setSizes] = useState<SizeOptionMatrixRow[]>([]);
  const [flavors, setFlavors] = useState<FlavorOptionMatrixRow[]>([]);
  const [flavorPrices, setFlavorPricesState] = useState<FlavorPrice[]>([]);

  function updatePizzaPrice(
    productId: string,
    flavorId: string,
    sizeId: string,
    value: string,
  ) {
    setFlavorPricesState((current) =>
      upsertFlavorPrice(current, {
        productId,
        sizeId,
        flavorId,
        price: value,
        isActive:
          current.find(
            (price) =>
              price.productId === productId &&
              price.sizeId === sizeId &&
              price.flavorId === flavorId,
          )?.isActive ?? true,
      }),
    );
  }

  function setFlavorSizeAvailability(
    productId: string,
    flavorId: string,
    sizeId: string,
    enabled: boolean,
  ) {
    setFlavorPricesState((current) => {
      const existing = current.find(
        (price) =>
          price.productId === productId &&
          price.flavorId === flavorId &&
          price.sizeId === sizeId,
      );

      if (!existing && !enabled) {
        return current;
      }

      return upsertFlavorPrice(current, {
        productId,
        sizeId,
        flavorId,
        price: existing?.price ?? "",
        isActive: enabled,
      });
    });
  }

  function addFlavor() {
    const flavorId = temporaryId("flavor");
    const defaultGroup = flavorGroups[0];

    setFlavors((current) => [
      ...current,
      {
        id: flavorId,
        categoryId: defaultGroup?.id ?? null,
        name: "",
        sortOrder: current.length,
        isActive: true,
      },
    ]);

    return flavorId;
  }

  function removeFlavor(id: string) {
    if (!flavors.some((item) => item.id === id && isNewFlavorDraft(item))) {
      updateFlavorActive(id, false);
      return;
    }

    setFlavors((current) => current.filter((item) => item.id !== id));
    setFlavorPricesState((current) =>
      current.filter((item) => item.flavorId !== id),
    );
  }

  function updateFlavor(
    id: string,
    patch: Partial<FlavorOptionMatrixRow>,
  ) {
    setFlavors((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function updateFlavorName(id: string, value: string) {
    updateFlavor(id, { name: value });
  }

  function updateFlavorActive(id: string, isActive: boolean) {
    updateFlavor(id, { isActive });
  }

  function updateFlavorDescription(id: string, value: string) {
    updateFlavor(id, { description: value });
  }

  function updateFlavorImage(id: string, value: string | null) {
    updateFlavor(id, { imageUrl: value });
  }

  function updateFlavorCategory(id: string, categoryId: string) {
    updateFlavor(id, { categoryId: categoryId || null });
  }

  function addSize(
    type: "round" | "square",
    productIdOverride?: string,
  ) {
    const product =
      products.find((item) => item.id === productIdOverride) ??
      getPizzaProduct(
        products,
        type === "round" ? "PIZZA_ROUND" : "PIZZA_SQUARE",
      );

    if (!product) {
      onError(
        `Cadastre ou reative o produto de pizza ${
          type === "round" ? "redonda" : "quadrada"
        } antes de adicionar este tamanho.`,
      );
      return null;
    }

    const sizeId = temporaryId("size");
    const newSize: SizeOptionMatrixRow = {
      id: sizeId,
      productId: product.id,
      name: "",
      subtitle: "",
      type: type === "round" ? "CM" : "SLICES",
      value: null,
      maxFlavors: 1,
      isActive: true,
      allowBorder: type === "round",
      sortOrder: sizes.length,
    };

    setSizes((current) => [...current, newSize]);
    return sizeId;
  }

  function updateSize(
    id: string,
    patch: Partial<SizeOptionMatrixRow>,
  ) {
    const targetProduct =
      patch.type === "CM"
        ? getPizzaProduct(products, "PIZZA_ROUND")
        : patch.type === "SLICES"
          ? getPizzaProduct(products, "PIZZA_SQUARE")
          : undefined;
    const productId = targetProduct?.id;

    setSizes((current) =>
      current.map((size) =>
        size.id === id
          ? {
              ...size,
              ...patch,
              ...(productId ? { productId } : {}),
            }
          : size,
      ),
    );

    if (productId) {
      setFlavorPricesState((current) =>
        dedupeFlavorPrices(
          current.map((price) =>
            price.sizeId === id ? { ...price, productId } : price,
          ),
        ),
      );
      onMoveSize(id, productId);
    }
  }

  function removeSize(sizeId: string) {
    const isNewDraft = sizes.some(
      (size) => size.id === sizeId && isNewSizeDraft(size),
    );

    if (!isNewDraft) {
      setSizes((current) =>
        current.map((size) =>
          size.id === sizeId ? { ...size, isActive: false } : size,
        ),
      );
    } else {
      setSizes((current) => current.filter((size) => size.id !== sizeId));
    }

    setFlavorPricesState((current) => {
      if (isNewDraft) {
        return current.filter((price) => price.sizeId !== sizeId);
      }

      return current.map((price) =>
        price.sizeId === sizeId ? { ...price, isActive: false } : price,
      );
    });
    onRemoveSize(sizeId, isNewDraft);
  }

  function setFlavorPrices(next: SetStateAction<FlavorPrice[]>) {
    setFlavorPricesState((current) =>
      dedupeFlavorPrices(
        typeof next === "function" ? next(current) : next,
      ),
    );
  }

  return {
    addFlavor,
    addSize,
    flavorPrices,
    flavors,
    removeFlavor,
    removeSize,
    setFlavorPrices,
    setFlavors,
    setFlavorSizeAvailability,
    setSizes,
    sizes,
    updateFlavorActive,
    updateFlavorCategory,
    updateFlavorDescription,
    updateFlavorImage,
    updateFlavorName,
    updatePizzaPrice,
    updateSize,
  };
}
