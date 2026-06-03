import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'crypto'

import { PrismaService } from '../../prisma/prisma.service'

import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'

import { OrdersGateway } from './gateways/orders.gateway'
import { CouponsService } from '../coupons/coupons.service'

const dashboardOrdersTimeZone = 'America/Sao_Paulo'

type FindOrdersFilters = {
  dateFrom?: string
  dateTo?: string
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
    private readonly couponsService: CouponsService,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateOrderDto,
  ) {
    if (!dto.items.length) {
      throw new BadRequestException(
        'O pedido precisa ter pelo menos 1 item.',
      )
    }

    let subtotal = 0

    const itemsData: any[] = []

    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: {
          id: item.productId,
          tenantId,
        },
      })

      if (!product) {
        throw new NotFoundException('Produto não encontrado.')
      }

      if (
        product.type !== 'PIZZA_ROUND' &&
        product.type !== 'PIZZA_SQUARE'
      ) {
        const unitPrice = Number(product.price ?? 0)

        if (unitPrice <= 0) {
          throw new BadRequestException(
            'Produto sem preÃ§o configurado.',
          )
        }

        const itemTotal = unitPrice * item.quantity

        subtotal += itemTotal

        itemsData.push({
          id: randomUUID(),
          productId: product.id,
          name: product.name,
          quantity: item.quantity,
          unitPrice,
          total: itemTotal,
          notes: item.notes,
        })

        continue
      }

      if (!item.sizeId) {
        throw new BadRequestException(
          'Selecione um tamanho para a pizza.',
        )
      }

      const size = await this.prisma.pizzaSize.findFirst({
        where: {
          id: item.sizeId,
          productId: product.id,
        },
      })

      if (!size) {
        throw new NotFoundException('Tamanho não encontrado.')
      }

      const flavors = item.flavors ?? []

      if (flavors.length === 0) {
        throw new BadRequestException(
          'Selecione pelo menos 1 sabor.',
        )
      }

      if (flavors.length > size.maxFlavors) {
        throw new BadRequestException(
          `Máximo permitido: ${size.maxFlavors} sabores.`,
        )
      }

      let itemPrice = 0

      const flavorSnapshots: any[] = []

      for (const flavorItem of flavors) {
        const flavorPrice =
          await this.prisma.pizzaFlavorPrice.findFirst({
            where: {
              tenantId,
              productId: product.id,
              sizeId: size.id,
              flavorId: flavorItem.flavorId,
            },

            include: {
              flavor: true,
            },
          })

        if (!flavorPrice) {
          throw new NotFoundException(
            'Preço do sabor não encontrado.',
          )
        }

        if (Number(flavorPrice.price) > itemPrice) {
          itemPrice = Number(flavorPrice.price)
        }

        flavorSnapshots.push({
          flavorId: flavorPrice.flavor.id,
          flavorName: flavorPrice.flavor.name,
          fraction: flavorItem.fraction,
        })
      }

      let borderPriceValue = 0
      let borderName: string | null = null

      if (item.borderId) {
        const borderPrice =
          await this.prisma.pizzaBorderPrice.findFirst({
            where: {
              tenantId,
              productId: product.id,
              sizeId: size.id,
              borderId: item.borderId,
            },

            include: {
              border: true,
            },
          })

        if (!borderPrice) {
          throw new NotFoundException(
            'Preço da borda não encontrado.',
          )
        }

        borderPriceValue = Number(borderPrice.price)
        borderName = borderPrice.border.name
      }

      let additionsPriceValue = 0
      const additionNames: string[] = []

      for (const addition of item.additions ?? []) {
        const additionalProduct = await this.prisma.product.findFirst({
          where: {
            id: addition.productId,
            tenantId,
            isActive: true,
            type: 'OTHER',
          },
          include: {
            category: true,
          },
        })

        const additionalCategoryName =
          additionalProduct?.category.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase() ?? ''

        if (!additionalProduct || !additionalCategoryName.includes('adicion')) {
          throw new NotFoundException('Adicional nÃ£o encontrado.')
        }

        const additionalPrice = Number(additionalProduct.price ?? 0)

        if (additionalPrice <= 0) {
          throw new BadRequestException(
            'Adicional sem preÃ§o configurado.',
          )
        }

        additionsPriceValue += additionalPrice
        additionNames.push(additionalProduct.name)
      }

      const itemNotes = [
        item.notes,
        additionNames.length > 0
          ? `Adicionais: ${additionNames.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')

      const finalUnitPrice = itemPrice + borderPriceValue + additionsPriceValue
      const itemTotal = finalUnitPrice * item.quantity

      subtotal += itemTotal

      itemsData.push({
        id: randomUUID(),
        productId: product.id,
        sizeId: size.id,
        borderId: item.borderId,

        name: product.name,
        sizeName: size.name,
        borderName,

        quantity: item.quantity,

        unitPrice: finalUnitPrice,
        total: itemTotal,

        notes: itemNotes || undefined,

        flavors: {
          create: flavorSnapshots.map((flavor) => ({
            id: randomUUID(),
            ...flavor,
          })),
        },
      })
    }

    const deliveryFee = Number(dto.deliveryFee ?? 0)
    const totalBeforeDiscount = subtotal + deliveryFee
    const couponCode = dto.couponCode?.trim()
    const coupon = couponCode
      ? await this.couponsService.validateCoupon(
          tenantId,
          couponCode,
          subtotal,
        )
      : null
    const discountAmount = coupon?.discountAmount ?? 0
    const total = Math.max(totalBeforeDiscount - discountAmount, 0)

    const orderData: any = {
        id: randomUUID(),
        tenantId,
        userId,

        customerName: dto.customerName,
        customerPhone: dto.customerPhone,

        type: dto.type,
        paymentType: dto.paymentType,

        subtotal,
        deliveryFee,
        total,

        notes: dto.notes,

        items: {
          create: itemsData,
        },
      }

    const order = await this.prisma.order.create({
      data: orderData,

      include: {
        items: {
          include: {
            flavors: true,
          },
        },
      },
    })

    if (coupon) {
      await this.prisma.$executeRaw`
        UPDATE "orders"
        SET
          "discountAmount" = ${discountAmount},
          "couponCode" = ${coupon.code},
          "totalBeforeDiscount" = ${totalBeforeDiscount}
        WHERE "id" = ${order.id}
      `
    }

    this.ordersGateway.emitOrderCreated(
      tenantId,
      order,
    )

    return order
  }

  async findAll(
    tenantId: string,
    filters: FindOrdersFilters = {},
  ) {
    const range = this.resolveOrdersDateRange(filters)

    return this.prisma.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: range.dateFrom,
          lt: range.dateTo,
        },
      },

      include: {
        items: {
          include: {
            flavors: true,
          },
        },
      } as any,

      orderBy: {
        createdAt: 'desc',
      },

      take: 200,
    })
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        tenantId,
      },

      include: {
        items: {
          include: {
            flavors: true,
          },
        },
      },
    })

    if (!order) {
      throw new NotFoundException(
        'Pedido não encontrado.',
      )
    }

    return order
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateOrderDto,
  ) {
    await this.findOne(tenantId, id)

    const order = await this.prisma.order.update({
      where: {
        id,
      },

      data: {
        status: dto.status,
        paymentType: dto.paymentType,
        notes: dto.notes,
      },

      include: {
        items: {
          include: {
            flavors: true,
          },
        },
      },
    })

    this.ordersGateway.emitOrderUpdated(
      tenantId,
      order,
    )

    return order
  }

  async remove(tenantId: string, id: string) {
    const order = await this.findOne(tenantId, id)

    const deletedOrder = await this.prisma.order.delete({
      where: {
        id,
      },
    })

    this.ordersGateway.emitOrderCancelled(
      tenantId,
      order,
    )

    return deletedOrder
  }

  private resolveOrdersDateRange(filters: FindOrdersFilters) {
    const dateFrom = filters.dateFrom
      ? this.parseDateFilter(filters.dateFrom, 'dateFrom')
      : null
    const dateTo = filters.dateTo
      ? this.parseDateFilter(filters.dateTo, 'dateTo')
      : null

    if (dateFrom || dateTo) {
      return {
        dateFrom: dateFrom ?? new Date(0),
        dateTo: dateTo ?? this.getStartOfNextDay(dashboardOrdersTimeZone),
      }
    }

    return {
      dateFrom: this.getStartOfToday(dashboardOrdersTimeZone),
      dateTo: this.getStartOfNextDay(dashboardOrdersTimeZone),
    }
  }

  private parseDateFilter(value: string, field: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `Filtro de data invalido: ${field}.`,
      )
    }

    return date
  }

  private getStartOfToday(timeZone: string) {
    const parts = this.getTimeZoneDateParts(new Date(), timeZone)

    return this.getZonedStartOfDay(
      parts.year,
      parts.month,
      parts.day,
      timeZone,
    )
  }

  private getStartOfNextDay(timeZone: string) {
    const parts = this.getTimeZoneDateParts(new Date(), timeZone)

    return this.getZonedStartOfDay(
      parts.year,
      parts.month,
      parts.day + 1,
      timeZone,
    )
  }

  private getZonedStartOfDay(
    year: number,
    month: number,
    day: number,
    timeZone: string,
  ) {
    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    const offset = this.getTimeZoneOffset(utcDate, timeZone)

    return new Date(utcDate.getTime() - offset)
  }

  private getTimeZoneDateParts(date: Date, timeZone: string) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const parts = formatter.formatToParts(date)
    const getPart = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value)

    return {
      year: getPart('year'),
      month: getPart('month'),
      day: getPart('day'),
    }
  }

  private getTimeZoneOffset(date: Date, timeZone: string) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(date)
    const getPart = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value)
    const timeZoneDate = Date.UTC(
      getPart('year'),
      getPart('month') - 1,
      getPart('day'),
      getPart('hour'),
      getPart('minute'),
      getPart('second'),
    )

    return timeZoneDate - date.getTime()
  }
}
