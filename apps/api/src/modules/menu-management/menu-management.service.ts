import { BadRequestException, Injectable } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

import { UpdateMenuManagementDto } from './dto/update-menu-management.dto'

function toDecimal(value: unknown) {
  if (typeof value === 'number') return value

  const normalized = String(value ?? '0')
    .replace(/\./g, '')
    .replace(',', '.')

  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeItems<T extends { id?: string }>(
  items: T[] | undefined,
) {
  return items ?? []
}

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

@Injectable()
export class MenuManagementService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findOne(tenantId: string) {
    const [
      categories,
      products,
      sizes,
      flavors,
      flavorPrices,
      borders,
      borderPrices,
    ] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      }),

      this.prisma.product.findMany({
        where: {
          tenantId,
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
          tenantId,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      }),

      this.prisma.pizzaFlavor.findMany({
        where: {
          tenantId,
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
          tenantId,
        },
      }),

      this.prisma.pizzaBorder.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          name: 'asc',
        },
      }),

      this.prisma.pizzaBorderPrice.findMany({
        where: {
          tenantId,
        },
      }),
    ])

    return {
      categories,
      products,
      pizzaSizes: sizes,
      pizzaFlavors: flavors,
      flavorPrices,
      pizzaBorders: borders,
      borderPrices,
    }
  }

  async update(
    tenantId: string,
    dto: UpdateMenuManagementDto,
  ) {
    const categories = normalizeItems(dto.categories)
    const products = normalizeItems(dto.products)

    const pizzaSizes = normalizeItems(
      dto.pizzaSizes ?? dto.sizes,
    )

    const sizeCountByProduct = new Map<string, number>()

    for (const size of pizzaSizes) {
      if (size.isActive === false) continue

      sizeCountByProduct.set(
        size.productId,
        (sizeCountByProduct.get(size.productId) ?? 0) + 1,
      )
    }

    const hasTooManySizes = Array.from(sizeCountByProduct.values()).some(
      (count) => count > 4,
    )

    if (hasTooManySizes) {
      throw new BadRequestException(
        'Cada pizza pode ter no maximo 4 tamanhos.',
      )
    }

    const pizzaFlavors = normalizeItems(
      dto.pizzaFlavors ?? dto.flavors,
    )

    const flavorPrices = normalizeItems(dto.flavorPrices)

    const pizzaBorders = normalizeItems(
      dto.pizzaBorders ?? dto.borders,
    )

    const borderPrices = normalizeItems(dto.borderPrices)

    await this.prisma.$transaction(async (tx) => {
      const categoryIds = categories
        .map((category) => category.id)
        .filter(Boolean) as string[]

      const productIds = products
        .map((product) => product.id)
        .filter(Boolean) as string[]

      const sizeIds = pizzaSizes
        .map((size) => size.id)
        .filter(Boolean) as string[]

      const flavorIds = pizzaFlavors
        .map((flavor) => flavor.id)
        .filter(Boolean) as string[]

      const borderIds = pizzaBorders
        .map((border) => border.id)
        .filter(Boolean) as string[]

      const flavorPriceIds = flavorPrices
        .map((price) => price.id)
        .filter(Boolean) as string[]

      const borderPriceIds = borderPrices
        .map((price) => price.id)
        .filter(Boolean) as string[]

      await tx.pizzaFlavorPrice.deleteMany({
        where: {
          tenantId,
          id: {
            notIn: flavorPriceIds,
          },
        },
      })

      await tx.pizzaBorderPrice.deleteMany({
        where: {
          tenantId,
          id: {
            notIn: borderPriceIds,
          },
        },
      })

      await tx.pizzaSize.deleteMany({
        where: {
          tenantId,
          id: {
            notIn: sizeIds,
          },
        },
      })

      await tx.pizzaFlavor.deleteMany({
        where: {
          tenantId,
          id: {
            notIn: flavorIds,
          },
        },
      })

      await tx.pizzaBorder.deleteMany({
        where: {
          tenantId,
          id: {
            notIn: borderIds,
          },
        },
      })

      await tx.product.deleteMany({
        where: {
          tenantId,
          id: {
            notIn: productIds,
          },
        },
      })

      await tx.category.deleteMany({
        where: {
          tenantId,
          id: {
            notIn: categoryIds,
          },
        },
      })

      for (const category of categories) {
        const slug =
          category.slug || generateSlug(category.name)

        await tx.category.upsert({
          where: {
            tenantId_slug: {
              tenantId,
              slug,
            },
          },
          create: {
            id: category.id,
            tenantId,
            name: category.name,
            slug,
            type: category.type ?? 'PRODUCT_SECTION',
            sortOrder: category.sortOrder ?? 0,
            isActive: category.isActive ?? true,
          },
          update: {
            name: category.name,
            type: category.type ?? 'PRODUCT_SECTION',
            sortOrder: category.sortOrder ?? 0,
            isActive: category.isActive ?? true,
          },
        })
      }

      for (const product of products) {
        await tx.product.upsert({
          where: {
            id: product.id,
          },
          create: {
            id: product.id,
            tenantId,
            categoryId: product.categoryId,
            name: product.name,
            description: product.description ?? null,
            imageUrl: product.imageUrl ?? null,
            type: product.type,
            price:
              product.type === 'DRINK' ||
              product.type === 'OTHER'
                ? toDecimal(product.price)
                : null,
            sortOrder: product.sortOrder ?? 0,
            isActive: product.isActive ?? true,
          },
          update: {
            categoryId: product.categoryId,
            name: product.name,
            description: product.description ?? null,
            imageUrl: product.imageUrl ?? null,
            type: product.type,
            price:
              product.type === 'DRINK' ||
              product.type === 'OTHER'
                ? toDecimal(product.price)
                : null,
            sortOrder: product.sortOrder ?? 0,
            isActive: product.isActive ?? true,
          },
        })
      }

      for (const size of pizzaSizes) {
        await tx.pizzaSize.upsert({
          where: {
            id: size.id,
          },
          create: {
            id: size.id,
            tenantId,
            productId: size.productId,
            name: size.name,
            subtitle: size.subtitle?.trim() || null,
            type: size.type,
            value: size.value ?? null,
            maxFlavors: Math.min(size.maxFlavors ?? 1, 4),
            allowBorder: size.allowBorder ?? true,
            sortOrder: size.sortOrder ?? 0,
            isActive: size.isActive ?? true,
          },
          update: {
            productId: size.productId,
            name: size.name,
            subtitle: size.subtitle?.trim() || null,
            type: size.type,
            value: size.value ?? null,
            maxFlavors: Math.min(size.maxFlavors ?? 1, 4),
            allowBorder: size.allowBorder ?? true,
            sortOrder: size.sortOrder ?? 0,
            isActive: size.isActive ?? true,
          },
        })
      }

      for (const [index, flavor] of pizzaFlavors.entries()) {
        await tx.pizzaFlavor.upsert({
          where: {
            id: flavor.id,
          },
          create: {
            id: flavor.id,
            tenantId,
            categoryId: flavor.categoryId ?? null,
            name: flavor.name,
            description: flavor.description ?? null,
            imageUrl: flavor.imageUrl ?? null,
            sortOrder: flavor.sortOrder ?? index,
            isActive: flavor.isActive ?? true,
          },
          update: {
            categoryId: flavor.categoryId ?? null,
            name: flavor.name,
            description: flavor.description ?? null,
            imageUrl: flavor.imageUrl ?? null,
            sortOrder: flavor.sortOrder ?? index,
            isActive: flavor.isActive ?? true,
          },
        })
      }

      for (const border of pizzaBorders) {
        await tx.pizzaBorder.upsert({
          where: {
            id: border.id,
          },
          create: {
            id: border.id,
            tenantId,
            name: border.name,
            isActive: border.isActive ?? true,
          },
          update: {
            name: border.name,
            isActive: border.isActive ?? true,
          },
        })
      }

      for (const price of flavorPrices) {
        await tx.pizzaFlavorPrice.upsert({
          where: {
            tenantId_productId_sizeId_flavorId: {
              tenantId,
              productId: price.productId,
              sizeId: price.sizeId,
              flavorId: price.flavorId,
            },
          },
          create: {
            id: price.id,
            tenantId,
            productId: price.productId,
            sizeId: price.sizeId,
            flavorId: price.flavorId,
            price: toDecimal(price.price),
          },
          update: {
            price: toDecimal(price.price),
          },
        })
      }

      for (const price of borderPrices) {
        await tx.pizzaBorderPrice.upsert({
          where: {
            tenantId_productId_sizeId_borderId: {
              tenantId,
              productId: price.productId,
              sizeId: price.sizeId,
              borderId: price.borderId,
            },
          },
          create: {
            id: price.id,
            tenantId,
            productId: price.productId,
            sizeId: price.sizeId,
            borderId: price.borderId,
            price: toDecimal(price.price),
          },
          update: {
            price: toDecimal(price.price),
          },
        })
      }
    })

    return this.findOne(tenantId)
  }
}
