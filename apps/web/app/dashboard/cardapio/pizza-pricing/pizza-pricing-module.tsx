"use client";

import { PizzaFlavorList } from "./pizza-flavor-list";
import { PizzaSizesPanel } from "./pizza-sizes-panel";
import type { PizzaPricingModuleProps } from "./pizza-pricing-types";

export function PizzaPricingModule(props: PizzaPricingModuleProps) {
  return (
    <div className="min-w-0 space-y-4">
      <PizzaSizesPanel
        baseCategories={props.pizzaBaseCategories}
        baseCategoryId={props.pizzaBaseCategoryId}
        needsBaseCategory={props.needsPizzaBaseCategory}
        sizes={props.sizes}
        onAdd={props.onAddSize}
        onBaseCategoryChange={props.onUpdatePizzaBaseCategory}
        onRemove={props.onRemoveSize}
        onUpdate={props.onUpdateSize}
      />

      <PizzaFlavorList
        flavorGroups={props.flavorGroups}
        flavorPrices={props.flavorPrices}
        flavors={props.flavors}
        search={props.search}
        sizes={props.sizes}
        onAddFlavor={props.onAddFlavor}
        onRemoveFlavor={props.onRemoveFlavor}
        onSearchChange={props.setSearch}
        onSetAvailability={props.onSetFlavorSizeAvailability}
        onUpdateActive={props.onUpdateFlavorActive}
        onUpdateCategory={props.onUpdateFlavorCategory}
        onUpdateDescription={props.onUpdateFlavorDescription}
        onUpdateImage={props.onUpdateFlavorImage}
        onUpdateName={props.onUpdateFlavorName}
        onUpdatePrice={props.onUpdatePizzaPrice}
      />
    </div>
  );
}
