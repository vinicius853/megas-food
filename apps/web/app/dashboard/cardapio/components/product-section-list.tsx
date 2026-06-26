"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import {
  type Category,
  type Product,
  type ProductUpdater,
} from "../types/menu-management";

import { MoneyInput } from "./money-input";
import { ImageUploadField } from "./image-upload-field";
import { isNewProductDraft } from "../hooks/menu-management-drafts";
import { useFocusEditableItem } from "../hooks/use-focus-editable-item";

export function ProductSectionList({
  category,
  products,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
}: {
  category: Category;
  products: Product[];
  onAddProduct: (categoryId: string) => string | undefined | void;
  onUpdateProduct: ProductUpdater;
  onRemoveProduct: (id: string) => void;
}) {
  const [productToFocusId, setProductToFocusId] = useState<string | null>(null);
  useFocusEditableItem(
    productToFocusId,
    setProductToFocusId,
    "product-section-product-name",
  );

  function addProduct() {
    const productId = onAddProduct(category.id);
    if (productId) setProductToFocusId(productId);
  }

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-950">{category.name}</h3>

          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Cadastre os itens que aparecem nesta seção do cardápio público. Use
            para Esfirras, Porções, Sobremesas, Pudins, Petiscos ou qualquer
            produto com preço fixo.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProduct}
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50 p-6 text-center">
          <h3 className="text-lg font-black text-orange-900">
            Nenhum produto em {category.name}
          </h3>

          <p className="mt-2 text-sm text-orange-700">
            Clique em “Novo produto” para adicionar o primeiro item desta seção.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addProduct}
            className="mt-4 bg-white"
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {products.map((product) => (
              <div
              key={product.id}
              className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto]"
            >
              <div className="grid gap-3 md:grid-cols-[240px_1fr]">
                <ImageUploadField
                  imageUrl={product.imageUrl}
                  label={product.name || category.name}
                  onChange={(value) =>
                    onUpdateProduct(product.id, "imageUrl", value)
                  }
                />

                <div className="space-y-2">
                  <input
                    id={`product-section-product-name-${product.id}`}
                    autoFocus={isNewProductDraft(product)}
                    value={product.name}
                    onChange={(event) =>
                      onUpdateProduct(product.id, "name", event.target.value)
                    }
                    placeholder={`Nome do produto de ${category.name}`}
                    className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-black outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                  />

                  <textarea
                    value={product.description ?? ""}
                    onChange={(event) =>
                      onUpdateProduct(
                        product.id,
                        "description",
                        event.target.value,
                      )
                    }
                    maxLength={220}
                    rows={2}
                    placeholder="Descricao opcional: ingredientes, preparo ou detalhes do item."
                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold leading-relaxed text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <MoneyInput
                  value={product.price ?? "0,00"}
                  onChange={(value) =>
                    onUpdateProduct(product.id, "price", value)
                  }
                />

                <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-3 text-xs font-bold text-slate-500">
                  <input
                    type="checkbox"
                    checked={product.isActive}
                    onChange={(event) =>
                      onUpdateProduct(
                        product.id,
                        "isActive",
                        event.target.checked,
                      )
                    }
                  />
                  Ativo
                </label>

                <button
                  type="button"
                  onClick={() => onRemoveProduct(product.id)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <Button type="button" variant="outline" size="sm" onClick={addProduct}>
              <Plus className="h-4 w-4" />
              Novo produto
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
