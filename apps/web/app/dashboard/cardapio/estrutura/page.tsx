'use client'

import { useEffect, useState } from 'react'
import {
  Boxes,
  CircleDollarSign,
  Pizza,
  Ruler,
  Tags,
  Wheat,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'
import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Category = {
  id: string
  name: string
  slug: string
  isActive: boolean
}

type Product = {
  id: string
  categoryId: string
  name: string
  type: string
  isActive: boolean
  category?: Category
}

type PizzaSize = {
  id: string
  productId: string
  name: string
  maxFlavors: number
  allowBorder: boolean
  isActive: boolean
}

type PizzaFlavor = {
  id: string
  name: string
  isActive: boolean
}

type FlavorPrice = {
  id: string
  productId: string
  sizeId: string
  flavorId: string
  price: string | number
}

type PizzaBorder = {
  id: string
  name: string
  isActive: boolean
}

function formatMoney(value: string | number) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function EstruturaCardapioPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sizes, setSizes] = useState<PizzaSize[]>([])
  const [flavors, setFlavors] = useState<PizzaFlavor[]>([])
  const [prices, setPrices] = useState<FlavorPrice[]>([])
  const [borders, setBorders] = useState<PizzaBorder[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [
        categoriesData,
        productsData,
        sizesData,
        flavorsData,
        pricesData,
        bordersData,
      ] = await Promise.all([
        apiFetch<Category[]>('/categories'),
        apiFetch<Product[]>('/products'),
        apiFetch<PizzaSize[]>('/pizza-sizes'),
        apiFetch<PizzaFlavor[]>('/pizza-flavors'),
        apiFetch<FlavorPrice[]>('/flavor-prices'),
        apiFetch<PizzaBorder[]>('/pizza-borders'),
      ])

      setCategories(categoriesData)
      setProducts(productsData)
      setSizes(sizesData)
      setFlavors(flavorsData)
      setPrices(pricesData)
      setBorders(bordersData)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estrutura.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title="Estrutura completa"
        description="Visão geral da relação entre categorias, produtos, tamanhos, sabores, preços e bordas."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-8 text-sm text-slate-500">
            Carregando estrutura do cardápio...
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Boxes className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-xs text-slate-500">Categorias</p>
                  <p className="text-lg font-bold">{categories.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Pizza className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-xs text-slate-500">Produtos</p>
                  <p className="text-lg font-bold">{products.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Ruler className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-xs text-slate-500">Tamanhos</p>
                  <p className="text-lg font-bold">{sizes.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Tags className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-xs text-slate-500">Sabores</p>
                  <p className="text-lg font-bold">{flavors.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <CircleDollarSign className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-xs text-slate-500">Preços</p>
                  <p className="text-lg font-bold">{prices.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Wheat className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-xs text-slate-500">Bordas</p>
                  <p className="text-lg font-bold">{borders.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mapa do cardápio</CardTitle>
              <CardDescription>
                Estrutura por categoria, produto, tamanho, sabor e preço.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {categories.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhuma categoria cadastrada ainda.
                </p>
              ) : (
                categories.map((category) => {
                  const categoryProducts = products.filter(
                    (product) => product.categoryId === category.id,
                  )

                  return (
                    <div
                      key={category.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {category.name}
                          </h3>
                          <p className="text-xs text-slate-500">
                            /{category.slug}
                          </p>
                        </div>

                        <Badge variant={category.isActive ? 'primary' : 'outline'}>
                          {category.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>

                      {categoryProducts.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          Nenhum produto nessa categoria.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {categoryProducts.map((product) => {
                            const productSizes = sizes.filter(
                              (size) => size.productId === product.id,
                            )

                            return (
                              <div
                                key={product.id}
                                className="rounded-xl border border-slate-200 bg-white p-4"
                              >
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <div>
                                    <h4 className="font-medium text-slate-900">
                                      {product.name}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                      {product.type}
                                    </p>
                                  </div>

                                  <Badge
                                    variant={
                                      product.isActive ? 'primary' : 'outline'
                                    }
                                  >
                                    {product.isActive ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                </div>

                                {productSizes.length === 0 ? (
                                  <p className="text-sm text-slate-500">
                                    Nenhum tamanho cadastrado para este produto.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {productSizes.map((size) => {
                                      const sizePrices = prices.filter(
                                        (price) =>
                                          price.productId === product.id &&
                                          price.sizeId === size.id,
                                      )

                                      return (
                                        <div
                                          key={size.id}
                                          className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                                        >
                                          <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <Badge variant="outline">
                                              {size.name}
                                            </Badge>
                                            <Badge variant="outline">
                                              {size.maxFlavors} sabores
                                            </Badge>
                                            <Badge variant="outline">
                                              {size.allowBorder
                                                ? 'Com borda'
                                                : 'Sem borda'}
                                            </Badge>
                                          </div>

                                          {sizePrices.length === 0 ? (
                                            <p className="text-xs text-slate-500">
                                              Nenhum preço por sabor configurado.
                                            </p>
                                          ) : (
                                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                              {sizePrices.map((price) => {
                                                const flavor = flavors.find(
                                                  (item) =>
                                                    item.id === price.flavorId,
                                                )

                                                return (
                                                  <div
                                                    key={price.id}
                                                    className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm"
                                                  >
                                                    <span className="text-slate-600">
                                                      {flavor?.name ??
                                                        'Sabor não encontrado'}
                                                    </span>

                                                    <strong className="text-slate-900">
                                                      {formatMoney(price.price)}
                                                    </strong>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}
