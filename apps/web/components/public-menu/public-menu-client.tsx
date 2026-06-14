"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { PublicLegalFooter } from "@/components/legal/public-legal-footer";

import { CartDrawer } from "./cart-drawer";
import { CartProvider, useCart } from "./cart-context";
import { PizzaConfiguratorFlow } from "./pizza-configurator-flow";
import { AddedToCartToast, BottomCartBar } from "./public-menu-feedback";
import { getCategoryIcon, getSectionDomId } from "./public-menu-formatters";
import { getStoreOpenStatus } from "./public-menu-hours";
import {
  buildCategoryTabs,
  buildMenuSections,
  getPizzaProductFromV2,
  isAdditionalCategory,
  mapFixedProductCardsFromV2,
  mapFlavorCardsFromV2,
} from "./public-menu-mappers";
import {
  PublicFixedProductCard,
  PublicFlavorCard,
} from "./public-menu-product-card";
import { getMenuPalette } from "./public-menu-theme";
import type {
  FixedProductCard,
  PublicMenuV2Response,
} from "./public-menu.types";

function PublicMenuContent({ slug }: { slug: string }) {
  const { addItem, totalItems, totalPrice } = useCart();

  const [menuV2Data, setMenuV2Data] = useState<PublicMenuV2Response | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedFlavorId, setSelectedFlavorId] = useState<string | null>(null);
  const [pizzaFlowOpen, setPizzaFlowOpen] = useState(false);
  const [drinkSuggestionShown, setDrinkSuggestionShown] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<{
    name: string;
    imageUrl?: string;
  } | null>(null);
  const [cartPulseKey, setCartPulseKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadMenu() {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch<PublicMenuV2Response>(
          `/public-menu-v2/${slug}`,
        );

        if (!active) return;

        setMenuV2Data(response);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error ? err.message : "Erro ao carregar cardapio.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMenu();

    return () => {
      active = false;
    };
  }, [slug]);

  const tenant = menuV2Data?.tenant;
  const customization = menuV2Data?.customization;
  const palette = getMenuPalette(customization?.paletteId);
  const tenantName =
    customization?.brandName || tenant?.name || "Sabor & Lenha";
  const menuTagline = customization?.tagline || "Cardapio digital";
  const menuLogo = customization?.logoUrl || tenant?.logoUrl || "";
  const menuCover = customization?.coverUrl;
  const storeStatus = useMemo(() => {
    const openStatus = getStoreOpenStatus(menuV2Data?.delivery);

    if (!openStatus.isOpen) {
      return openStatus;
    }

    if (menuV2Data?.subscription && !menuV2Data.subscription.canAcceptOrders) {
      return {
        isOpen: false,
        message:
          "Este cardapio nao esta recebendo pedidos no momento. Entre em contato com a loja.",
      };
    }

    return openStatus;
  }, [menuV2Data?.delivery, menuV2Data?.subscription]);
  const pizzaProductV2 = menuV2Data ? getPizzaProductFromV2(menuV2Data) : null;
  const flavorCards = useMemo(
    () => (menuV2Data ? mapFlavorCardsFromV2(menuV2Data) : []),
    [menuV2Data],
  );
  const fixedProducts = useMemo(
    () => (menuV2Data ? mapFixedProductCardsFromV2(menuV2Data) : []),
    [menuV2Data],
  );
  const pizzaAdditionalProducts = useMemo(
    () =>
      fixedProducts
        .filter((product) => isAdditionalCategory(product.categoryName))
        .map((product) => ({
          id: product.product.id,
          name: product.name,
          description: product.description,
          imageUrl: product.image,
          price: product.price,
        })),
    [fixedProducts],
  );
  const visibleFixedProducts = useMemo(() => fixedProducts, [fixedProducts]);
  const categories = useMemo(
    () => buildCategoryTabs(flavorCards, visibleFixedProducts),
    [flavorCards, visibleFixedProducts],
  );
  const currentCategory = categories.includes(activeCategory)
    ? activeCategory
    : "Todos";

  const searchText = search.trim().toLowerCase();
  const activeCategoryText = currentCategory.toLowerCase();

  const filteredFlavors = flavorCards.filter((flavor) => {
    const matchesSearch =
      !searchText ||
      flavor.name.toLowerCase().includes(searchText) ||
      flavor.description.toLowerCase().includes(searchText);

    const matchesCategory =
      currentCategory === "Todos" ||
      flavor.categoryName.toLowerCase() === activeCategoryText;

    return matchesSearch && matchesCategory;
  });

  const filteredProducts = visibleFixedProducts.filter((product) => {
    const matchesSearch =
      !searchText ||
      product.name.toLowerCase().includes(searchText) ||
      product.description.toLowerCase().includes(searchText);

    const matchesCategory =
      currentCategory === "Todos" ||
      product.categoryName.toLowerCase() === activeCategoryText;

    return matchesSearch && matchesCategory;
  });

  const menuSections = useMemo(
    () => buildMenuSections(filteredFlavors, filteredProducts),
    [filteredFlavors, filteredProducts],
  );

  useEffect(() => {
    if (!addedFeedback) return undefined;

    const timeout = window.setTimeout(() => {
      setAddedFeedback(null);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [addedFeedback]);

  function showAddedFeedback(item: { name: string; imageUrl?: string }) {
    setAddedFeedback(item);
    setCartPulseKey((current) => current + 1);
  }

  function openPizzaFlow(flavorId: string) {
    if (!storeStatus.isOpen) {
      alert(storeStatus.message);
      return;
    }

    setSelectedFlavorId(flavorId);
    setPizzaFlowOpen(true);
  }

  function addFixedProduct(product: FixedProductCard) {
    if (!storeStatus.isOpen) {
      alert(storeStatus.message);
      return;
    }

    addItem({
      id: crypto.randomUUID(),
      productId: product.product.id,
      productName: product.name,
      imageUrl: product.image,
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price,
      selectedModifiers: [],
      displayGroups: [],
    });

    showAddedFeedback({
      name: product.name,
      imageUrl: product.image,
    });
  }

  function scrollToDrinks() {
    setActiveCategory("Bebidas");
    setDrinkSuggestionShown(true);

    window.requestAnimationFrame(() => {
      document.getElementById(getSectionDomId("Bebidas"))?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handleOrderFinished() {
    setActiveCategory("Todos");
    setSearch("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function markDrinkSuggestionShown() {
    setDrinkSuggestionShown(true);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-200 font-sans text-slate-950">
        <div className="mx-auto min-h-screen w-full max-w-[860px] bg-slate-50 p-4 shadow-2xl">
          <div className="h-3 animate-pulse bg-red-700" />
          <div className="mt-4 h-12 animate-pulse rounded-full bg-white" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-lg bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !menuV2Data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-200 p-4 font-sans text-slate-950">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-slate-950">
            Cardapio indisponivel
          </h1>
          <p className="mt-3 text-sm text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main
      data-slug={slug}
      className="min-h-screen bg-slate-200 font-sans text-slate-950"
    >
      <div className="mx-auto min-h-screen w-full max-w-[860px] bg-slate-50 shadow-2xl">
        <header
          className="relative min-h-[190px] w-full overflow-hidden bg-slate-900 px-4 pb-16 pt-5 text-white shadow-sm sm:min-h-[230px] sm:px-8"
          style={{ backgroundColor: palette.primary }}
        >
          {menuCover && (
            <>
              <img
                src={menuCover}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 block h-full w-full object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, #00000099, ${palette.primary}55)`,
                }}
              />
            </>
          )}

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center">
              <div className="flex min-h-14 max-w-[190px] items-center justify-center overflow-hidden">
                {menuLogo ? (
                  <img
                    src={menuLogo}
                    alt={tenantName}
                    className="max-h-16 max-w-[190px] object-contain drop-shadow-lg"
                  />
                ) : (
                  <div className="rounded-2xl bg-black/35 px-4 py-3 backdrop-blur">
                    <p className="text-base font-black uppercase leading-none text-white">
                      {tenantName}
                    </p>
                    <p
                      className="mt-1 text-[10px] font-black uppercase tracking-[0.2em]"
                      style={{ color: palette.accent }}
                    >
                      {menuTagline}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-lg transition active:scale-95"
            >
              <ShoppingCart className="h-5 w-5" />

              {totalItems > 0 && (
                <span
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-black text-white"
                  style={{ backgroundColor: palette.secondary }}
                >
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </header>

        <section className="relative z-20 -mt-8 px-4 sm:px-8">
          <div className="flex gap-3">
            <div className="flex h-14 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 shadow-xl shadow-slate-950/15">
              <Search className="h-5 w-5 flex-shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar pizzas, bebidas..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </section>

        <section className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-shrink-0 rounded-full border px-4 py-2 text-xs font-black shadow-sm transition-all ${
                  currentCategory === category
                    ? "text-white"
                    : "border-slate-200 bg-white text-slate-950"
                }`}
                style={
                  currentCategory === category
                    ? {
                        backgroundColor: palette.primary,
                        borderColor: palette.primary,
                        color: palette.textOnPrimary,
                      }
                    : undefined
                }
              >
                <span className="mr-2">
                  {category === "Todos" ? "" : getCategoryIcon(category)}
                </span>
                {category}
              </button>
            ))}
          </div>
        </section>

        {!storeStatus.isOpen && (
          <section className="border-b border-red-100 bg-red-50 px-4 py-3 sm:px-8">
            <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 shadow-sm">
              {storeStatus.message} Voce pode consultar o cardapio, mas os
              pedidos estao pausados.
            </div>
          </section>
        )}

        <section className="px-4 pb-32 pt-4 sm:px-8">
          <div className="space-y-5">
            {menuSections.map((section) => (
              <div
                key={section.id}
                id={getSectionDomId(section.title)}
                className="space-y-2 scroll-mt-28"
              >
                <div
                  className="border-b-2 pb-2"
                  style={{ borderColor: palette.primary }}
                >
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">
                    <span className="mr-2">
                      {getCategoryIcon(section.title)}
                    </span>
                    {section.title}
                  </h2>
                </div>

                {section.type === "flavors"
                  ? section.items.map((flavor) => (
                      <PublicFlavorCard
                        key={flavor.id}
                        flavor={flavor}
                        palette={palette}
                        storeOpen={storeStatus.isOpen}
                        onAdd={openPizzaFlow}
                      />
                    ))
                  : section.items.map((product) => (
                      <PublicFixedProductCard
                        key={product.id}
                        product={product}
                        palette={palette}
                        storeOpen={storeStatus.isOpen}
                        onAdd={addFixedProduct}
                      />
                    ))}
              </div>
            ))}

            {menuSections.length === 0 && (
              <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-slate-400">
                Nenhum item encontrado.
              </div>
            )}
          </div>
        </section>
        <PublicLegalFooter />
      </div>

      <BottomCartBar
        cartPulseKey={cartPulseKey}
        totalItems={totalItems}
        totalPrice={totalPrice}
        palette={palette}
        onOpenCart={() => setCartOpen(true)}
      />

      <AddedToCartToast item={addedFeedback} palette={palette} />

      {pizzaProductV2 && pizzaFlowOpen && (
        <PizzaConfiguratorFlow
          open
          tenantSlug={tenant?.slug ?? slug}
          product={pizzaProductV2}
          initialFlavorOptionId={selectedFlavorId}
          additionalProducts={pizzaAdditionalProducts}
          onClose={() => setPizzaFlowOpen(false)}
          shouldOfferDrinkSuggestion={
            !drinkSuggestionShown && categories.includes("Bebidas")
          }
          onDrinkSuggestionShown={markDrinkSuggestionShown}
          onViewDrinks={scrollToDrinks}
          onOpenCart={() => setCartOpen(true)}
          onItemAdded={showAddedFeedback}
        />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onOrderFinished={handleOrderFinished}
        tenantName={tenantName}
        tenantSlug={tenant?.slug ?? slug}
        storeWhatsappPhone={tenant?.whatsapp ?? null}
        palette={palette}
        delivery={menuV2Data.delivery}
        ordersEnabled={storeStatus.isOpen}
        closedMessage={storeStatus.message}
      />
      <CookieBanner />
    </main>
  );
}

export default function PublicMenuClient({ slug }: { slug: string }) {
  return (
    <CartProvider>
      <PublicMenuContent slug={slug} />
    </CartProvider>
  );
}
