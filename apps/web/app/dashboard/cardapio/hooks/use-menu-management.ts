'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { apiFetch } from '@/lib/api'

import {
  type Category,
  type CategoryType,
  type MenuManagementResponse,
  type PizzaMode,
  type PizzaSizeConfig,
  type Product,
  type Tab,
  getProductSectionIdFromTab,
  parseMoney,
  parsePositiveInteger,
} from '../types/menu-management'
import { pizzaModes } from './menu-management-constants'
import {
  ensureBaseData,
  normalizeCategory,
} from './menu-management-normalizers'
import { getBorderSizes, getCustomProductSections, getDrinks, getExtras, getFilteredFlavors, getPizzaFlavorGroups, getPizzaProduct, getProductSections, getRoundSizes, getSelectedProductSection, getSelectedProductSectionProducts, getSquareSizes, getVisibleSizes } from './menu-management-selectors'
import { generateSlug, getErrorMessage, temporaryId } from './menu-management-utils'

export { pizzaModes }

export function useMenuManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('pizzas')

  const [pizzaMode, setPizzaMode] = useState<PizzaMode>('mixed')

  const [search, setSearch] = useState('')

  const [categories, setCategories] = useState<Category[]>([])

  const [products, setProducts] = useState<Product[]>([])

  const [sizes, setSizes] = useState<PizzaSizeConfig[]>([])

  const [flavors, setFlavors] = useState<MenuManagementResponse['pizzaFlavors']>([])

  const [flavorPrices, setFlavorPrices] = useState<MenuManagementResponse['flavorPrices']>([])

  const [borders, setBorders] = useState<MenuManagementResponse['pizzaBorders']>([])

  const [borderPrices, setBorderPrices] = useState<MenuManagementResponse['borderPrices']>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const autoSaveTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasLoadedMenuRef = useRef(false)
  const skipNextAutoSaveRef = useRef(false)

  const roundProduct = getPizzaProduct(products, 'PIZZA_ROUND')

  const squareProduct = getPizzaProduct(products, 'PIZZA_SQUARE')

  const productSections = useMemo(() => getProductSections(categories), [categories])

  const customProductSections = useMemo(() => getCustomProductSections(productSections), [productSections])

  const selectedProductSectionId =
    getProductSectionIdFromTab(activeTab)

  const selectedProductSection = useMemo(() => {
    return getSelectedProductSection(
      customProductSections,
      selectedProductSectionId,
    )
  }, [customProductSections, selectedProductSectionId])

  const selectedProductSectionProducts = useMemo(() => {
    return getSelectedProductSectionProducts(
      products,
      selectedProductSection,
    )
  }, [products, selectedProductSection])

  const pizzaFlavorGroups = useMemo(() => getPizzaFlavorGroups(categories), [categories])

  const drinks = getDrinks(products)

  const extras = getExtras(products, productSections)

  const visibleSizes = useMemo(() => getVisibleSizes(sizes, pizzaMode), [sizes, pizzaMode])

  const borderSizes = useMemo(() => getBorderSizes(sizes), [sizes])

  const roundSizes = useMemo(
    () => getRoundSizes(sizes),
    [sizes],
  )

  const squareSizes = useMemo(
    () => getSquareSizes(sizes),
    [sizes],
  )

  const filteredFlavors = useMemo(() => getFilteredFlavors(flavors, search), [flavors, search])

  function applyMenuData(data: MenuManagementResponse) {
    skipNextAutoSaveRef.current = true

    setCategories(data.categories.map(normalizeCategory))
    setProducts(data.products)
    setSizes(data.pizzaSizes)
    setFlavors(data.pizzaFlavors)
    setFlavorPrices(data.flavorPrices)
    setBorders(data.pizzaBorders)
    setBorderPrices(data.borderPrices)
  }

  async function loadMenu() {
    try {
      setLoading(true)
      setError('')

      const response = await apiFetch<MenuManagementResponse>(
        '/menu-management',
      )

      applyMenuData(ensureBaseData(response))
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erro ao carregar cardápio.'))
    } finally {
      hasLoadedMenuRef.current = true
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMenu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (
      selectedProductSectionId &&
      !selectedProductSection
    ) {
      setActiveTab('adicionais')
    }
  }, [
    selectedProductSection,
    selectedProductSectionId,
  ])

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
      )

      if (existing) {
        return prev.map((price) =>
          price === existing
            ? {
                ...price,
                price: value,
              }
            : price,
        )
      }

      return [
        ...prev,
        {
          productId,
          sizeId,
          flavorId,
          price: value,
        },
      ]
    })
  }

  function addFlavor() {
    const flavorId = temporaryId('flavor')
    const defaultGroup = pizzaFlavorGroups[0]

    setFlavors((prev) => [
      ...prev,
      {
        id: flavorId,
        categoryId: defaultGroup?.id ?? null,
        name: 'Novo sabor',
        sortOrder: prev.length,
        isActive: true,
      },
    ])

    setFlavorPrices((prev) => [
      ...prev,
      ...sizes.map((size) => ({
        productId: size.productId,
        sizeId: size.id,
        flavorId,
        price: '0,00',
      })),
    ])
  }

  function removeFlavor(id: string) {
    setFlavors((prev) =>
      prev.filter((item) => item.id !== id),
    )

    setFlavorPrices((prev) =>
      prev.filter((item) => item.flavorId !== id),
    )
  }

  function updateFlavorName(
    id: string,
    value: string,
  ) {
    setFlavors((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name: value,
            }
          : item,
      ),
    )
  }

  function updateFlavorDescription(
    id: string,
    value: string,
  ) {
    setFlavors((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              description: value,
            }
          : item,
      ),
    )
  }

  function updateFlavorImage(
    id: string,
    value: string | null,
  ) {
    setFlavors((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              imageUrl: value,
            }
          : item,
      ),
    )
  }

  function updateFlavorCategory(
    id: string,
    categoryId: string,
  ) {
    setFlavors((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              categoryId: categoryId || null,
            }
          : item,
      ),
    )
  }

  function addSize(type: 'round' | 'square') {
    const product = type === 'round' ? roundProduct : squareProduct

    if (!product) return

    const productSizes = sizes.filter(
      (size) => size.productId === product.id,
    )

    if (productSizes.length >= 4) {
      setError('Cada modelo de pizza pode ter no maximo 4 tamanhos para manter o cardapio responsivo.')
      return
    }

    const sizeId = temporaryId('size')
    const newSize: PizzaSizeConfig = {
      id: sizeId,
      productId: product.id,
      name:
        type === 'round'
          ? 'Novo tamanho'
          : 'Nova fatia',
      subtitle: '',
      type: type === 'round' ? 'CM' : 'SLICES',
      value: null,
      maxFlavors: 1,
      isActive: true,
      allowBorder: type === 'round',
      sortOrder: sizes.length,
    }

    setSizes((prev) => [...prev, newSize])

    setFlavorPrices((prev) => [
      ...prev,
      ...flavors.map((flavor) => ({
        productId: product.id,
        sizeId,
        flavorId: flavor.id,
        price: '0,00',
      })),
    ])
  }

  function removeSize(sizeId: string) {
    setSizes((prev) =>
      prev.filter((size) => size.id !== sizeId),
    )

    setFlavorPrices((prev) =>
      prev.filter((price) => price.sizeId !== sizeId),
    )

    setBorderPrices((prev) =>
      prev.filter((price) => price.sizeId !== sizeId),
    )
  }

  function addProduct(
    type: 'DRINK' | 'OTHER',
    categoryId?: string,
  ) {
    const category =
      categoryId
        ? categories.find((item) => item.id === categoryId)
        : type === 'DRINK'
          ? categories.find((item) => item.slug === 'bebidas')
          : categories.find((item) => item.slug === 'adicionais')

    if (!category) return

    setProducts((prev) => [
      ...prev,
      {
        id: temporaryId('product'),
        categoryId: category.id,
        name: type === 'DRINK' ? 'Nova bebida' : 'Novo produto',
        type,
        price: '0,00',
        isActive: true,
        sortOrder: prev.length,
      },
    ])
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
    )
  }

  function removeProduct(id: string) {
    setProducts((prev) =>
      prev.filter((item) => item.id !== id),
    )
  }

  function addCategory(
    type: CategoryType = 'PRODUCT_SECTION',
  ) {
    const name =
      type === 'PIZZA_FLAVOR_GROUP'
        ? 'Novo grupo de sabores'
        : 'Nova categoria'

    setCategories((prev) => [
      ...prev,
      {
        id: temporaryId('category'),
        name,
        slug: generateSlug(name),
        type,
        sortOrder: prev.length,
        isActive: true,
      },
    ])
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
              ...(field === 'name' && {
                slug: generateSlug(String(value)),
              }),
            }
          : item,
      ),
    )
  }

  function removeCategory(id: string) {
    const removedProductIds = products
      .filter((product) => product.categoryId === id)
      .map((product) => product.id)

    setCategories((prev) =>
      prev.filter((item) => item.id !== id),
    )

    setProducts((prev) =>
      prev.filter((product) => product.categoryId !== id),
    )

    setSizes((prev) =>
      prev.filter(
        (size) => !removedProductIds.includes(size.productId),
      ),
    )

    setFlavorPrices((prev) =>
      prev.filter(
        (price) =>
          !removedProductIds.includes(price.productId),
      ),
    )

    setBorderPrices((prev) =>
      prev.filter(
        (price) =>
          !removedProductIds.includes(price.productId),
      ),
    )

    setFlavors((prev) =>
      prev.map((flavor) =>
        flavor.categoryId === id
          ? {
              ...flavor,
              categoryId: null,
            }
          : flavor,
      ),
    )
  }

  function addBorder() {
    const borderId = temporaryId('border')

    setBorders((prev) => [
      ...prev,
      {
        id: borderId,
        name: 'Nova borda',
        isActive: true,
      },
    ])

    setBorderPrices((prev) => [
      ...prev,
      ...sizes
        .filter((size) => size.allowBorder)
        .map((size) => ({
          productId: size.productId,
          sizeId: size.id,
          borderId,
          price: '0,00',
        })),
    ])
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
    )
  }

  function updateBorderPrice(
    borderId: string,
    size: PizzaSizeConfig,
    value: string,
  ) {
    setBorderPrices((prev) => {
      const existing = prev.find(
        (price) =>
          price.borderId === borderId &&
          price.sizeId === size.id &&
          price.productId === size.productId,
      )

      if (existing) {
        return prev.map((price) =>
          price === existing
            ? {
                ...price,
                price: value,
              }
            : price,
        )
      }

      return [
        ...prev,
        {
          productId: size.productId,
          sizeId: size.id,
          borderId,
          price: value,
        },
      ]
    })
  }

  function removeBorder(id: string) {
    setBorders((prev) =>
      prev.filter((item) => item.id !== id),
    )

    setBorderPrices((prev) =>
      prev.filter((item) => item.borderId !== id),
    )
  }

  function buildPayload() {
    return {
      categories: categories.map((category, index) => {
        const normalizedCategory = normalizeCategory(category)

        return {
          id: normalizedCategory.id,
          name: normalizedCategory.name,
          slug:
            normalizedCategory.slug ||
            generateSlug(normalizedCategory.name),
          type: normalizedCategory.type,
          sortOrder: index,
          isActive: normalizedCategory.isActive,
        }
      }),
      products: ensureBaseData({
        categories,
        products,
        pizzaSizes: sizes,
        pizzaFlavors: flavors,
        flavorPrices,
        pizzaBorders: borders,
        borderPrices,
      }).products.map((product, index) => ({
        id: product.id,
        categoryId: product.categoryId,
        name: product.name,
        description: product.description || undefined,
        imageUrl: product.imageUrl || undefined,
        type: product.type,
        price:
          product.type === 'DRINK' || product.type === 'OTHER'
            ? parseMoney(product.price)
            : undefined,
        sortOrder: index,
        isActive: product.isActive,
      })),
      pizzaSizes: sizes.map((size, index) => ({
        id: size.id,
        productId: size.productId,
        name: size.name,
        subtitle: size.subtitle || undefined,
        type: size.type,
        value: size.value ?? undefined,
        maxFlavors: parsePositiveInteger(size.maxFlavors),
        allowBorder: size.allowBorder,
        sortOrder: index,
        isActive: size.isActive,
      })),
      pizzaFlavors: flavors.map((flavor, index) => ({
        id: flavor.id,
        categoryId: flavor.categoryId ?? null,
        name: flavor.name,
        description: flavor.description || undefined,
        imageUrl: flavor.imageUrl || undefined,
        sortOrder: index,
        isActive: flavor.isActive,
      })),
      flavorPrices: flavorPrices.map((price) => ({
        id: price.id,
        productId: price.productId,
        sizeId: price.sizeId,
        flavorId: price.flavorId,
        price: parseMoney(price.price),
      })),
      pizzaBorders: borders.map((border) => ({
        id: border.id,
        name: border.name,
        isActive: border.isActive,
      })),
      borderPrices: borderPrices.map((price) => ({
        id: price.id,
        productId: price.productId,
        sizeId: price.sizeId,
        borderId: price.borderId,
        price: parseMoney(price.price),
      })),
    }
  }

  async function saveMenu(isAutoSave = false) {
    try {
      setSaving(true)
      setError('')

      if (!isAutoSave) {
        setSuccess('')
      }

      const response = await apiFetch<MenuManagementResponse>(
        '/menu-management',
        {
          method: 'PUT',
          body: JSON.stringify(buildPayload()),
        },
      )

      applyMenuData(ensureBaseData(response))
      setSuccess(
        isAutoSave
          ? 'Alterações salvas automaticamente.'
          : 'Cardápio salvo com sucesso.',
      )
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erro ao salvar cardápio.'))
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!hasLoadedMenuRef.current || loading) return

    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false
      return
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveMenu(true)
    }, 900)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    categories,
    products,
    sizes,
    flavors,
    flavorPrices,
    borders,
    borderPrices,
  ])

  function openPublicMenu() {
    const slug = localStorage.getItem('tenantSlug')

    if (slug) {
      window.open(`/c/${slug}`, '_blank')
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
    pizzaFlavorGroups,
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
    setActiveTab,
    setPizzaMode,
    setSearch,
    setSizes,
    sizes,
    squareSizes,
    success,
    updateBorderName,
    updateBorderPrice,
    updateCategory,
    updateFlavorCategory,
    updateFlavorDescription,
    updateFlavorImage,
    updateFlavorName,
    updatePizzaPrice,
    updateProduct,
    visibleSizes,
  }
}
