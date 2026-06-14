"use client";

import { ArrowLeft, ImageIcon, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "./cart-context";
import { ConfiguratorSelectionFooter } from "./configurator-selection-footer";
import {
  PizzaConfiguratorDrinkSuggestion,
  PizzaConfiguratorDrinkSuggestionFooter,
} from "./pizza-configurator-drink-suggestion";
import {
  getFlavorLimitLabel,
  getSizeFlavorDescription,
  normalizeMaxFlavors,
  toNumber,
} from "./pizza-configurator-helpers";
import { OptionCard } from "./pizza-configurator-option-card";
import {
  BORDER_GROUP_CODE,
  buildCartDisplayGroups,
  buildSelectedModifierRequest,
  FLAVOR_GROUP_CODE,
  SIZE_GROUP_CODE,
  withSelectedModifierDisplay,
} from "./pizza-configurator-modifiers";
import { PizzaConfiguratorSummary } from "./pizza-configurator-summary";
import { getV2ContextualOptionPrice } from "./public-menu-mappers";
import {
  calculatePriceEngineShadow,
  comparePriceEngineShadow,
} from "./price-engine-shadow";
import type { PublicMenuV2Option } from "./public-menu.types";
import type {
  PizzaConfiguratorFlowProps,
  SelectionMode,
  Step,
} from "./pizza-configurator.types";

type SelectionFooterConfig = {
  selectedCount: number;
  minSelections: number;
  maxSelections: number;
  required: boolean;
  onContinue: () => void;
};

export function PizzaConfiguratorFlow({
  open,
  tenantSlug,
  product,
  initialFlavorOptionId,
  additionalProducts = [],
  onClose,
  shouldOfferDrinkSuggestion = false,
  onDrinkSuggestionShown,
  onViewDrinks,
  onOpenCart,
  onItemAdded,
}: PizzaConfiguratorFlowProps) {
  const { addItem } = useCart();

  const [step, setStep] = useState<Step>("size");
  const [selectedSizeOptionId, setSelectedSizeOptionId] = useState("");
  const [mode, setMode] = useState<SelectionMode>("whole");
  const firstFlavorOptionId = initialFlavorOptionId ?? "";
  const [extraFlavorOptionIds, setExtraFlavorOptionIds] = useState<string[]>(
    [],
  );
  const [selectedBorderOptionId, setSelectedBorderOptionId] = useState("");
  const [selectedAdditionalIds, setSelectedAdditionalIds] = useState<string[]>(
    [],
  );
  const [notes, setNotes] = useState("");

  const sizeGroup = product?.modifierGroups.find(
    (group) => group.code === SIZE_GROUP_CODE,
  );
  const flavorGroup = product?.modifierGroups.find(
    (group) => group.code === FLAVOR_GROUP_CODE,
  );
  const borderGroup = product?.modifierGroups.find(
    (group) => group.code === BORDER_GROUP_CODE,
  );

  const productSizes = useMemo(() => {
    if (!product || !sizeGroup || !flavorGroup) return [];

    const selectedFlavor = flavorGroup.options.find(
      (option) => option.id === firstFlavorOptionId,
    );

    return sizeGroup.options
      .filter((option) => {
        if (!option.isActive) return false;
        if (!selectedFlavor) return true;

        return getV2ContextualOptionPrice(selectedFlavor, option.id) > 0;
      })
      .map((option) => {
        const flavorRule = option.rules.find(
          (rule) => rule.targetGroupId === flavorGroup.id,
        );

        return {
          ...option,
          minFlavors: Math.max(
            Number(flavorRule?.minSelections ?? flavorGroup.minSelections) || 0,
            0,
          ),
          maxFlavors: normalizeMaxFlavors(
            flavorRule?.maxSelections ?? flavorGroup.maxSelections,
          ),
          allowBorder: borderGroup
            ? Boolean(
                option.rules.find(
                  (rule) => rule.targetGroupId === borderGroup.id,
                )?.isEnabled,
              )
            : false,
        };
      })
      .slice(0, 4);
  }, [borderGroup, firstFlavorOptionId, flavorGroup, product, sizeGroup]);

  const selectedSize = productSizes.find(
    (option) => option.id === selectedSizeOptionId,
  );

  const activeFlavorOptions =
    flavorGroup?.options.filter((option) => option.isActive) ?? [];
  const firstFlavor =
    activeFlavorOptions.find((option) => option.id === firstFlavorOptionId) ??
    null;

  const extraFlavors = extraFlavorOptionIds
    .map((optionId) =>
      activeFlavorOptions.find((option) => option.id === optionId),
    )
    .filter(Boolean) as PublicMenuV2Option[];

  const availableFlavors = selectedSize
    ? activeFlavorOptions.filter(
        (option) => getV2ContextualOptionPrice(option, selectedSize.id) > 0,
      )
    : [];

  function getFlavorPrice(flavorOptionId: string) {
    const flavor = activeFlavorOptions.find(
      (option) => option.id === flavorOptionId,
    );

    return flavor && selectedSize
      ? getV2ContextualOptionPrice(flavor, selectedSize.id)
      : 0;
  }

  const selectedFlavorOptionIds = useMemo(
    () =>
      [
        firstFlavorOptionId,
        ...(mode === "multi" ? extraFlavorOptionIds : []),
      ].filter(Boolean),
    [extraFlavorOptionIds, firstFlavorOptionId, mode],
  );

  const unitPrice =
    selectedFlavorOptionIds.length > 0
      ? Math.max(...selectedFlavorOptionIds.map(getFlavorPrice))
      : 0;

  const activeBorderOptions =
    borderGroup?.options.filter((option) => option.isActive) ?? [];
  const selectedBorder =
    activeBorderOptions.find(
      (option) => option.id === selectedBorderOptionId,
    ) ?? null;

  const selectedBorderPrice =
    selectedSize && selectedBorder
      ? getV2ContextualOptionPrice(selectedBorder, selectedSize.id)
      : 0;

  const availableAdditionalProducts = additionalProducts.filter(
    (additional) => toNumber(additional.price) > 0,
  );

  const selectedAdditionalItems = availableAdditionalProducts.filter(
    (additional) => selectedAdditionalIds.includes(additional.id),
  );

  const selectedAdditionalTotal = selectedAdditionalItems.reduce(
    (total, additional) => total + toNumber(additional.price),
    0,
  );

  const totalPrice = unitPrice + selectedBorderPrice + selectedAdditionalTotal;
  const selectedModifierRequest =
    product && selectedSize && selectedFlavorOptionIds.length > 0
      ? buildSelectedModifierRequest({
          productId: product.id,
          sizeOptionId: selectedSize.id,
          flavorOptionIds: selectedFlavorOptionIds,
          borderOptionId: selectedBorder?.id,
        })
      : null;

  useEffect(() => {
    if (!open || !product || totalPrice <= 0) return;

    if (!selectedModifierRequest) return;

    let cancelled = false;

    calculatePriceEngineShadow(tenantSlug, selectedModifierRequest)
      .then((result) => {
        if (cancelled) return;

        const comparison = comparePriceEngineShadow({
          configuredTotalPrice: totalPrice,
          additionalTotalPrice: selectedAdditionalTotal,
          priceEngineTotalPrice: result.totalPrice,
        });

        if (
          process.env.NODE_ENV !== "production" &&
          (comparison.diverged || result.validationErrors.length > 0)
        ) {
          console.warn("[PriceEngine shadow] divergence detected", {
            productId: product.id,
            configuredTotalPrice: totalPrice,
            priceEngineTotalPrice: result.totalPrice,
            comparison,
            validationErrors: result.validationErrors,
            request: selectedModifierRequest,
          });
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[PriceEngine shadow] price unavailable", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    product,
    selectedModifierRequest,
    selectedAdditionalTotal,
    selectedBorder?.id,
    selectedFlavorOptionIds,
    selectedSize?.id,
    tenantSlug,
    totalPrice,
  ]);

  const hasAdditionalProducts = availableAdditionalProducts.length > 0;
  const availableBorderOptions = selectedSize
    ? activeBorderOptions.filter(
        (border) =>
          getV2ContextualOptionPrice(border, selectedSize.id) > 0,
      )
    : [];

  function nextAfterFlavorChoice(size = selectedSize) {
    return size?.allowBorder
      ? "borderQuestion"
      : hasAdditionalProducts
        ? "additionalQuestion"
        : "summary";
  }

  function nextAfterBorderChoice() {
    return hasAdditionalProducts ? "additionalQuestion" : "summary";
  }

  const selectionFooter: SelectionFooterConfig | null = (() => {
    if (step === "secondFlavor" && selectedSize) {
      return {
        selectedCount: selectedFlavorOptionIds.length,
        minSelections: selectedSize.minFlavors,
        maxSelections: selectedSize.maxFlavors,
        required: selectedSize.minFlavors > 0,
        onContinue: () => setStep(nextAfterFlavorChoice(selectedSize)),
      };
    }

    if (step === "borderSelect" && borderGroup) {
      return {
        selectedCount: selectedBorderOptionId ? 1 : 0,
        minSelections: borderGroup.minSelections,
        maxSelections: Math.max(borderGroup.maxSelections, 1),
        required: borderGroup.isRequired,
        onContinue: () => setStep(nextAfterBorderChoice()),
      };
    }

    if (step === "additionalSelect") {
      return {
        selectedCount: selectedAdditionalIds.length,
        minSelections: 0,
        maxSelections: Math.max(availableAdditionalProducts.length, 1),
        required: false,
        onContinue: () => setStep("summary"),
      };
    }

    return null;
  })();

  function goBack() {
    if (step === "size") {
      onClose();
      return;
    }

    if (step === "mode") setStep("size");
    if (step === "secondFlavor") setStep("mode");
    if (step === "borderQuestion") {
      setStep(mode === "multi" ? "secondFlavor" : "mode");
    }
    if (step === "borderSelect") setStep("borderQuestion");
    if (step === "additionalQuestion") {
      setStep(
        selectedSize?.allowBorder
          ? "borderQuestion"
          : mode === "multi"
            ? "secondFlavor"
            : "mode",
      );
    }
    if (step === "additionalSelect") setStep("additionalQuestion");
    if (step === "summary") {
      setStep(
        hasAdditionalProducts
          ? "additionalQuestion"
          : selectedSize?.allowBorder
            ? "borderQuestion"
            : mode === "multi"
              ? "secondFlavor"
              : "mode",
      );
    }
    if (step === "drinkSuggestion") onClose();
  }

  function toggleExtraFlavor(flavorId: string) {
    const maxExtras = Math.max((selectedSize?.maxFlavors ?? 1) - 1, 0);

    setExtraFlavorOptionIds((current) => {
      if (current.includes(flavorId)) {
        return current.filter((id) => id !== flavorId);
      }

      if (current.length >= maxExtras) {
        return current;
      }

      return [...current, flavorId];
    });
  }

  function toggleAdditional(additionalId: string) {
    setSelectedAdditionalIds((current) =>
      current.includes(additionalId)
        ? current.filter((id) => id !== additionalId)
        : [...current, additionalId],
    );
  }

  function addPizzaToCart() {
    if (!product || !selectedSize || !firstFlavor || totalPrice <= 0)
      return false;

    if (!selectedModifierRequest) return false;

    const selectedModifiers = withSelectedModifierDisplay(
      selectedModifierRequest.selectedModifiers,
      {
        selectedSize,
        selectedFlavors: [firstFlavor, ...extraFlavors],
        selectedBorder: selectedBorder ?? undefined,
        selectedBorderPrice,
      },
    );

    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      imageUrl: heroImage,
      selectedModifiers,
      displayGroups: buildCartDisplayGroups(selectedModifiers),
      additionalItems: selectedAdditionalItems.map((additional) => ({
        productId: additional.id,
        name: additional.name,
        price: toNumber(additional.price),
      })),
      quantity: 1,
      unitPrice,
      totalPrice,
      notes: notes.trim() || undefined,
    });

    return true;
  }

  function handleFinish() {
    const added = addPizzaToCart();

    if (added) {
      onItemAdded?.({
        name: firstFlavor?.name || product?.name || "Item",
        imageUrl: heroImage,
      });

      if (shouldOfferDrinkSuggestion) {
        onDrinkSuggestionShown?.();
        setStep("drinkSuggestion");
        return;
      }
    }

    onClose();
  }

  if (!open || !product) return null;

  const heroImage = firstFlavor?.imageUrl || product.imageUrl || undefined;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 font-sans md:items-center">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl md:max-h-[calc(100vh-3rem)] md:rounded-[28px]">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 px-3 text-center">
            <h2 className="truncate text-sm font-black text-slate-950">
              {firstFlavor?.name || product.name}
              {selectedSize ? ` · ${selectedSize.name}` : ""}
            </h2>
            <p className="truncate text-xs font-semibold text-slate-500">
              {firstFlavor?.description ||
                product.description ||
                "Monte seu pedido"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          className={`min-h-0 flex-1 overflow-y-auto px-4 py-5 ${
            selectionFooter ? "pb-28" : ""
          }`}
        >
          <div className="mb-5 flex items-center gap-3">
            {heroImage ? (
              <img
                src={heroImage}
                alt={firstFlavor?.name || product.name}
                className="h-20 w-20 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ImageIcon className="h-7 w-7" aria-hidden="true" />
              </div>
            )}
            <div>
              <p className="text-lg font-black text-slate-950">
                {firstFlavor?.name || product.name}
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">
                {firstFlavor?.description || product.description}
              </p>
            </div>
          </div>

          {step === "size" && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Qual tamanho deseja?
              </h3>
              {productSizes.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  Este sabor ainda nao tem preco cadastrado em nenhum tamanho.
                </div>
              ) : (
                <div className="grid gap-3">
                  {productSizes.map((size) => {
                    const price = firstFlavor
                      ? getV2ContextualOptionPrice(firstFlavor, size.id)
                      : 0;

                    return (
                      <OptionCard
                        key={size.id}
                        title={size.name}
                        description={getSizeFlavorDescription(size.maxFlavors)}
                        price={price}
                        selected={selectedSizeOptionId === size.id}
                        onClick={() => {
                          setSelectedSizeOptionId(size.id);
                          setExtraFlavorOptionIds([]);
                          setSelectedBorderOptionId("");
                          setStep("mode");
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {step === "mode" && selectedSize && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                {selectedSize.maxFlavors > 1
                  ? "Como deseja montar?"
                  : "Pizza inteira"}
              </h3>
              <div
                className={`grid gap-3 ${selectedSize.maxFlavors > 1 ? "grid-cols-2" : "grid-cols-1"}`}
              >
                <OptionCard
                  title="Inteira"
                  description="1 sabor"
                  selected={mode === "whole"}
                  onClick={() => {
                    setMode("whole");
                    setExtraFlavorOptionIds([]);
                    setStep(nextAfterFlavorChoice(selectedSize));
                  }}
                />

                {selectedSize.maxFlavors > 1 && (
                  <OptionCard
                    title={getFlavorLimitLabel(selectedSize.maxFlavors)}
                    description={`Escolha ate ${selectedSize.maxFlavors} sabores`}
                    selected={mode === "multi"}
                    onClick={() => {
                      setMode("multi");
                      setStep("secondFlavor");
                    }}
                  />
                )}
              </div>
            </section>
          )}

          {step === "secondFlavor" && selectedSize && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Escolha os sabores
              </h3>
              <div className="grid gap-3">
                {availableFlavors
                  .filter((flavor) => flavor.id !== firstFlavorOptionId)
                  .map((flavor) => (
                    <OptionCard
                      key={flavor.id}
                      title={flavor.name}
                      description={flavor.description ?? undefined}
                      price={getFlavorPrice(flavor.id)}
                      selected={extraFlavorOptionIds.includes(flavor.id)}
                      onClick={() => {
                        toggleExtraFlavor(flavor.id);
                      }}
                    />
                  ))}
              </div>
            </section>
          )}

          {step === "borderQuestion" && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Deseja borda recheada?
              </h3>
              <div className="grid gap-3">
                <OptionCard
                  title="Sim, quero borda"
                  description="Escolher sabor da borda"
                  onClick={() => setStep("borderSelect")}
                />
                <OptionCard
                  title="Nao, obrigado"
                  description="Prefiro sem borda"
                  onClick={() => {
                    setSelectedBorderOptionId("");
                    setStep(nextAfterBorderChoice());
                  }}
                />
              </div>
            </section>
          )}

          {step === "borderSelect" && selectedSize && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Escolha sua borda recheada
              </h3>
              <div className="grid gap-3">
                {availableBorderOptions.map((border) => {
                    const price = getV2ContextualOptionPrice(
                      border,
                      selectedSize.id,
                    );

                    return (
                      <OptionCard
                        key={border.id}
                        title={border.name}
                        price={price}
                        selected={selectedBorderOptionId === border.id}
                        onClick={() => {
                          setSelectedBorderOptionId((current) =>
                            current === border.id ? "" : border.id,
                          );
                        }}
                      />
                    );
                  })}
              </div>
            </section>
          )}

          {step === "additionalQuestion" && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Deseja adicionar algum extra?
              </h3>
              <div className="grid gap-3">
                <OptionCard
                  title="Sim, quero adicionais"
                  description="Escolher bacon, cheddar e outros extras"
                  onClick={() => setStep("additionalSelect")}
                />
                <OptionCard
                  title="Nao, obrigado"
                  description="Continuar sem adicionais"
                  onClick={() => {
                    setSelectedAdditionalIds([]);
                    setStep("summary");
                  }}
                />
              </div>
            </section>
          )}

          {step === "additionalSelect" && (
            <section>
              <h3 className="mb-4 text-lg font-black text-slate-950">
                Escolha seus adicionais
              </h3>
              <div className="grid gap-3">
                {availableAdditionalProducts.map((additional) => (
                  <OptionCard
                    key={additional.id}
                    title={additional.name}
                    description={additional.description ?? undefined}
                    price={toNumber(additional.price)}
                    selected={selectedAdditionalIds.includes(additional.id)}
                    onClick={() => toggleAdditional(additional.id)}
                  />
                ))}
              </div>

            </section>
          )}

          {step === "summary" && (
            <PizzaConfiguratorSummary
              productName={product.name}
              sizeOptionLabel={selectedSize?.name}
              flavorOptionLabels={[
                firstFlavor?.name ?? "",
                ...extraFlavors.map((flavor) => flavor.name),
              ]}
              borderOptionLabel={selectedBorder?.name}
              additionalNames={selectedAdditionalItems.map(
                (additional) => additional.name,
              )}
              isMulti={mode === "multi"}
              notes={notes}
              onNotesChange={setNotes}
              totalPrice={totalPrice}
            />
          )}

          {step === "drinkSuggestion" && <PizzaConfiguratorDrinkSuggestion />}
        </div>

        {selectionFooter && (
          <ConfiguratorSelectionFooter
            selectedCount={selectionFooter.selectedCount}
            minSelections={selectionFooter.minSelections}
            maxSelections={selectionFooter.maxSelections}
            required={selectionFooter.required}
            onContinue={selectionFooter.onContinue}
          />
        )}

        {step === "summary" && (
          <footer className="border-t border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={handleFinish}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-700 text-base font-black text-white shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Adicionar ao carrinho
            </button>
          </footer>
        )}

        {step === "drinkSuggestion" && (
          <PizzaConfiguratorDrinkSuggestionFooter
            onViewDrinks={() => {
              onClose();
              onViewDrinks();
            }}
            onOpenCart={() => {
              onClose();
              onOpenCart();
            }}
          />
        )}
      </div>
    </div>
  );
}
