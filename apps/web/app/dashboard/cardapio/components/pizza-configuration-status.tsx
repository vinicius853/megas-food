import { AlertTriangle, CheckCircle2 } from "lucide-react";

import type {
  FlavorPrice,
  Product,
  ProductUpdater,
  SizeOptionMatrixRow,
} from "../types/menu-management";

export function PizzaConfigurationStatus({
  products,
  sizes,
  flavorPrices,
  onAddPizza,
  onUpdateProduct,
}: {
  products: Product[];
  sizes: SizeOptionMatrixRow[];
  flavorPrices: FlavorPrice[];
  onAddPizza: (type: "PIZZA_ROUND" | "PIZZA_SQUARE") => void;
  onUpdateProduct: ProductUpdater;
}) {
  const pizzas = products.filter(
    (product) =>
      product.isActive &&
      (product.type === "PIZZA_ROUND" || product.type === "PIZZA_SQUARE"),
  );
  const hasRound = pizzas.some((product) => product.type === "PIZZA_ROUND");
  const hasSquare = pizzas.some((product) => product.type === "PIZZA_SQUARE");

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap gap-2">
        {!hasRound && (
          <button
            type="button"
            onClick={() => onAddPizza("PIZZA_ROUND")}
            className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white transition hover:bg-orange-700"
          >
            + Pizza redonda
          </button>
        )}
        {!hasSquare && (
          <button
            type="button"
            onClick={() => onAddPizza("PIZZA_SQUARE")}
            className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-xs font-black text-orange-700 transition hover:bg-orange-50"
          >
            + Pizza quadrada
          </button>
        )}
      </div>

      {pizzas.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          Nenhuma pizza ativa. Crie um produto para iniciar a configuração
          genérica.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {pizzas.map((product) => {
          const hasSize = sizes.some((size) => size.productId === product.id);
          const hasFlavorPrice = flavorPrices.some(
            (price) => price.productId === product.id,
          );
          const incomplete = !hasSize || !hasFlavorPrice;

          return (
            <div
              key={product.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 ${
                incomplete
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              {incomplete ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              )}

              <div className="min-w-0">
                <input
                  value={product.name}
                  onChange={(event) =>
                    onUpdateProduct(product.id, "name", event.target.value)
                  }
                  className="w-full bg-transparent text-sm font-black text-slate-950 outline-none"
                />
                <p
                  className={`mt-1 text-xs font-bold ${
                    incomplete ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  {incomplete
                    ? "Configuração incompleta — configure tamanhos/sabores"
                    : "Configuração pronta para o cardápio público"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
