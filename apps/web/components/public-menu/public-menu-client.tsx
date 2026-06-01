'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Plus,
  Search,
  ShoppingBasket,
  ShoppingCart,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'

import { CartDrawer } from './cart-drawer'
import { CartProvider, useCart } from './cart-context'
import { PizzaConfiguratorFlow } from './pizza-configurator-flow'

type ProductType = 'PIZZA_ROUND' | 'PIZZA_SQUARE' | 'DRINK' | 'OTHER'

type Tenant = {
  id: string
  name: string
  slug: string
  whatsapp?: string | null
  logoUrl?: string | null
}

type Category = {
  id: string
  name: string
  slug: string
  type?: 'PRODUCT_SECTION' | 'PIZZA_FLAVOR_GROUP'
  sortOrder: number
  isActive: boolean
}

type Product = {
  id: string
  categoryId: string
  name: string
  description?: string | null
  imageUrl?: string | null
  type: ProductType
  price?: string | number | null
  isActive: boolean
}

type PizzaSize = {
  id: string
  productId: string
  name: string
  subtitle?: string | null
  maxFlavors: number
  allowBorder: boolean
}

type PizzaFlavor = {
  id: string
  categoryId?: string | null
  name: string
  description?: string | null
  imageUrl?: string | null
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
}

type BorderPrice = {
  id: string
  productId: string
  sizeId: string
  borderId: string
  price: string | number
}

type PublicMenuResponse = {
  tenant: Tenant
  customization?: MenuCustomization
  delivery?: DeliverySettings
  subscription?: PublicSubscription
  categories: Category[]
  products: Product[]
  sizes: PizzaSize[]
  flavors: PizzaFlavor[]
  flavorPrices: FlavorPrice[]
  borders: PizzaBorder[]
  borderPrices: BorderPrice[]
}

type MenuCustomization = {
  logoUrl?: string
  coverUrl?: string
  paletteId?: string
  brandName?: string
  tagline?: string
}

type DeliveryZone = {
  id: string
  name: string
  fee: number
  eta: string
  isActive: boolean
}

type OpeningHourRange = {
  enabled?: boolean
  open: string
  close: string
}

type DeliveryOpeningHours = {
  monday?: OpeningHourRange
  tuesday?: OpeningHourRange
  wednesday?: OpeningHourRange
  thursday?: OpeningHourRange
  friday?: OpeningHourRange
  weekday?: OpeningHourRange
  saturday?: OpeningHourRange
  sunday?: OpeningHourRange
}

type DeliverySettings = {
  isDeliveryOpen?: boolean
  city?: string
  state?: string
  storeCep?: string
  storeAddress?: string
  whatsapp?: string
  zones?: DeliveryZone[]
  openingHours?: DeliveryOpeningHours
}

type PublicSubscription = {
  status: string
  canAcceptOrders: boolean
  canAccessDashboard: boolean
  accessUntil?: string | null
  nextBillingDate?: string | null
  message?: string | null
}

type MenuPalette = {
  id: string
  primary: string
  secondary: string
  accent: string
  soft: string
  textOnPrimary: string
}

type FlavorCard = {
  id: string
  name: string
  description: string
  categoryName: string
  categorySortOrder: number
  image: string
  minPrice: number
  prices: {
    label: string
    subtitle?: string | null
    value: number
  }[]
}

type FixedProductCard = {
  id: string
  product: Product
  name: string
  description: string
  categoryName: string
  categorySortOrder: number
  image: string
  price: number
}

type MenuSection =
  | {
      id: string
      title: string
      sortOrder: number
      type: 'flavors'
      items: FlavorCard[]
    }
  | {
      id: string
      title: string
      sortOrder: number
      type: 'products'
      items: FixedProductCard[]
    }

const PIZZA_IMAGES = [
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=90',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=90',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=90',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=90',
]

const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&q=80',
  'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=300&q=80',
  'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&q=80',
]

const MENU_PALETTES: MenuPalette[] = [
  {
    id: 'classic-pizza',
    primary: '#D90416',
    secondary: '#FF4A00',
    accent: '#FDBA21',
    soft: '#FFF4DC',
    textOnPrimary: '#FFFFFF',
  },
  {
    id: 'hot-spicy',
    primary: '#5F0208',
    secondary: '#C1121F',
    accent: '#F97316',
    soft: '#FEF3C7',
    textOnPrimary: '#FFFFFF',
  },
  {
    id: 'fresh-healthy',
    primary: '#14532D',
    secondary: '#16A34A',
    accent: '#BBF7D0',
    soft: '#F0FDF4',
    textOnPrimary: '#FFFFFF',
  },
  {
    id: 'burger-grill',
    primary: '#4A2C17',
    secondary: '#C05621',
    accent: '#111827',
    soft: '#FFF7ED',
    textOnPrimary: '#FFFFFF',
  },
  {
    id: 'elegant',
    primary: '#0F172A',
    secondary: '#164E63',
    accent: '#CBD5E1',
    soft: '#F8FAFC',
    textOnPrimary: '#FFFFFF',
  },
  {
    id: 'sweet-warm',
    primary: '#BE5B72',
    secondary: '#FDBA9B',
    accent: '#FDA4AF',
    soft: '#FFF7ED',
    textOnPrimary: '#FFFFFF',
  },
]

function getMenuPalette(paletteId?: string | null) {
  return (
    MENU_PALETTES.find((palette) => palette.id === paletteId) ??
    MENU_PALETTES[0]
  )
}

function parseMoney(value: unknown) {
  if (typeof value === 'number') return value

  const parsed = Number(
    String(value ?? '0')
      .replace(/\./g, '')
      .replace(',', '.'),
  )

  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatShortMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function isPizzaProduct(product: Product) {
  return product.type === 'PIZZA_ROUND' || product.type === 'PIZZA_SQUARE'
}

function getPizzaProduct(data: PublicMenuResponse) {
  return (
    data.products.find((product) => product.isActive && product.type === 'PIZZA_ROUND') ??
    data.products.find((product) => product.isActive && product.type === 'PIZZA_SQUARE') ??
    null
  )
}

function getCategoryIcon(value: string) {
  const normalized = normalizeCategoryLabel(value)

  if (normalized.includes('doce')) return '🍫'
  if (normalized.includes('bebida')) return '🥤'
  if (normalized.includes('adicion')) return '+'
  if (normalized.includes('esfi')) return '🥙'
  if (normalized.includes('pizza') || normalized.includes('salg')) return '🍕'

  return '🍽️'
}

function normalizeCategoryLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getCategoryPriority(value: string) {
  const normalized = normalizeCategoryLabel(value)

  if (normalized === 'todos') return 0
  if (
    normalized.includes('salgad') ||
    normalized.includes('tradicion') ||
    (normalized.includes('pizza') && !normalized.includes('doce'))
  ) {
    return 10
  }
  if (normalized.includes('doce')) return 20
  if (
    normalized.includes('bebida') ||
    normalized.includes('refrigerante') ||
    normalized.includes('suco') ||
    normalized.includes('agua')
  ) {
    return 30
  }
  if (normalized.includes('esfi')) return 40
  if (normalized.includes('adicion')) return 50

  return 100
}

function compareCategoryOrder(
  firstName: string,
  firstSortOrder: number,
  secondName: string,
  secondSortOrder: number,
) {
  const priorityDifference =
    getCategoryPriority(firstName) - getCategoryPriority(secondName)

  if (priorityDifference !== 0) return priorityDifference

  const sortDifference = firstSortOrder - secondSortOrder

  if (sortDifference !== 0) return sortDifference

  return firstName.localeCompare(secondName, 'pt-BR')
}

function timeToMinutes(value?: string) {
  const [hours, minutes] = String(value ?? '')
    .split(':')
    .map((part) => Number(part))

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0

  return hours * 60 + minutes
}

const defaultOpeningRange: OpeningHourRange = {
  enabled: true,
  open: '18:00',
  close: '23:30',
}

const weekDays = [
  { key: 'sunday', label: 'domingo' },
  { key: 'monday', label: 'segunda-feira' },
  { key: 'tuesday', label: 'terca-feira' },
  { key: 'wednesday', label: 'quarta-feira' },
  { key: 'thursday', label: 'quinta-feira' },
  { key: 'friday', label: 'sexta-feira' },
  { key: 'saturday', label: 'sabado' },
] as const

function getOpeningRange(openingHours?: DeliveryOpeningHours, date = new Date()) {
  const day = date.getDay()
  const dayKey = weekDays[day].key

  if (openingHours?.[dayKey]) return openingHours[dayKey] ?? defaultOpeningRange
  if (day === 0) return openingHours?.sunday ?? defaultOpeningRange
  if (day === 6) return openingHours?.saturday ?? defaultOpeningRange

  return openingHours?.weekday ?? defaultOpeningRange
}

function getNextOpeningMessage(openingHours?: DeliveryOpeningHours, date = new Date()) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + offset)

    const range = getOpeningRange(openingHours, nextDate)

    if (range.enabled === false) continue

    const label = offset === 1 ? 'amanha' : weekDays[nextDate.getDay()].label

    return `Abrimos ${label} as ${range.open}.`
  }

  return 'Consulte nossos horarios de atendimento.'
}

function getStoreOpenStatus(delivery?: DeliverySettings) {
  if (delivery?.isDeliveryOpen === false) {
    return {
      isOpen: false,
      message: 'O estabelecimento esta fechado para entregas no momento.',
    }
  }

  const now = new Date()
  const range = getOpeningRange(delivery?.openingHours, now)

  if (range.enabled === false) {
    return {
      isOpen: false,
      message: `Estamos fechados hoje. ${getNextOpeningMessage(delivery?.openingHours, now)}`,
    }
  }

  const openMinutes = timeToMinutes(range.open)
  const closeMinutes = timeToMinutes(range.close)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const isOpen =
    openMinutes <= closeMinutes
      ? currentMinutes >= openMinutes && currentMinutes <= closeMinutes
      : currentMinutes >= openMinutes || currentMinutes <= closeMinutes

  return {
    isOpen,
    message: isOpen
      ? 'Aberto para pedidos.'
      : `Estamos fora do horario de atendimento. ${
          openMinutes <= closeMinutes && currentMinutes > closeMinutes
            ? getNextOpeningMessage(delivery?.openingHours, now)
            : `Abrimos as ${range.open}.`
        }`,
  }
}

function mapFlavorCards(data: PublicMenuResponse): FlavorCard[] {
  const pizzaProduct = getPizzaProduct(data)

  if (!pizzaProduct) return []

  return data.flavors
    .map((flavor, index) => {
      const prices = data.sizes
        .filter((size) => size.productId === pizzaProduct.id)
        .map((size) => {
          const price = data.flavorPrices.find(
            (item) =>
              item.productId === pizzaProduct.id &&
              item.flavorId === flavor.id &&
              item.sizeId === size.id,
          )

          return {
            label: size.name,
            subtitle: size.subtitle,
            value: parseMoney(price?.price),
          }
        })
        .filter((price) => price.value > 0)
        .slice(0, 4)

      const category = data.categories.find((item) => item.id === flavor.categoryId)

      return {
        id: flavor.id,
        name: flavor.name,
        description: flavor.description ?? 'Pizza artesanal preparada com ingredientes selecionados.',
        categoryName: category?.name ?? 'Pizzas',
        categorySortOrder: category?.sortOrder ?? 0,
        image: flavor.imageUrl || PIZZA_IMAGES[index % PIZZA_IMAGES.length],
        minPrice: prices.length > 0 ? Math.min(...prices.map((price) => price.value)) : 0,
        prices,
      }
    })
    .filter((flavor) => flavor.minPrice > 0)
}

function mapFixedProductCards(data: PublicMenuResponse): FixedProductCard[] {
  return data.products
    .filter((product) => product.isActive && !isPizzaProduct(product))
    .map((product, index) => {
      const category = data.categories.find((item) => item.id === product.categoryId)

      return {
        id: product.id,
        product,
        name: product.name,
        description: product.description ?? 'Produto cadastrado no cardapio.',
        categoryName: category?.name ?? 'Cardapio',
        categorySortOrder: category?.sortOrder ?? 0,
        image: product.imageUrl || PRODUCT_IMAGES[index % PRODUCT_IMAGES.length],
        price: parseMoney(product.price),
      }
    })
    .filter((product) => product.price > 0)
}

function isAdditionalCategory(value: string) {
  return normalizeCategoryLabel(value).includes('adicion')
}

function groupByCategory<T extends { categoryName: string; categorySortOrder: number }>(
  items: T[],
) {
  const groups = new Map<
    string,
    {
      title: string
      sortOrder: number
      items: T[]
    }
  >()

  for (const item of items) {
    const key = item.categoryName
    const existing = groups.get(key)

    if (existing) {
      existing.items.push(item)
      continue
    }

    groups.set(key, {
      title: key,
      sortOrder: item.categorySortOrder,
      items: [item],
    })
  }

  return Array.from(groups.values())
}

function buildMenuSections(
  flavors: FlavorCard[],
  products: FixedProductCard[],
): MenuSection[] {
  const flavorSections = groupByCategory(flavors).map(
    (section) => ({
      id: `flavors-${section.title}`,
      title: section.title.toLowerCase().includes('pizza')
        ? section.title
        : `Pizzas ${section.title.toLowerCase()}`,
      sortOrder: section.sortOrder,
      type: 'flavors' as const,
      items: section.items,
    }),
  )

  const productSections = groupByCategory(products).map(
    (section) => ({
      id: `products-${section.title}`,
      title: section.title,
      sortOrder: section.sortOrder + 100,
      type: 'products' as const,
      items: section.items,
    }),
  )

  return [...flavorSections, ...productSections].sort((a, b) =>
    compareCategoryOrder(a.title, a.sortOrder, b.title, b.sortOrder),
  )
}

function buildCategoryTabs(
  flavors: FlavorCard[],
  products: FixedProductCard[],
) {
  const tabs = new Map<string, number>()

  for (const flavor of flavors) {
    tabs.set(
      flavor.categoryName,
      Math.min(
        tabs.get(flavor.categoryName) ?? flavor.categorySortOrder,
        flavor.categorySortOrder,
      ),
    )
  }

  for (const product of products) {
    tabs.set(
      product.categoryName,
      Math.min(
        tabs.get(product.categoryName) ?? product.categorySortOrder + 100,
        product.categorySortOrder + 100,
      ),
    )
  }

  return [
    'Todos',
    ...Array.from(tabs.entries())
      .sort((a, b) => compareCategoryOrder(a[0], a[1], b[0], b[1]))
      .map(([name]) => name),
  ]
}

function getSectionDomId(title: string) {
  return `menu-section-${title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`
}

function PublicMenuContent({ slug }: { slug: string }) {
  const { addItem, totalItems, totalPrice } = useCart()

  const [menuData, setMenuData] = useState<PublicMenuResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedFlavorId, setSelectedFlavorId] = useState<string | null>(null)
  const [pizzaFlowOpen, setPizzaFlowOpen] = useState(false)
  const [drinkSuggestionShown, setDrinkSuggestionShown] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState<{
    name: string
    imageUrl?: string
  } | null>(null)
  const [cartPulseKey, setCartPulseKey] = useState(0)

  useEffect(() => {
    let active = true

    async function loadMenu() {
      try {
        setLoading(true)
        setError('')

        const response = await apiFetch<PublicMenuResponse>(`/public-menu/${slug}`)

        if (!active) return

        setMenuData(response)
      } catch (err) {
        if (!active) return

        setError(err instanceof Error ? err.message : 'Erro ao carregar cardapio.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadMenu()

    return () => {
      active = false
    }
  }, [slug])

  const tenant = menuData?.tenant
  const customization = menuData?.customization
  const palette = getMenuPalette(customization?.paletteId)
  const tenantName =
    customization?.brandName ||
    tenant?.name ||
    'Sabor & Lenha'
  const menuTagline =
    customization?.tagline ||
    'Cardapio digital'
  const menuLogo =
    customization?.logoUrl ||
    tenant?.logoUrl ||
    ''
  const menuCover =
    customization?.coverUrl ||
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400&q=85'
  const storeStatus = useMemo(() => {
    const openStatus = getStoreOpenStatus(menuData?.delivery)

    if (!openStatus.isOpen) {
      return openStatus
    }

    if (menuData?.subscription && !menuData.subscription.canAcceptOrders) {
      return {
        isOpen: false,
        message:
          'Este cardapio nao esta recebendo pedidos no momento. Entre em contato com a loja.',
      }
    }

    return openStatus
  }, [menuData?.delivery, menuData?.subscription])
  const pizzaProduct = menuData ? getPizzaProduct(menuData) : null
  const flavorCards = useMemo(() => (menuData ? mapFlavorCards(menuData) : []), [menuData])
  const fixedProducts = useMemo(() => (menuData ? mapFixedProductCards(menuData) : []), [menuData])
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
  )
  const visibleFixedProducts = useMemo(
    () =>
      fixedProducts.filter(
        (product) => !isAdditionalCategory(product.categoryName),
      ),
    [fixedProducts],
  )
  const categories = useMemo(
    () => buildCategoryTabs(flavorCards, visibleFixedProducts),
    [flavorCards, visibleFixedProducts],
  )

  const searchText = search.trim().toLowerCase()
  const activeCategoryText = activeCategory.toLowerCase()

  const filteredFlavors = flavorCards.filter((flavor) => {
    const matchesSearch =
      !searchText ||
      flavor.name.toLowerCase().includes(searchText) ||
      flavor.description.toLowerCase().includes(searchText)

    const matchesCategory =
      activeCategory === 'Todos' ||
      flavor.categoryName.toLowerCase() === activeCategoryText

    return matchesSearch && matchesCategory
  })

  const filteredProducts = visibleFixedProducts.filter((product) => {
    const matchesSearch =
      !searchText ||
      product.name.toLowerCase().includes(searchText) ||
      product.description.toLowerCase().includes(searchText)

    const matchesCategory =
      activeCategory === 'Todos' || product.categoryName.toLowerCase() === activeCategoryText

    return matchesSearch && matchesCategory
  })

  const menuSections = useMemo(
    () => buildMenuSections(filteredFlavors, filteredProducts),
    [filteredFlavors, filteredProducts],
  )

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory('Todos')
    }
  }, [activeCategory, categories])

  useEffect(() => {
    if (!addedFeedback) return undefined

    const timeout = window.setTimeout(() => {
      setAddedFeedback(null)
    }, 1800)

    return () => window.clearTimeout(timeout)
  }, [addedFeedback])

  function showAddedFeedback(item: { name: string; imageUrl?: string }) {
    setAddedFeedback(item)
    setCartPulseKey((current) => current + 1)
  }

  function openPizzaFlow(flavorId: string) {
    if (!storeStatus.isOpen) {
      alert(storeStatus.message)
      return
    }

    setSelectedFlavorId(flavorId)
    setPizzaFlowOpen(true)
  }

  function addFixedProduct(product: FixedProductCard) {
    if (!storeStatus.isOpen) {
      alert(storeStatus.message)
      return
    }

    addItem({
      id: crypto.randomUUID(),
      productId: product.product.id,
      productName: product.name,
      imageUrl: product.image,
      flavorIds: [],
      flavors: [],
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price,
    })

    showAddedFeedback({
      name: product.name,
      imageUrl: product.image,
    })
  }

  function scrollToDrinks() {
    setActiveCategory('Bebidas')
    setDrinkSuggestionShown(true)

    window.requestAnimationFrame(() => {
      document
        .getElementById(getSectionDomId('Bebidas'))
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    })
  }

  function markDrinkSuggestionShown() {
    setDrinkSuggestionShown(true)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-200 font-sans text-slate-950">
        <div className="mx-auto min-h-screen w-full max-w-[860px] bg-slate-50 p-4 shadow-2xl">
          <div className="h-3 animate-pulse bg-red-700" />
          <div className="mt-4 h-12 animate-pulse rounded-full bg-white" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-lg bg-white" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error || !menuData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-200 p-4 font-sans text-slate-950">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-slate-950">Cardapio indisponivel</h1>
          <p className="mt-3 text-sm text-slate-500">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main data-slug={slug} className="min-h-screen bg-slate-200 font-sans text-slate-950">
      <div className="mx-auto min-h-screen w-full max-w-[860px] bg-slate-50 shadow-2xl">
        <div
          className="h-3"
          style={{ backgroundColor: palette.primary }}
        />

        <header
          className="relative min-h-[190px] overflow-hidden px-4 pb-16 pt-5 text-white shadow-sm sm:min-h-[230px] sm:px-8"
          style={{
            backgroundImage: `linear-gradient(180deg, #00000099, ${palette.primary}55), url(${menuCover})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
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
                  activeCategory === category
                    ? 'text-white'
                    : 'border-slate-200 bg-white text-slate-950'
                }`}
                style={
                  activeCategory === category
                    ? {
                        backgroundColor: palette.primary,
                        borderColor: palette.primary,
                        color: palette.textOnPrimary,
                      }
                    : undefined
                }
              >
                <span className="mr-2">{category === 'Todos' ? '' : getCategoryIcon(category)}</span>
                {category}
              </button>
            ))}
          </div>
        </section>

        {!storeStatus.isOpen && (
          <section className="border-b border-red-100 bg-red-50 px-4 py-3 sm:px-8">
            <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 shadow-sm">
              {storeStatus.message} Voce pode consultar o cardapio, mas os pedidos estao pausados.
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
                    <span className="mr-2">{getCategoryIcon(section.title)}</span>
                    {section.title}
                  </h2>
                </div>

                {section.type === 'flavors'
                  ? section.items.map((flavor) => (
                    <div key={flavor.id}>
                      <article
                        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/5 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="grid grid-cols-[76px_1fr_36px] items-start gap-3">
                          <img
                            src={flavor.image}
                            alt={flavor.name}
                            className="h-[76px] w-[76px] rounded-lg object-cover shadow-sm"
                          />

                          <div className="min-w-0 pr-1">
                            <h3 className="truncate text-lg font-black leading-tight text-slate-950">
                              {flavor.name}
                            </h3>

                            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500">
                              {flavor.description}
                            </p>

                            <div className="mt-2 grid grid-cols-2 gap-y-2 sm:grid-cols-4 sm:gap-y-1">
                              {flavor.prices.slice(0, 4).map((price, priceIndex) => (
                                <div
                                  key={price.label}
                                  className={`min-w-0 border-slate-200 px-3 text-left ${
                                    priceIndex % 2 === 0
                                      ? 'border-l-0 pl-0'
                                      : 'border-l'
                                  } ${
                                    priceIndex === 0
                                      ? 'sm:border-l-0 sm:pl-0'
                                      : 'sm:border-l sm:pl-3'
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
                                    className="mt-0.5 text-sm font-black"
                                    style={{ color: palette.primary }}
                                  >
                                    R$ {formatShortMoney(price.value)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => openPizzaFlow(flavor.id)}
                            disabled={!storeStatus.isOpen}
                            className="mt-1 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                            style={{ backgroundColor: storeStatus.isOpen ? palette.primary : '#94A3B8' }}
                            aria-label={`Adicionar ${flavor.name}`}
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </article>
                    </div>
                    ))
                  : section.items.map((product) => (
                    <div key={product.id}>
                      <article
                        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/5 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="grid grid-cols-[76px_1fr_36px] items-start gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-[76px] w-[76px] rounded-lg object-cover shadow-sm"
                          />

                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black leading-tight text-slate-950">
                              {product.name}
                            </h3>

                            <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500">
                              {product.description}
                            </p>

                            <div
                              className="mt-2 text-sm font-black"
                              style={{ color: palette.primary }}
                            >
                              {formatMoney(product.price)}
                            </div>
                          </div>

                          <button
                            onClick={() => addFixedProduct(product)}
                            disabled={!storeStatus.isOpen}
                            className="mt-1 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                            style={{ backgroundColor: storeStatus.isOpen ? palette.primary : '#94A3B8' }}
                            aria-label={`Adicionar ${product.name}`}
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </article>
                    </div>
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
      </div>

      {totalItems > 0 && (
        <div
          key={cartPulseKey}
          className="cart-bump fixed bottom-0 left-1/2 z-40 flex w-full max-w-[860px] -translate-x-1/2 items-center justify-between gap-3 rounded-t-2xl px-4 py-3 text-white shadow-2xl shadow-red-900/30 transition duration-300"
          style={{ backgroundColor: palette.primary }}
        >
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
              <ShoppingBasket className="h-6 w-6" />
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black"
                style={{
                  backgroundColor: palette.accent,
                  color: palette.primary,
                }}
              >
                {totalItems}
              </span>
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-black">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'} no pedido
              </span>
              <span className="block truncate text-xs font-bold text-white/80">
                Subtotal: {formatMoney(totalPrice)}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex h-12 shrink-0 items-center gap-3 rounded-xl bg-white px-5 text-sm font-black shadow-lg"
            style={{ color: palette.primary }}
          >
            Ver pedido
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {addedFeedback && (
        <div
          className="cart-added-toast fixed bottom-24 left-4 right-4 z-[55] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border bg-white p-3 shadow-2xl shadow-slate-950/20"
          style={{ borderColor: palette.soft }}
        >
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{ backgroundColor: palette.soft }}
          >
            {addedFeedback.imageUrl ? (
              <img
                src={addedFeedback.imageUrl}
                alt={addedFeedback.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <CheckCircle2
                className="h-7 w-7"
                style={{ color: palette.primary }}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-black uppercase tracking-[0.12em]"
              style={{ color: palette.primary }}
            >
              Adicionado ao carrinho
            </p>
            <p className="mt-1 truncate text-sm font-black text-slate-950">
              {addedFeedback.name}
            </p>
          </div>

          <CheckCircle2
            className="h-6 w-6 shrink-0"
            style={{ color: palette.primary }}
          />
        </div>
      )}

      {pizzaProduct && (
        <PizzaConfiguratorFlow
          open={pizzaFlowOpen}
          product={pizzaProduct}
          initialFlavorId={selectedFlavorId}
          sizes={menuData.sizes}
          flavors={menuData.flavors}
          flavorPrices={menuData.flavorPrices}
          borders={menuData.borders}
          borderPrices={menuData.borderPrices}
          additionalProducts={pizzaAdditionalProducts}
          onClose={() => setPizzaFlowOpen(false)}
          shouldOfferDrinkSuggestion={
            !drinkSuggestionShown && categories.includes('Bebidas')
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
        tenantName={tenantName}
        tenantSlug={tenant?.slug ?? slug}
        whatsapp={menuData.delivery?.whatsapp || tenant?.whatsapp}
        palette={palette}
        delivery={menuData.delivery}
        ordersEnabled={storeStatus.isOpen}
        closedMessage={storeStatus.message}
      />
    </main>
  )
}

export default function PublicMenuClient({ slug }: { slug: string }) {
  return (
    <CartProvider>
      <PublicMenuContent slug={slug} />
    </CartProvider>
  )
}
