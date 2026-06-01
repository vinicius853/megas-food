import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import { SubscriptionAccessService } from '../modules/billing/subscription-access.service'

type PublicCategory = {
  id: string
  tenantId: string
  name: string
  slug: string
  type: 'PRODUCT_SECTION' | 'PIZZA_FLAVOR_GROUP'
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class PublicMenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionAccessService: SubscriptionAccessService,
  ) {}

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsapp: true,
        logoUrl: true,
        settings: true,
        isActive: true,
      },
    })

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Cardápio não encontrado.')
    }

    const subscriptionAccess =
      await this.subscriptionAccessService.evaluateTenantAccess(tenant.id)

    const [
      allCategories,
      allProducts,
      sizes,
      flavors,
      flavorPrices,
      borders,
      borderPrices,
    ] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          tenantId: tenant.id,
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      }),

      this.prisma.product.findMany({
        where: {
          tenantId: tenant.id,
          isActive: true,
        },
        include: {
          category: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      }),

      this.prisma.pizzaSize.findMany({
        where: {
          product: {
            tenantId: tenant.id,
          },
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      }),

      this.prisma.pizzaFlavor.findMany({
        where: {
          tenantId: tenant.id,
          isActive: true,
        },
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
      }),

      this.prisma.pizzaFlavorPrice.findMany({
        where: {
          tenantId: tenant.id,
        },
      }),

      this.prisma.pizzaBorder.findMany({
        where: {
          tenantId: tenant.id,
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),

      this.prisma.pizzaBorderPrice.findMany({
        where: {
          tenantId: tenant.id,
        },
      }),
    ])

    const pizzaProducts = allProducts.filter(
      (product) =>
        product.type === 'PIZZA_ROUND' ||
        product.type === 'PIZZA_SQUARE',
    )

    const fixedPizzaCategory =
      allCategories.find(
        (category) => category.slug === 'pizzas',
      ) ??
      allCategories.find((category) =>
        category.name.toLowerCase().includes('pizza'),
      )

    const virtualPizzaCategory: PublicCategory = {
      id:
        fixedPizzaCategory?.id ??
        `virtual-pizzas-${tenant.id}`,
      tenantId: tenant.id,
      name: fixedPizzaCategory?.name ?? 'Pizzas',
      slug: 'pizzas',
      type: 'PRODUCT_SECTION',
      sortOrder: fixedPizzaCategory?.sortOrder ?? 0,
      isActive: true,
      createdAt: fixedPizzaCategory?.createdAt ?? new Date(),
      updatedAt: fixedPizzaCategory?.updatedAt ?? new Date(),
    }

    const products = allProducts.map((product) => {
      if (
        product.type === 'PIZZA_ROUND' ||
        product.type === 'PIZZA_SQUARE'
      ) {
        return {
          ...product,
          categoryId: virtualPizzaCategory.id,
          category: virtualPizzaCategory,
        }
      }

      return product
    })

    const productSectionCategories =
      allCategories.filter(
        (category) =>
          category.type === 'PRODUCT_SECTION' &&
          category.slug !== 'pizzas',
      )

    const categories: PublicCategory[] = [
      ...(pizzaProducts.length > 0
        ? [virtualPizzaCategory]
        : []),
      ...productSectionCategories,
    ]

    const categoriesWithProducts = categories.filter(
      (category) =>
        products.some(
          (product) => product.categoryId === category.id,
        ),
    )

    const pizzaFlavorGroupCategories =
      allCategories.filter(
        (category) =>
          category.type === 'PIZZA_FLAVOR_GROUP' &&
          flavors.some(
            (flavor) => flavor.categoryId === category.id,
          ),
      )

    const settings =
      tenant.settings &&
      typeof tenant.settings === 'object' &&
      !Array.isArray(tenant.settings)
        ? (tenant.settings as Record<string, any>)
        : {}

    const customization =
      settings.customization &&
      typeof settings.customization === 'object' &&
      !Array.isArray(settings.customization)
        ? settings.customization
        : {}

    const delivery =
      settings.delivery &&
      typeof settings.delivery === 'object' &&
      !Array.isArray(settings.delivery)
        ? settings.delivery
        : {}

    const { settings: _settings, ...publicTenant } = tenant

    return {
      tenant: publicTenant,
      customization: {
        logoUrl:
          customization.logoUrl ??
          tenant.logoUrl ??
          '',
        coverUrl:
          customization.coverUrl ??
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400&q=85',
        paletteId:
          customization.paletteId ??
          'classic-pizza',
        brandName:
          customization.brandName ??
          tenant.name,
        tagline:
          customization.tagline ??
          'Cardapio digital',
      },
      delivery: {
        isDeliveryOpen:
          typeof delivery.isDeliveryOpen === 'boolean'
            ? delivery.isDeliveryOpen
            : true,
        city: delivery.city ?? '',
        state: delivery.state ?? '',
        storeCep: delivery.storeCep ?? '',
        storeAddress: delivery.storeAddress ?? '',
        whatsapp: delivery.whatsapp ?? tenant.whatsapp ?? '',
        zones: Array.isArray(delivery.zones) ? delivery.zones : [],
        openingHours:
          delivery.openingHours &&
          typeof delivery.openingHours === 'object' &&
          !Array.isArray(delivery.openingHours)
            ? delivery.openingHours
            : {
                weekday: { open: '18:00', close: '23:30' },
                saturday: { open: '18:00', close: '23:30' },
                sunday: { open: '18:00', close: '23:30' },
              },
      },
      subscription: {
        status: subscriptionAccess.status,
        canAcceptOrders: subscriptionAccess.canAcceptOrders,
        canAccessDashboard: subscriptionAccess.canAccessDashboard,
        accessUntil: subscriptionAccess.accessUntil,
        nextBillingDate: subscriptionAccess.nextBillingDate,
        message: subscriptionAccess.message,
      },
      categories: [
        ...categoriesWithProducts,
        ...pizzaFlavorGroupCategories,
      ],
      products,
      sizes,
      flavors,
      flavorPrices,
      borders,
      borderPrices,
    }
  }
}
