import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

import { CreateBorderPriceDto } from './dto/create-border-price.dto'
import { UpdateBorderPriceDto } from './dto/update-border-price.dto'

@Injectable()
export class BorderPricesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateBorderPriceDto) {
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

    const border = await this.prisma.pizzaBorder.findFirst({
      where: {
        id: dto.borderId,
        tenantId,
      },
    })

    if (!border) {
      throw new NotFoundException('Borda não encontrada.')
    }

    const alreadyExists = await this.prisma.pizzaBorderPrice.findFirst({
      where: {
        tenantId,
        productId: dto.productId,
        sizeId: dto.sizeId,
        borderId: dto.borderId,
      },
    })

    if (alreadyExists) {
      throw new BadRequestException(
        'Já existe preço para esta borda neste tamanho.',
      )
    }

    return this.prisma.pizzaBorderPrice.create({
      data: {
        tenantId,
        productId: dto.productId,
        sizeId: dto.sizeId,
        borderId: dto.borderId,
        price: dto.price,
      },
      include: {
        product: true,
        size: true,
        border: true,
      },
    })
  }

  async findAll(tenantId: string) {
    return this.prisma.pizzaBorderPrice.findMany({
      where: {
        tenantId,
      },
      include: {
        product: true,
        size: true,
        border: true,
      },
      orderBy: {
        price: 'asc',
      },
    })
  }

  async findOne(tenantId: string, id: string) {
    const borderPrice = await this.prisma.pizzaBorderPrice.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        product: true,
        size: true,
        border: true,
      },
    })

    if (!borderPrice) {
      throw new NotFoundException('Preço da borda não encontrado.')
    }

    return borderPrice
  }

  async update(tenantId: string, id: string, dto: UpdateBorderPriceDto) {
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

    if (dto.borderId) {
      const border = await this.prisma.pizzaBorder.findFirst({
        where: {
          id: dto.borderId,
          tenantId,
        },
      })

      if (!border) {
        throw new NotFoundException('Borda não encontrada.')
      }
    }

    return this.prisma.pizzaBorderPrice.update({
      where: {
        id,
      },
      data: {
        productId: dto.productId,
        sizeId: dto.sizeId,
        borderId: dto.borderId,
        price: dto.price,
      },
      include: {
        product: true,
        size: true,
        border: true,
      },
    })
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id)

    return this.prisma.pizzaBorderPrice.delete({
      where: {
        id,
      },
    })
  }
}
