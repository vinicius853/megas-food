"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";

import {
  type Category,
  type CategoryType,
  type GenericMenuManagementResponse,
  type GenericMenuUpdateResponse,
  type MenuManagementResponse,
  type SizeOptionMatrixRow,
  type Product,
  type Tab,
  getProductSectionIdFromTab,
} from "../types/menu-management";
import {
  genericMenuToMatrix,
  matrixToGenericUpdate,
} from "./generic-menu-admin-adapter";
import {
  getBorderSizes,
  getCustomProductSections,
  getDrinks,
  getExtras,
  getFlavorDisplayGroups,
  getPizzaProduct,
  getProductSections,
  getSelectedProductSection,
  getSelectedProductSectionProducts,
} from "./menu-management-selectors";
import {
  generateSlug,
  getErrorMessage,
  temporaryId,
} from "./menu-management-utils";
import {
  getNewBorderDraftIds,
  getNewFlavorDraftIds,
  getNewSizeDraftIds,
  isEmptyBorderDraft,
  isEmptyCategoryDraft,
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
import {
  dedupeBorderPrices,
  normalizeMenuPrices,
  upsertBorderPrice,
  validateUniqueMenuPrices,
} from "./menu-management-prices";
import { usePizzaPricingState } from "./use-pizza-pricing-state";
import {
  moveCategory as reorderCategory,
  orderCategories,
} from "./category-order";

export function useMenuManagement() {
  const [activeTab, setActiveTabState] = useState<Tab>("pizzas");

  const [search, setSearch] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);

  const [products, setProducts] = useState<Product[]>([]);

  const [borders, setBorders] = useState<
    MenuManagementResponse["borderOptions"]
  >([]);

  const [borderPrices, setBorderPrices] = useState<
    MenuManagementResponse["borderPrices"]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasLoadedMenuRef = useRef(false);
  const skipNextAutoSaveRef = useRef(false);
  const genericMenuRef = useRef<GenericMenuManagementResponse | null>(null);

  const productSections = useMemo(
    () => getProductSections(categories),
    [categories],
  );

  const customProductSections = useMemo(
    () => getCustomProductSections(productSections),
    [productSections],
  );

  const selectedProductSectionId = getProductSectionIdFromTab(activeTab);

  const selectedProductSection = useMemo(() => {
    return getSelectedProductSection(
      customProductSections,
      selectedProductSectionId,
    );
  }, [customProductSections, selectedProductSectionId]);

  const selectedProductSectionProducts = useMemo(() => {
    return getSelectedProductSectionProducts(products, selectedProductSection);
  }, [products, selectedProductSection]);

  const flavorDisplayGroups = useMemo(
    () => getFlavorDisplayGroups(categories),
    [categories],
  );

  const pizzaPricing = usePizzaPricingState({
    products,
    flavorGroups: flavorDisplayGroups,
    onError: setError,
    onMoveSize: (sizeId, productId) => {
      setBorderPrices((current) =>
        current.map((price) =>
          price.sizeId === sizeId ? { ...price, productId } : price,
        ),
      );
    },
    onRemoveSize: (sizeId, removePrices) => {
      setBorderPrices((current) =>
        removePrices
          ? current.filter((price) => price.sizeId !== sizeId)
          : current.map((price) =>
              price.sizeId === sizeId ? { ...price, isActive: false } : price,
            ),
      );
    },
  });
  const {
    flavorPrices,
    flavors,
    setFlavorPrices,
    setFlavors,
    setSizes,
    sizes,
  } = pizzaPricing;

  const drinks = getDrinks(products);

  const extras = getExtras(products, productSections);

  const borderSizes = useMemo(() => getBorderSizes(sizes), [sizes]);

  function applyMenuData(data: MenuManagementResponse) {
    skipNextAutoSaveRef.current = true;

    setCategories(data.categories);
    setProducts(data.products);
    setSizes(data.sizeOptions);
    setFlavors(data.flavorOptions);
    setFlavorPrices(data.flavorPrices);
    setBorders(data.borderOptions);
    setBorderPrices(dedupeBorderPrices(data.borderPrices));
  }

  function currentMenuState(): MenuManagementResponse {
    return {
      categories,
      products,
      sizeOptions: sizes,
      flavorOptions: flavors,
      flavorPrices,
      borderOptions: borders,
      borderPrices,
    };
  }

  function applyGenericMenuData(data: GenericMenuManagementResponse) {
    genericMenuRef.current = data;
    applyMenuData(genericMenuToMatrix(data));
  }

  async function loadMenu() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch<GenericMenuManagementResponse>(
        "/generic-menu-management",
      );
      applyGenericMenuData(response);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erro ao carregar cardápio."));
    } finally {
      hasLoadedMenuRef.current = true;
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProductSectionId && !selectedProductSection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTabState("adicionais");
    }
  }, [selectedProductSection, selectedProductSectionId]);

  function addProduct(type: Product["type"], categoryId?: string) {
    const category = categoryId
      ? categories.find((item) => item.id === categoryId)
      : type === "DRINK"
        ? categories.find((item) => item.slug === "bebidas")
        : type === "PIZZA_ROUND" || type === "PIZZA_SQUARE"
          ? categories.find((item) => item.slug === "pizzas")
          : categories.find((item) => item.slug === "adicionais");

    if (!category) {
      setError("Categoria necessária não encontrada para o novo produto.");
      return;
    }

    setProducts((prev) => [
      ...prev,
      {
        id: temporaryId("product"),
        categoryId: category.id,
        name:
          type === "PIZZA_ROUND"
            ? "Nova pizza redonda"
            : type === "PIZZA_SQUARE"
              ? "Nova pizza quadrada"
              : "",
        type,
        price: "",
        isActive: true,
        sortOrder: prev.length,
      },
    ]);
  }

  function addPizzaSize(type: "round" | "square") {
    const productType =
      type === "round" ? "PIZZA_ROUND" : "PIZZA_SQUARE";
    const currentProduct = getPizzaProduct(products, productType);

    if (currentProduct) {
      return pizzaPricing.addSize(type);
    }

    const category = categories.find((item) => item.slug === "pizzas");
    if (!category) {
      setError("Categoria de pizzas não encontrada.");
      return null;
    }

    const productId = temporaryId("product");
    setProducts((current) => [
      ...current,
      {
        id: productId,
        categoryId: category.id,
        name:
          type === "round"
            ? "Pizza redonda"
            : "Pizza quadrada",
        type: productType,
        price: "",
        isActive: true,
        sortOrder: current.length,
      },
    ]);

    return pizzaPricing.addSize(type, productId);
  }

  function updateProduct(
    id: string,
    field: keyof Product,
    value: Product[keyof Product],
  ) {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function removeProduct(id: string) {
    if (!products.some((item) => item.id === id && isNewProductDraft(item))) {
      updateProduct(id, "isActive", false);
      return;
    }

    setProducts((prev) => prev.filter((item) => item.id !== id));
  }

  function addCategory(type: CategoryType = "PRODUCT_SECTION") {
    setCategories((prev) => [
      ...prev,
      {
        id: temporaryId("category"),
        name: "",
        slug: "",
        type,
        sortOrder: prev.length,
        isActive: true,
      },
    ]);
  }

  function updateCategory(
    id: string,
    field: keyof Category,
    value: Category[keyof Category],
  ) {
    setCategories((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
              ...(field === "name" && {
                slug: generateSlug(String(value)),
              }),
            }
          : item,
      ),
    );
  }

  function moveCategory(id: string, direction: "up" | "down") {
    setCategories((current) => reorderCategory(current, id, direction));
  }

  function removeCategory(id: string) {
    if (
      !categories.some(
        (category) => category.id === id && isNewCategoryDraft(category),
      )
    ) {
      updateCategory(id, "isActive", false);
      return;
    }

    const removedProductIds = products
      .filter((product) => product.categoryId === id)
      .map((product) => product.id);

    setCategories((prev) => prev.filter((item) => item.id !== id));

    setProducts((prev) => prev.filter((product) => product.categoryId !== id));

    setSizes((prev) =>
      prev.filter((size) => !removedProductIds.includes(size.productId)),
    );

    setFlavorPrices((prev) =>
      prev.filter((price) => !removedProductIds.includes(price.productId)),
    );

    setBorderPrices((prev) =>
      prev.filter((price) => !removedProductIds.includes(price.productId)),
    );

    setFlavors((prev) =>
      prev.map((flavor) =>
        flavor.categoryId === id
          ? {
              ...flavor,
              categoryId: null,
            }
          : flavor,
      ),
    );
  }

  function addBorder() {
    const borderId = temporaryId("border");

    setBorders((prev) => [
      ...prev,
      {
        id: borderId,
        name: "",
        isActive: true,
      },
    ]);

    setBorderPrices((prev) =>
      dedupeBorderPrices([
        ...prev,
        ...sizes
          .filter((size) => size.allowBorder)
          .map((size) => ({
            productId: size.productId,
            sizeId: size.id,
            borderId,
            price: "",
          })),
      ]),
    );
  }

  function updateBorderName(id: string, value: string) {
    setBorders((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name: value,
            }
          : item,
      ),
    );
  }

  function updateBorderActive(id: string, isActive: boolean) {
    setBorders((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isActive,
            }
          : item,
      ),
    );
  }

  function updateBorderPrice(
    borderId: string,
    size: SizeOptionMatrixRow,
    value: string,
  ) {
    setBorderPrices((prev) =>
      upsertBorderPrice(prev, {
        productId: size.productId,
        sizeId: size.id,
        borderId,
        price: value,
        isActive:
          prev.find(
            (price) =>
              price.productId === size.productId &&
              price.sizeId === size.id &&
              price.borderId === borderId,
          )?.isActive ?? true,
      }),
    );
  }

  function removeBorder(id: string) {
    if (!borders.some((item) => item.id === id && isNewBorderDraft(item))) {
      updateBorderActive(id, false);
      return;
    }

    setBorders((prev) => prev.filter((item) => item.id !== id));

    setBorderPrices((prev) => prev.filter((item) => item.borderId !== id));
  }

  async function saveMenu(
    isAutoSave = false,
    stateOverride?: MenuManagementResponse,
  ) {
    try {
      const menuState = normalizeMenuPrices(
        stateOverride ?? currentMenuState(),
      );
      const draftError =
        validateUniqueMenuPrices(menuState) ??
        validateSizeDrafts(
          menuState.sizeOptions,
          menuState.flavorOptions,
          menuState.flavorPrices,
        ) ??
        validateFlavorDrafts(
          menuState.flavorOptions,
          menuState.sizeOptions,
          menuState.flavorPrices,
        ) ??
        validateBorderDrafts(
          menuState.borderOptions,
          menuState.sizeOptions,
          menuState.borderPrices,
        ) ??
        validateProductDrafts(menuState.products) ??
        validateCategoryDrafts(menuState.categories);

      if (draftError) {
        if (!isAutoSave) {
          setError(draftError);
        }
        return false;
      }

      setSaving(true);
      setError("");

      if (!isAutoSave) {
        setSuccess("");
      }

      if (!genericMenuRef.current) {
        throw new Error("Cardapio generico ainda nao foi carregado.");
      }

      const response = await apiFetch<GenericMenuUpdateResponse>(
        "/generic-menu-management",
        {
          method: "PUT",
          body: JSON.stringify(
            matrixToGenericUpdate(menuState, genericMenuRef.current),
          ),
        },
      );
      applyGenericMenuData(response.menu);
      setSuccess(
        isAutoSave
          ? "Alterações salvas automaticamente."
          : "Cardápio salvo com sucesso.",
      );
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erro ao salvar cardápio."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function changeActiveTab(nextTab: Tab) {
    if (nextTab === activeTab) return;

    const sizeDraftIds = getNewSizeDraftIds(sizes);
    const flavorDraftIds = getNewFlavorDraftIds(flavors);
    const borderDraftIds = getNewBorderDraftIds(borders);
    if (
      sizeDraftIds.size === 0 &&
      flavorDraftIds.size === 0 &&
      borderDraftIds.size === 0 &&
      !products.some(isNewProductDraft) &&
      !categories.some(isNewCategoryDraft)
    ) {
      setActiveTabState(nextTab);
      return;
    }

    const emptySizeDraftIds = new Set(
      sizes
        .filter(
          (size) =>
            sizeDraftIds.has(size.id) && isEmptySizeDraft(size, flavorPrices),
        )
        .map((size) => size.id),
    );
    const emptyFlavorDraftIds = new Set(
      flavors
        .filter(
          (flavor) =>
            flavorDraftIds.has(flavor.id) &&
            isEmptyFlavorDraft(flavor, flavorPrices),
        )
        .map((flavor) => flavor.id),
    );
    const emptyBorderDraftIds = new Set(
      borders
        .filter(
          (border) =>
            borderDraftIds.has(border.id) &&
            isEmptyBorderDraft(border, borderPrices),
        )
        .map((border) => border.id),
    );

    const nextSizes = sizes.filter((size) => !emptySizeDraftIds.has(size.id));
    const nextFlavors = flavors.filter(
      (flavor) => !emptyFlavorDraftIds.has(flavor.id),
    );
    const nextBorders = borders.filter(
      (border) => !emptyBorderDraftIds.has(border.id),
    );
    const nextProducts = products.filter(
      (product) =>
        !(isNewProductDraft(product) && isEmptyProductDraft(product)),
    );
    const nextCategories = categories.filter(
      (category) =>
        !(isNewCategoryDraft(category) && isEmptyCategoryDraft(category)),
    );
    const nextFlavorPrices = flavorPrices.filter(
      (price) =>
        !emptySizeDraftIds.has(price.sizeId) &&
        !emptyFlavorDraftIds.has(price.flavorId),
    );
    const nextBorderPrices = borderPrices.filter(
      (price) =>
        !emptySizeDraftIds.has(price.sizeId) &&
        !emptyBorderDraftIds.has(price.borderId),
    );

    if (
      emptySizeDraftIds.size > 0 ||
      emptyFlavorDraftIds.size > 0 ||
      emptyBorderDraftIds.size > 0 ||
      nextProducts.length !== products.length ||
      nextCategories.length !== categories.length
    ) {
      setCategories(nextCategories);
      setProducts(nextProducts);
      setSizes(nextSizes);
      setFlavors(nextFlavors);
      setBorders(nextBorders);
      setFlavorPrices(nextFlavorPrices);
      setBorderPrices(nextBorderPrices);
    }

    if (
      !nextSizes.some(isNewSizeDraft) &&
      !nextFlavors.some(isNewFlavorDraft) &&
      !nextBorders.some(isNewBorderDraft) &&
      !nextProducts.some(isNewProductDraft) &&
      !nextCategories.some(isNewCategoryDraft)
    ) {
      setError("");
      setActiveTabState(nextTab);
      return;
    }

    const saved = await saveMenu(false, {
      ...currentMenuState(),
      categories: nextCategories,
      products: nextProducts,
      sizeOptions: nextSizes,
      flavorOptions: nextFlavors,
      borderOptions: nextBorders,
      flavorPrices: nextFlavorPrices,
      borderPrices: nextBorderPrices,
    });
    if (saved) {
      setActiveTabState(nextTab);
    }
  }

  useEffect(() => {
    if (!hasLoadedMenuRef.current || loading) return;

    if (
      sizes.some(isNewSizeDraft) ||
      flavors.some(isNewFlavorDraft) ||
      borders.some(isNewBorderDraft) ||
      products.some(isNewProductDraft) ||
      categories.some(isNewCategoryDraft)
    ) {
      return;
    }

    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveMenu(true);
    }, 900);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    categories,
    products,
    sizes,
    flavors,
    flavorPrices,
    borders,
    borderPrices,
  ]);

  function openPublicMenu() {
    const slug = localStorage.getItem("tenantSlug");

    if (slug) {
      window.open(`/c/${slug}`, "_blank");
    }
  }

  return {
    activeTab,
    addBorder,
    addCategory,
    addFlavor: () => {
      setSearch("");
      return pizzaPricing.addFlavor();
    },
    addProduct,
    addSize: addPizzaSize,
    borderPrices,
    borders,
    borderSizes,
    categories,
    orderedCategories: orderCategories(categories),
    customProductSections,
    drinks,
    error,
    extras,
    flavorPrices,
    flavors,
    loading,
    openPublicMenu,
    flavorDisplayGroups,
    productSections,
    products,
    removeBorder,
    removeCategory,
    moveCategory,
    removeFlavor: pizzaPricing.removeFlavor,
    removeProduct,
    removeSize: pizzaPricing.removeSize,
    saveMenu,
    saving,
    search,
    selectedProductSection,
    selectedProductSectionProducts,
    setActiveTab: changeActiveTab,
    setSearch,
    setSizes,
    sizes,
    success,
    updateBorderName,
    updateBorderActive,
    updateBorderPrice,
    updateCategory,
    setFlavorSizeAvailability: pizzaPricing.setFlavorSizeAvailability,
    updateFlavorCategory: pizzaPricing.updateFlavorCategory,
    updateFlavorDescription: pizzaPricing.updateFlavorDescription,
    updateFlavorImage: pizzaPricing.updateFlavorImage,
    updateFlavorName: pizzaPricing.updateFlavorName,
    updateFlavorActive: pizzaPricing.updateFlavorActive,
    updatePizzaPrice: pizzaPricing.updatePizzaPrice,
    updateSize: pizzaPricing.updateSize,
    updateProduct,
  };
}
