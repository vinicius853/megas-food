import { ImageIcon, Plus } from "lucide-react";

import { capitalizePublicDisplayName } from "./public-menu-display-text";
import { formatMoney, formatShortMoney } from "./public-menu-formatters";
import type {
  FixedProductCard,
  FlavorCard,
  MenuPalette,
} from "./public-menu.types";

type PublicFlavorCardProps = {
  flavor: FlavorCard;
  palette: MenuPalette;
  storeOpen: boolean;
  onAdd: (flavorId: string) => void;
};

export function PublicFlavorCard({
  flavor,
  palette,
  storeOpen,
  onAdd,
}: PublicFlavorCardProps) {
  const displayName = capitalizePublicDisplayName(flavor.name);

  return (
    <div>
      <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 pb-12 shadow-sm shadow-slate-950/5 transition hover:border-slate-300 hover:bg-slate-50">
        <div className="grid grid-cols-[80px_1fr] items-start gap-3">
          {flavor.image ? (
            <img
              src={flavor.image}
              alt={displayName}
              className="h-[80px] w-[80px] rounded-lg object-cover shadow-sm"
            />
          ) : (
            <ProductImagePlaceholder />
          )}

          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950">
              {displayName}
            </h3>

            {flavor.description ? (
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500">
                {flavor.description}
              </p>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-y-2 pr-9 sm:grid-cols-4 sm:gap-y-1 sm:pr-10">
              {flavor.prices.slice(0, 4).map((price, priceIndex) => (
                <div
                  key={price.label}
                  className={`min-w-0 border-slate-200 px-2 text-left sm:px-3 ${
                    priceIndex % 2 === 0 ? "border-l-0 pl-0" : "border-l"
                  } ${
                    priceIndex === 0
                      ? "sm:border-l-0 sm:pl-0"
                      : "sm:border-l sm:pl-3"
                  }`}
                >
                  <p className="truncate text-xs font-black text-slate-800">
                    {price.label}
                  </p>
                  {price.subtitle ? (
                    <p className="truncate text-[10px] font-semibold text-slate-500">
                      {price.subtitle}
                    </p>
                  ) : null}
                  <p
                    className="mt-0.5 whitespace-nowrap text-sm font-black leading-tight"
                    style={{ color: palette.primary }}
                  >
                    R$ {formatShortMoney(price.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onAdd(flavor.id)}
            disabled={!storeOpen}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
            style={{ backgroundColor: storeOpen ? palette.primary : "#94A3B8" }}
            aria-label={`Adicionar ${displayName}`}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </article>
    </div>
  );
}

type PublicFixedProductCardProps = {
  product: FixedProductCard;
  palette: MenuPalette;
  storeOpen: boolean;
  onAdd: (product: FixedProductCard) => void;
};

export function PublicFixedProductCard({
  product,
  palette,
  storeOpen,
  onAdd,
}: PublicFixedProductCardProps) {
  const displayName = capitalizePublicDisplayName(product.name);

  return (
    <div>
      <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 pb-12 shadow-sm shadow-slate-950/5 transition hover:border-slate-300 hover:bg-slate-50">
        <div className="grid grid-cols-[80px_1fr] items-start gap-3">
          {product.image ? (
            <img
              src={product.image}
              alt={displayName}
              className="h-[80px] w-[80px] rounded-lg object-cover shadow-sm"
            />
          ) : (
            <ProductImagePlaceholder />
          )}

          <div className="min-w-0 pr-9">
            <h3 className="line-clamp-2 text-base font-black leading-tight text-slate-950">
              {displayName}
            </h3>

            {product.description ? (
              <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500">
                {product.description}
              </p>
            ) : null}

            <div
              className="mt-2 text-sm font-black"
              style={{ color: palette.primary }}
            >
              {formatMoney(product.price)}
            </div>
          </div>

          <button
            onClick={() => onAdd(product)}
            disabled={!storeOpen}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
            style={{ backgroundColor: storeOpen ? palette.primary : "#94A3B8" }}
            aria-label={`Adicionar ${displayName}`}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </article>
    </div>
  );
}

function ProductImagePlaceholder() {
  return (
    <div className="flex h-[80px] w-[80px] items-center justify-center rounded-lg bg-slate-100 text-slate-400">
      <ImageIcon className="h-6 w-6" aria-hidden="true" />
    </div>
  );
}
