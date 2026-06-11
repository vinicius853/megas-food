import type {
  BorderOptionMatrixRow,
  BorderPrice,
  Category,
  FlavorOptionMatrixRow,
  FlavorPrice,
  Product,
  SizeOptionMatrixRow,
} from "../types/menu-management";
import { parseMoney } from "../types/menu-management";

export function isNewSizeDraft(size: SizeOptionMatrixRow) {
  return isTemporaryId(size.id, "size");
}

export function isNewFlavorDraft(flavor: FlavorOptionMatrixRow) {
  return isTemporaryId(flavor.id, "flavor");
}

export function isNewBorderDraft(border: BorderOptionMatrixRow) {
  return isTemporaryId(border.id, "border");
}

export function isNewProductDraft(product: Product) {
  return isTemporaryId(product.id, "product");
}

export function isNewCategoryDraft(category: Category) {
  return isTemporaryId(category.id, "category");
}

export function getNewSizeDraftIds(sizes: SizeOptionMatrixRow[]) {
  return new Set(sizes.filter(isNewSizeDraft).map((size) => size.id));
}

export function getNewFlavorDraftIds(flavors: FlavorOptionMatrixRow[]) {
  return new Set(flavors.filter(isNewFlavorDraft).map((flavor) => flavor.id));
}

export function getNewBorderDraftIds(borders: BorderOptionMatrixRow[]) {
  return new Set(borders.filter(isNewBorderDraft).map((border) => border.id));
}

export function isEmptySizeDraft(
  size: SizeOptionMatrixRow,
  flavorPrices: FlavorPrice[],
) {
  const prices = flavorPrices.filter((price) => price.sizeId === size.id);

  return (
    !size.name.trim() &&
    !size.subtitle?.trim() &&
    prices.every((price) => parseMoney(price.price) <= 0)
  );
}

export function validateSizeDrafts(
  sizes: SizeOptionMatrixRow[],
  flavors: FlavorOptionMatrixRow[],
  flavorPrices: FlavorPrice[],
) {
  const drafts = sizes.filter(isNewSizeDraft);
  const activeFlavors = flavors.filter((flavor) => flavor.isActive);

  for (const size of drafts) {
    if (!size.name.trim()) {
      return "Informe o nome do novo tamanho antes de salvar.";
    }

    if (!size.maxFlavors || Number(size.maxFlavors) < 1) {
      return `Informe quantos sabores o tamanho ${size.name.trim()} aceita.`;
    }

    if (activeFlavors.length === 0) continue;

    const missingPrice = activeFlavors.some((flavor) => {
      const price = flavorPrices.find(
        (item) =>
          item.productId === size.productId &&
          item.sizeId === size.id &&
          item.flavorId === flavor.id,
      );

      return !price || parseMoney(price.price) <= 0;
    });

    if (missingPrice) {
      return `Preencha os preços dos sabores para o tamanho ${size.name.trim()} antes de salvar.`;
    }
  }

  return null;
}

export function isEmptyFlavorDraft(
  flavor: FlavorOptionMatrixRow,
  flavorPrices: FlavorPrice[],
) {
  const prices = flavorPrices.filter((price) => price.flavorId === flavor.id);

  return (
    !flavor.name.trim() &&
    !flavor.description?.trim() &&
    !flavor.imageUrl &&
    prices.every((price) => parseMoney(price.price) <= 0)
  );
}

export function validateFlavorDrafts(
  flavors: FlavorOptionMatrixRow[],
  sizes: SizeOptionMatrixRow[],
  flavorPrices: FlavorPrice[],
) {
  const drafts = flavors.filter(isNewFlavorDraft);
  const activeSizes = sizes.filter((size) => size.isActive);

  for (const flavor of drafts) {
    if (!flavor.name.trim()) {
      return "Informe o nome do novo sabor antes de salvar.";
    }

    if (activeSizes.length === 0) continue;

    const missingPrice = activeSizes.some((size) => {
      const price = flavorPrices.find(
        (item) =>
          item.productId === size.productId &&
          item.sizeId === size.id &&
          item.flavorId === flavor.id,
      );

      return !price || parseMoney(price.price) <= 0;
    });

    if (missingPrice) {
      return `Preencha os preços do sabor ${flavor.name.trim()} antes de salvar.`;
    }
  }

  return null;
}

export function isEmptyBorderDraft(
  border: BorderOptionMatrixRow,
  borderPrices: BorderPrice[],
) {
  const prices = borderPrices.filter((price) => price.borderId === border.id);

  return (
    !border.name.trim() && prices.every((price) => parseMoney(price.price) <= 0)
  );
}

export function validateBorderDrafts(
  borders: BorderOptionMatrixRow[],
  sizes: SizeOptionMatrixRow[],
  borderPrices: BorderPrice[],
) {
  const activeSizes = sizes.filter((size) => size.isActive && size.allowBorder);

  for (const border of borders.filter(isNewBorderDraft)) {
    if (!border.name.trim()) {
      return "Informe o nome da nova borda antes de salvar.";
    }

    const missingPrice = activeSizes.some((size) => {
      const price = borderPrices.find(
        (item) =>
          item.productId === size.productId &&
          item.sizeId === size.id &&
          item.borderId === border.id,
      );

      return !price || parseMoney(price.price) <= 0;
    });

    if (missingPrice) {
      return `Preencha os preços da borda ${border.name.trim()} antes de salvar.`;
    }
  }

  return null;
}

export function isEmptyProductDraft(product: Product) {
  return !product.name.trim() && parseMoney(product.price) <= 0;
}

export function validateProductDrafts(products: Product[]) {
  for (const product of products.filter(isNewProductDraft)) {
    if (!product.name.trim()) {
      return "Informe o nome do novo produto antes de salvar.";
    }
    if (parseMoney(product.price) <= 0) {
      return `Informe o preço do produto ${product.name.trim()} antes de salvar.`;
    }
  }

  return null;
}

export function isEmptyCategoryDraft(category: Category) {
  return !category.name.trim();
}

export function validateCategoryDrafts(categories: Category[]) {
  for (const category of categories.filter(isNewCategoryDraft)) {
    if (!category.name.trim()) {
      return "Informe o nome da nova categoria antes de salvar.";
    }
  }

  return null;
}

function isTemporaryId(value: string, prefix: string) {
  return new RegExp(
    `^${prefix}-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
    "i",
  ).test(value);
}
