import { MoneyInput } from "../components/money-input";
import type {
  FlavorOptionMatrixRow,
  FlavorPrice,
  SizeOptionMatrixRow,
} from "../types/menu-management";
import { findFlavorPriceRecord } from "./pizza-pricing-helpers";

type Props = {
  flavor: FlavorOptionMatrixRow;
  prices: FlavorPrice[];
  sizes: SizeOptionMatrixRow[];
  onAvailabilityChange: (
    productId: string,
    flavorId: string,
    sizeId: string,
    enabled: boolean,
  ) => void;
  onPriceChange: (
    productId: string,
    flavorId: string,
    sizeId: string,
    value: string,
  ) => void;
};

export function PizzaPriceGrid({
  flavor,
  prices,
  sizes,
  onAvailabilityChange,
  onPriceChange,
}: Props) {
  if (sizes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-5 text-sm font-bold text-orange-800">
        Cadastre um tamanho para definir onde este sabor estará disponível.
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {sizes.map((size) => {
        const price = findFlavorPriceRecord(
          prices,
          size.productId,
          flavor.id,
          size.id,
        );
        const available = price?.isActive === true;
        const disabled = !size.isActive;

        return (
          <article
            key={`${size.productId}:${size.id}`}
            className={`min-w-0 rounded-2xl border p-3 ${
              available && !disabled
                ? "border-orange-200 bg-orange-50/50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {size.name || "Novo tamanho"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {disabled
                    ? "Tamanho inativo"
                    : available
                      ? "Disponível"
                      : "Não disponível"}
                </p>
              </div>

              <input
                type="checkbox"
                checked={available}
                disabled={disabled}
                onChange={(event) =>
                  onAvailabilityChange(
                    size.productId,
                    flavor.id,
                    size.id,
                    event.target.checked,
                  )
                }
                className="h-4 w-4 shrink-0 accent-orange-600"
                aria-label={`Disponibilidade em ${size.name}`}
              />
            </div>

            <div className="mt-3">
              <MoneyInput
                fluid
                disabled={!available || disabled}
                value={price?.price ?? ""}
                onChange={(value) =>
                  onPriceChange(
                    size.productId,
                    flavor.id,
                    size.id,
                    value,
                  )
                }
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
