import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

import { CreatePizzaSizeDto } from './dto/create-pizza-size.dto'
import { UpdatePizzaSizeDto } from './dto/update-pizza-size.dto'

@Injectable()
export class PizzaSizesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePizzaSizeDto) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        tenantId,
      },
    })

    if (!product) {
      throw new NotFoundException('Produto não encontrado')
    }

    const activeSizeCount = await this.prisma.pizzaSize.count({
      where: {
        tenantId,
        productId: dto.productId,
        isActive: true,
      },
    })

    if (activeSizeCount >= 4) {
      throw new BadRequestException(
        'Cada pizza pode ter no maximo 4 tamanhos.',
      )
    }

    return this.prisma.pizzaSize.create({
      data: {
        tenantId,
        productId: dto.productId,
        name: dto.name,
        subtitle: dto.subtitle?.trim() || null,
        type: dto.type,
        value: dto.value,
        maxFlavors: Math.min(dto.maxFlavors ?? 1, 4),
        allowBorder: dto.allowBorder ?? true,
      },
    })
  }

  async findAll(tenantId: string, productId?: string) {
    return this.prisma.pizzaSize.findMany({
      where: {
        product: {
          tenantId,
        },
        ...(productId && {
          productId,
        }),
      },
      include: {
        product: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePizzaSizeDto,
  ) {
    const size = await this.prisma.pizzaSize.findFirst({
      where: {
        id,
        product: {
          tenantId,
        },
      },
    })

    if (!size) {
      throw new NotFoundException('Tamanho não encontrado')
    }

    if (dto.isActive === true && !size.isActive) {
      const activeSizeCount = await this.prisma.pizzaSize.count({
        where: {
          tenantId,
          productId: size.productId,
          isActive: true,
        },
      })

      if (activeSizeCount >= 4) {
        throw new BadRequestException(
          'Cada pizza pode ter no maximo 4 tamanhos.',
        )
      }
    }

    return this.prisma.pizzaSize.update({
      where: {
        id,
      },
      data: {
        ...dto,
        ...(dto.subtitle !== undefined && {
          subtitle: dto.subtitle.trim() || null,
        }),
        ...(dto.maxFlavors !== undefined && {
          maxFlavors: Math.min(dto.maxFlavors, 4),
        }),
      },
    })
  }

  async remove(tenantId: string, id: string) {
    const size = await this.prisma.pizzaSize.findFirst({
      where: {
        id,
        product: {
          tenantId,
        },
      },
    })

    if (!size) {
      throw new NotFoundException('Tamanho não encontrado')
    }

    return this.prisma.pizzaSize.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    })
  }
}
