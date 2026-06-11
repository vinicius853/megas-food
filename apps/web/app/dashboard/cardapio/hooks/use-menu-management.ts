"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";

import {
  type Category,
  type CategoryType,
  type GenericMenuManagementResponse,
  type GenericMenuUpdateResponse,
  type MenuManagementResponse,
  type PizzaMode,
  type SizeOptionMatrixRow,
  type Product,
  type Tab,
  getProductSectionIdFromTab,
} from "../types/menu-management";
import { pizzaModes } from "./menu-management-constants";
import {
  genericMenuToMatrix,
  matrixToGenericUpdate,
} from "./generic-menu-admin-adapter";
import {
  getBorderSizes,
  getCustomProductSections,
  getDrinks,
  getExtras,
  getFilteredFlavors,
  getFlavorDisplayGroups,
  getPizzaProduct,
  getProductSections,
  getRoundSizes,
  getSelectedProductSection,
  getSelectedProductSectionProducts,
  getSquareSizes,
  getVisibleSizes,
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

export { pizzaModes };

export function useMenuManagement() {
  const [activeTab, setActiveTabState] = useState<Tab>("pizzas");

  const [pizzaMode, setPizzaMode] = useState<PizzaMode>("mixed");

  const [search, setSearch] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);

  const [products, setProducts] = useState<Product[]>([]);

  const [sizes, setSizes] = useState<SizeOptionMatrixRow[]>([]);

  const [flavors, setFlavors] = useState<
    MenuManagementResponse["flavorOptions"]
  >([]);

  const [flavorPrices, setFlavorPrices] = useState<
    MenuManagementResponse["flavorPrices"]
  >([]);

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

  const roundProduct = getPizzaProduct(products, "PIZZA_ROUND");

  const squareProduct = getPizzaProduct(products, "PIZZA_SQUARE");

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

  const drinks = getDrinks(products);

  const extras = getExtras(products, productSections);

  const visibleSizes = useMemo(
    () => getVisibleSizes(sizes, pizzaMode),
    [sizes, pizzaMode],
  );

  const borderSizes = useMemo(() => getBorderSizes(sizes), [sizes]);

  const roundSizes = useMemo(() => getRoundSizes(sizes), [sizes]);

  const squareSizes = useMemo(() => getSquareSizes(sizes), [sizes]);

  const filteredFlavors = useMemo(
    () => getFilteredFlavors(flavors, search),
    [flavors, search],
  );

  function applyMenuData(data: MenuManagementResponse) {
    skipNextAutoSaveRef.current = true;

    setCategories(data.categories);
    setProducts(data.products);
    setSizes(data.sizeOptions);
    setFlavors(data.flavorOptions);
    setFlavorPrices(data.flavorPrices);
    setBorders(data.borderOptions);
    setBorderPrices(data.borderPrices);
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

  function updatePizzaPrice(
    productId: string,
    flavorId: string,
    sizeId: string,
    value: string,
  ) {
    setFlavorPrices((prev) => {
      const existing = prev.find(
        (price) =>
          price.productId === productId &&
          price.flavorId === flavorId &&
          price.sizeId === sizeId,
      );

      if (existing) {
        return prev.map((price) =>
          price === existing
            ? {
                ...price,
                price: value,
              }
            : price,
        );
      }

      return [
        ...prev,
        {
          productId,
          sizeId,
          flavorId,
          price: value,
        },
      ];
    });
  }

  function addFlavor() {
    const flavorId = temporaryId("flavor");
    const defaultGroup = flavorDisplayGroups[0];

    setSearch("");
    setFlavors((prev) => [
      ...prev,
      {
        id: flavorId,
        categoryId: defaultGroup?.id ?? null,
        name: "",
        sortOrder: prev.length,
        isActive: true,
      },
    ]);

    setFlavorPrices((prev) => [
      ...prev,
      ...sizes.map((size) => ({
        productId: size.productId,
        sizeId: size.id,
        flavorId,
        price: "",
      })),
    ]);
  }

  function removeFlavor(id: string) {
    if (!flavors.some((item) => item.id === id && isNewFlavorDraft(item))) {
      updateFlavorActive(id, false);
      return;
    }

    setFlavors((prev) => prev.filter((item) => item.id !== id));

    setFlavorPrices((prev) => prev.filter((item) => item.flavorId !== id));
  }

  function updateFlavorName(id: string, value: string) {
    setFlavors((prev) =>
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

  function updateFlavorActive(id: string, isActive: boolean) {
    setFlavors((prev) =>
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

  function updateFlavorDescription(id: string, value: string) {
    setFlavors((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              description: value,
            }
          : item,
      ),
    );
  }

  function updateFlavorImage(id: string, value: string | null) {
    setFlavors((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              imageUrl: value,
            }
          : item,
      ),
    );
  }

  function updateFlavorCategory(id: string, categoryId: string) {
    setFlavors((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              categoryId: categoryId || null,
            }
          : item,
      ),
    );
  }

  function addSize(type: "round" | "square") {
    const product = type === "round" ? roundProduct : squareProduct;

    if (!product) return;

    const productSizes = sizes.filter((size) => size.productId === product.id);

    if (productSizes.length >= 4) {
      setError(
        "Cada modelo de pizza pode ter no maximo 4 tamanhos para manter o cardapio responsivo.",
      );
      return;
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

    setSizes((prev) => [...prev, newSize]);

    setFlavorPrices((prev) => [
      ...prev,
      ...flavors.map((flavor) => ({
        productId: product.id,
        sizeId,
        flavorId: flavor.id,
        price: "",
      })),
    ]);
  }

  function removeSize(sizeId: string) {
    if (!sizes.some((size) => size.id === sizeId && isNewSizeDraft(size))) {
      setSizes((prev) =>
        prev.map((size) =>
          size.id === sizeId ? { ...size, isActive: false } : size,
        ),
      );
      return;
    }

    setSizes((prev) => prev.filter((size) => size.id !== sizeId));

    setFlavorPrices((prev) => prev.filter((price) => price.sizeId !== sizeId));

    setBorderPrices((prev) => prev.filter((price) => price.sizeId !== sizeId));
  }

  function addProduct(type: "DRINK" | "OTHER", categoryId?: string) {
    const category = categoryId
      ? categories.find((item) => item.id === categoryId)
      : type === "DRINK"
        ? categories.find((item) => item.slug === "bebidas")
        : categories.find((item) => item.slug === "adicionais");

    if (!category) return;

    setProducts((prev) => [
      ...prev,
      {
        id: temporaryId("product"),
        categoryId: category.id,
        name: "",
        type,
        price: "",
        isActive: true,
        sortOrder: prev.length,
      },
    ]);
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

    setBorderPrices((prev) => [
      ...prev,
      ...sizes
        .filter((size) => size.allowBorder)
        .map((size) => ({
          productId: size.productId,
          sizeId: size.id,
          borderId,
          price: "",
        })),
    ]);
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
    setBorderPrices((prev) => {
      const existing = prev.find(
        (price) =>
          price.borderId === borderId &&
          price.sizeId === size.id &&
          price.productId === size.productId,
      );

      if (existing) {
        return prev.map((price) =>
          price === existing
            ? {
                ...price,
                price: value,
              }
            : price,
        );
      }

      return [
        ...prev,
        {
          productId: size.productId,
          sizeId: size.id,
          borderId,
          price: value,
        },
      ];
    });
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
      const menuState = stateOverride ?? currentMenuState();
      const draftError =
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
    addFlavor,
    addProduct,
    addSize,
    borderPrices,
    borders,
    borderSizes,
    categories,
    customProductSections,
    drinks,
    error,
    extras,
    filteredFlavors,
    flavorPrices,
    flavors,
    loading,
    openPublicMenu,
    flavorDisplayGroups,
    pizzaMode,
    productSections,
    products,
    removeBorder,
    removeCategory,
    removeFlavor,
    removeProduct,
    removeSize,
    roundSizes,
    saveMenu,
    saving,
    search,
    selectedProductSection,
    selectedProductSectionProducts,
    setActiveTab: changeActiveTab,
    setPizzaMode,
    setSearch,
    setSizes,
    sizes,
    squareSizes,
    success,
    updateBorderName,
    updateBorderActive,
    updateBorderPrice,
    updateCategory,
    updateFlavorCategory,
    updateFlavorDescription,
    updateFlavorImage,
    updateFlavorName,
    updateFlavorActive,
    updatePizzaPrice,
    updateProduct,
    visibleSizes,
  };
}
