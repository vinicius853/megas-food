import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'

import { OrdersGateway } from './gateways/orders.gateway'

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
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

      const size = await this.prisma.pizzaSize.findFirst({
        where: {
          id: item.sizeId,
          productId: product.id,
        },
      })

      if (!size) {
        throw new NotFoundException('Tamanho não encontrado.')
      }

      if (item.flavors.length > size.maxFlavors) {
        throw new BadRequestException(
          `Máximo permitido: ${size.maxFlavors} sabores.`,
        )
      }

      let itemPrice = 0

      const flavorSnapshots: any[] = []

      for (const flavorItem of item.flavors) {
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

      const finalUnitPrice = itemPrice + borderPriceValue
      const itemTotal = finalUnitPrice * item.quantity

      subtotal += itemTotal

      itemsData.push({
        productId: product.id,
        sizeId: size.id,
        borderId: item.borderId,

        name: product.name,
        sizeName: size.name,
        borderName,

        quantity: item.quantity,

        unitPrice: finalUnitPrice,
        total: itemTotal,

        notes: item.notes,

        flavors: {
          create: flavorSnapshots,
        },
      })
    }

    const deliveryFee = Number(dto.deliveryFee ?? 0)
    const total = subtotal + deliveryFee

    const order = await this.prisma.order.create({
      data: {
        tenantId,
        userId,

        tableId: dto.tableId,

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
      },

      include: {
        items: {
          include: {
            flavors: true,
          },
        },
      },
    })

    this.ordersGateway.emitOrderCreated(
      tenantId,
      order,
    )

    return order
  }

  async findAll(tenantId: string) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
      },

      include: {
        items: {
          include: {
            flavors: true,
          },
        },

        table: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
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

        table: true,
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

        table: true,
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
}
