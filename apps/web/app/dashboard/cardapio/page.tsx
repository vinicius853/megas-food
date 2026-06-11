"use client";

import {
  BadgePlus,
  Eye,
  Grid3X3,
  PackagePlus,
  Save,
  ShoppingBag,
  Utensils,
  Wheat,
} from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/page-container";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { BorderPriceMatrix } from "./components/border-price-matrix";
import { MiniStat } from "./components/mini-stat";
import { PizzaPriceMatrix } from "./components/pizza-price-matrix";
import { ProductSectionList } from "./components/product-section-list";
import {
  SimpleCategoryList,
  SimpleProductList,
} from "./components/simple-list";
import { SizeGroup } from "./components/size-group";
import { TabButton } from "./components/tab-button";
import { pizzaModes, useMenuManagement } from "./hooks/use-menu-management";
import type { ProductSectionTab } from "./types/menu-management";

export default function CardapioPage() {
  const menu = useMenuManagement();

  return (
    <PageContainer size="full">
      <PageHeader
        title="Cardápio"
        description="Configure pizzas, tamanhos, bordas, bebidas, adicionais e seções do cardápio em uma única tela operacional."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={menu.openPublicMenu}
            >
              <Eye className="h-4 w-4" />
              Ver cardápio público
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => menu.saveMenu()}
              disabled={menu.saving || menu.loading}
            >
              <Save className="h-4 w-4" />
              {menu.saving ? "Salvando..." : "Salvar agora"}
            </Button>
          </div>
        }
      />

      {(menu.error || menu.success) && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
            menu.error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {menu.error || menu.success}
        </div>
      )}

      {menu.loading ? (
        <Card>
          <CardContent className="p-8 text-sm font-bold text-slate-500">
            Carregando cardápio...
          </CardContent>
        </Card>
      ) : (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
          <div className="min-w-0 space-y-5">
            <Card className="min-w-0 overflow-hidden border-orange-100">
              <CardContent className="p-0">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <Badge variant="warning">Central do cardápio</Badge>

                      <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                        Configuração operacional da pizzaria
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Tudo que aparece no cardápio público é carregado do
                        banco e salvo automaticamente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex min-w-0 gap-2 overflow-x-auto border-b border-slate-100 px-5 py-4">
                  <TabButton
                    active={menu.activeTab === "pizzas"}
                    onClick={() => menu.setActiveTab("pizzas")}
                    icon={Grid3X3}
                  >
                    Pizzas e preços
                  </TabButton>

                  <TabButton
                    active={menu.activeTab === "bebidas"}
                    onClick={() => menu.setActiveTab("bebidas")}
                    icon={Utensils}
                  >
                    Bebidas
                  </TabButton>

                  <TabButton
                    active={menu.activeTab === "bordas"}
                    onClick={() => menu.setActiveTab("bordas")}
                    icon={Wheat}
                  >
                    Bordas
                  </TabButton>

                  <TabButton
                    active={menu.activeTab === "adicionais"}
                    onClick={() => menu.setActiveTab("adicionais")}
                    icon={BadgePlus}
                  >
                    Adicionais
                  </TabButton>

                  {menu.customProductSections.map((section) => {
                    const tabId = `section:${section.id}` as ProductSectionTab;

                    return (
                      <TabButton
                        key={section.id}
                        active={menu.activeTab === tabId}
                        onClick={() => menu.setActiveTab(tabId)}
                        icon={ShoppingBag}
                      >
                        {section.name}
                      </TabButton>
                    );
                  })}

                  <TabButton
                    active={menu.activeTab === "categorias"}
                    onClick={() => menu.setActiveTab("categorias")}
                    icon={PackagePlus}
                  >
                    Categorias
                  </TabButton>
                </div>

                <div className="min-w-0 p-5">
                  {menu.activeTab === "pizzas" && (
                    <>
                      <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-black text-slate-900">
                          Como sua pizzaria vende pizza?
                        </p>

                        <p className="mt-1 text-sm leading-relaxed text-slate-500">
                          Defina tamanhos redondos por centímetros, quadrados
                          por fatias ou os dois modelos.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {pizzaModes.map((mode) => (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => menu.setPizzaMode(mode.id)}
                              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                                menu.pizzaMode === mode.id
                                  ? "bg-orange-600 text-white shadow-lg"
                                  : "bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                              }`}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <PizzaPriceMatrix
                        pizzaMode={menu.pizzaMode}
                        search={menu.search}
                        flavors={menu.filteredFlavors}
                        flavorPrices={menu.flavorPrices}
                        flavorGroups={menu.flavorDisplayGroups}
                        visibleSizes={menu.visibleSizes}
                        onAddFlavor={menu.addFlavor}
                        onRemoveFlavor={menu.removeFlavor}
                        onSearchChange={menu.setSearch}
                        onUpdateFlavorCategory={menu.updateFlavorCategory}
                        onUpdateFlavorDescription={menu.updateFlavorDescription}
                        onUpdateFlavorImage={menu.updateFlavorImage}
                        onUpdateFlavorName={menu.updateFlavorName}
                        onUpdateFlavorActive={menu.updateFlavorActive}
                        onUpdatePizzaPrice={menu.updatePizzaPrice}
                      />
                    </>
                  )}

                  {menu.activeTab === "bebidas" && (
                    <SimpleProductList
                      title="Bebidas"
                      items={menu.drinks}
                      onAdd={() => menu.addProduct("DRINK")}
                      onUpdate={menu.updateProduct}
                      onRemove={menu.removeProduct}
                    />
                  )}

                  {menu.activeTab === "bordas" && (
                    <BorderPriceMatrix
                      borders={menu.borders}
                      sizes={menu.borderSizes}
                      borderPrices={menu.borderPrices}
                      onAddBorder={menu.addBorder}
                      onRemoveBorder={menu.removeBorder}
                      onUpdateBorderName={menu.updateBorderName}
                      onUpdateBorderActive={menu.updateBorderActive}
                      onUpdateBorderPrice={menu.updateBorderPrice}
                    />
                  )}

                  {menu.activeTab === "adicionais" && (
                    <SimpleProductList
                      title="Adicionais"
                      items={menu.extras}
                      onAdd={() => menu.addProduct("OTHER")}
                      onUpdate={menu.updateProduct}
                      onRemove={menu.removeProduct}
                    />
                  )}

                  {menu.selectedProductSection && (
                    <ProductSectionList
                      category={menu.selectedProductSection}
                      products={menu.selectedProductSectionProducts}
                      onAddProduct={(categoryId) =>
                        menu.addProduct("OTHER", categoryId)
                      }
                      onUpdateProduct={menu.updateProduct}
                      onRemoveProduct={menu.removeProduct}
                    />
                  )}

                  {menu.activeTab === "categorias" && (
                    <SimpleCategoryList
                      categories={menu.categories}
                      onAdd={menu.addCategory}
                      onUpdate={menu.updateCategory}
                      onRemove={menu.removeCategory}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="min-w-0 space-y-5">
            {menu.activeTab === "pizzas" && (
              <>
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-black text-slate-950">
                      Tamanhos da pizzaria
                    </h3>

                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      Cadastre tamanhos por centímetros ou por quantidade de
                      fatias.
                    </p>

                    <div className="mt-5 space-y-5">
                      <SizeGroup
                        title="Pizzas redondas"
                        description="Use para tamanhos por centímetros."
                        sizes={menu.roundSizes}
                        setSizes={menu.setSizes}
                        onAdd={() => menu.addSize("round")}
                        onRemove={menu.removeSize}
                      />

                      <SizeGroup
                        title="Pizzas quadradas"
                        description="Use para tamanhos por quantidade de fatias."
                        sizes={menu.squareSizes}
                        setSizes={menu.setSizes}
                        onAdd={() => menu.addSize("square")}
                        onRemove={menu.removeSize}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-black text-slate-950">
                      Cálculo de preço
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Em pizzas com múltiplos sabores, o sistema usa o maior
                      preço entre os sabores selecionados.
                    </p>

                    <div className="mt-4 rounded-2xl bg-orange-50 p-4">
                      <p className="text-sm font-black text-orange-700">
                        Regra atual: maior preço
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {menu.activeTab !== "pizzas" && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-lg font-black text-slate-950">
                    Resumo do cardápio
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    As seções de produtos viram abas próprias no cardápio, como
                    Esfirras, Porções ou Sobremesas.
                  </p>

                  <div className="mt-5 space-y-3">
                    <MiniStat
                      label="Seções do cardápio"
                      value={String(menu.productSections.length)}
                    />

                    <MiniStat
                      label="Seções personalizadas"
                      value={String(menu.customProductSections.length)}
                    />

                    <MiniStat
                      label="Grupos de sabores"
                      value={String(menu.flavorDisplayGroups.length)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      )}
    </PageContainer>
  );
}
