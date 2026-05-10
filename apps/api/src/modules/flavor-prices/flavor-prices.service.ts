import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

import { CreateFlavorPriceDto } from './dto/create-flavor-price.dto'
import { UpdateFlavorPriceDto } from './dto/update-flavor-price.dto'

@Injectable()
export class FlavorPricesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateFlavorPriceDto) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        tenantId,
      },
    })

    if (!product) {
      throw new NotFoundException('Produto não encontrado.')
    }

    const size = await this.prisma.pizzaSize.findFirst({
      where: {
        id: dto.sizeId,
        productId: dto.productId,
      },
    })

    if (!size) {
      throw new NotFoundException('Tamanho não encontrado para este produto.')
    }

    const flavor = await this.prisma.pizzaFlavor.findFirst({
      where: {
        id: dto.flavorId,
        tenantId,
      },
    })

    if (!flavor) {
      throw new NotFoundException('Sabor não encontrado.')
    }

    const alreadyExists = await this.prisma.pizzaFlavorPrice.findFirst({
      where: {
        tenantId,
        productId: dto.productId,
        sizeId: dto.sizeId,
        flavorId: dto.flavorId,
      },
    })

    if (alreadyExists) {
      throw new BadRequestException(
        'Já existe preço para este sabor neste tamanho.',
      )
    }

    return this.prisma.pizzaFlavorPrice.create({
      data: {
        tenantId,
        productId: dto.productId,
        sizeId: dto.sizeId,
        flavorId: dto.flavorId,
        price: dto.price,
      },
      include: {
        product: true,
        size: true,
        flavor: true,
      },
    })
  }

  async findAll(tenantId: string) {
    return this.prisma.pizzaFlavorPrice.findMany({
      where: {
        tenantId,
      },
      include: {
        product: true,
        size: true,
        flavor: true,
      },
      orderBy: {
        price: 'asc',
      },
    })
  }

  async findOne(tenantId: string, id: string) {
    const flavorPrice = await this.prisma.pizzaFlavorPrice.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        product: true,
        size: true,
        flavor: true,
      },
    })

    if (!flavorPrice) {
      throw new NotFoundException('Preço do sabor não encontrado.')
    }

    return flavorPrice
  }

  async update(tenantId: string, id: string, dto: UpdateFlavorPriceDto) {
    await this.findOne(tenantId, id)

    if (dto.productId) {
      const product = await this.prisma.product.findFirst({
        where: {
          id: dto.productId,
          tenantId,
        },
      })

      if (!product) {
        throw new NotFoundException('Produto não encontrado.')
      }
    }

    if (dto.sizeId) {
      const size = await this.prisma.pizzaSize.findFirst({
        where: {
          id: dto.sizeId,
        },
      })

      if (!size) {
        throw new NotFoundException('Tamanho não encontrado.')
      }
    }

    if (dto.flavorId) {
      const flavor = await this.prisma.pizzaFlavor.findFirst({
        where: {
          id: dto.flavorId,
          tenantId,
        },
      })

      if (!flavor) {
        throw new NotFoundException('Sabor não encontrado.')
      }
    }

    return this.prisma.pizzaFlavorPrice.update({
      where: {
        id,
      },
      data: {
        productId: dto.productId,
        sizeId: dto.sizeId,
        flavorId: dto.flavorId,
        price: dto.price,
      },
      include: {
        product: true,
        size: true,
        flavor: true,
      },
    })
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id)

    return this.prisma.pizzaFlavorPrice.delete({
      where: {
        id,
      },
    })
  }
}
