import assert from "node:assert/strict";

import {
  isEmptyBorderDraft,
  isEmptyCategoryDraft,
  getNewFlavorDraftIds,
  getNewSizeDraftIds,
  isEmptyFlavorDraft,
  isEmptyProductDraft,
  isEmptySizeDraft,
  isNewBorderDraft,
  isNewCategoryDraft,
  isNewFlavorDraft,
  isNewProductDraft,
  isNewSizeDraft,
  validateBorderDrafts,
  validateCategoryDrafts,
  validateFlavorDrafts,
  validateProductDrafts,
  validateSizeDrafts,
} from "./menu-management-drafts";
import type {
  FlavorOptionMatrixRow,
  FlavorPrice,
  SizeOptionMatrixRow,
} from "../types/menu-management";

const draft = size("size-11111111-1111-4111-8111-111111111111", "");
const persisted = size("persisted-size-id", "30cm");
const flavor = {
  id: "flavor-1",
  name: "Sabor",
  isActive: true,
} satisfies FlavorOptionMatrixRow;
const flavorDraft = {
  id: "flavor-22222222-2222-4222-8222-222222222222",
  name: "",
  categoryId: null,
  isActive: true,
} satisfies FlavorOptionMatrixRow;

assert.equal(isNewSizeDraft(draft), true);
assert.equal(isNewSizeDraft(persisted), false);
assert.equal(isNewFlavorDraft(flavorDraft), true);
assert.deepEqual(
  [...getNewFlavorDraftIds([flavorDraft, flavor])],
  ["flavor-22222222-2222-4222-8222-222222222222"],
);
assert.deepEqual(
  [...getNewSizeDraftIds([draft, persisted])],
  ["size-11111111-1111-4111-8111-111111111111"],
);
assert.equal(isEmptySizeDraft(draft, prices("")), true);
assert.equal(isEmptyFlavorDraft(flavorDraft, []), true);
assert.match(
  validateSizeDrafts([draft], [flavor], prices("")) ?? "",
  /nome do novo tamanho/,
);

const namedDraft = size("size-33333333-3333-4333-8333-333333333333", "45cm");
assert.match(
  validateSizeDrafts([namedDraft], [flavor], prices("", namedDraft.id)) ?? "",
  /Preencha os preços/,
);
assert.equal(
  validateSizeDrafts([namedDraft], [flavor], prices("55,00", namedDraft.id)),
  null,
);
assert.match(
  validateFlavorDrafts([flavorDraft], [persisted], []) ?? "",
  /nome do novo sabor/,
);
assert.match(
  validateFlavorDrafts(
    [{ ...flavorDraft, name: "Calabresa" }],
    [persisted],
    [],
  ) ?? "",
  /Preencha os preços do sabor Calabresa/,
);
assert.equal(
  validateFlavorDrafts(
    [{ ...flavorDraft, name: "Calabresa" }],
    [persisted],
    [
      {
        productId: persisted.productId,
        sizeId: persisted.id,
        flavorId: flavorDraft.id,
        price: "42,00",
      },
    ],
  ),
  null,
);

const borderDraft = {
  id: "border-44444444-4444-4444-8444-444444444444",
  name: "",
  isActive: true,
};
assert.equal(isNewBorderDraft(borderDraft), true);
assert.equal(isEmptyBorderDraft(borderDraft, []), true);
assert.match(
  validateBorderDrafts([borderDraft], [persisted], []) ?? "",
  /nome da nova borda/,
);

const productDraft = {
  id: "product-55555555-5555-4555-8555-555555555555",
  categoryId: "category",
  name: "",
  type: "OTHER" as const,
  price: "",
  isActive: true,
};
assert.equal(isNewProductDraft(productDraft), true);
assert.equal(isEmptyProductDraft(productDraft), true);
assert.match(
  validateProductDrafts([productDraft]) ?? "",
  /nome do novo produto/,
);

const categoryDraft = {
  id: "category-66666666-6666-4666-8666-666666666666",
  name: "",
  slug: "",
  type: "PRODUCT_SECTION" as const,
  isActive: true,
};
assert.equal(isNewCategoryDraft(categoryDraft), true);
assert.equal(isEmptyCategoryDraft(categoryDraft), true);
assert.match(
  validateCategoryDrafts([categoryDraft]) ?? "",
  /nome da nova categoria/,
);

console.log("Menu management draft validation passed.");

function size(id: string, name: string): SizeOptionMatrixRow {
  return {
    id,
    productId: "pizza",
    name,
    subtitle: "",
    type: "CM",
    value: null,
    maxFlavors: 2,
    isActive: true,
    allowBorder: true,
  };
}

function prices(value: string, sizeId = draft.id): FlavorPrice[] {
  return [
    {
      productId: "pizza",
      sizeId,
      flavorId: flavor.id,
      price: value,
    },
  ];
}
