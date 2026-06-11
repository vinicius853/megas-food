import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateProductDto) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        tenantId,
      },
    })

    if (!category) {
      throw new NotFoundException('Categoria não encontrada')
    }

    return this.prisma.product.create({
      data: {
        tenantId,
        categoryId: dto.categoryId,
        name: dto.name,
        type: dto.type,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive ?? true,
      },
    })
  }

  async findAll(tenantId: string, categoryId?: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        ...(categoryId && {
          categoryId,
        }),
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateProductDto,
  ) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!product) {
      throw new NotFoundException('Produto não encontrado')
    }

    return this.prisma.product.update({
      where: {
        id,
      },
      data: dto,
    })
  }

  async remove(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!product) {
      throw new NotFoundException('Produto não encontrado')
    }

    return this.prisma.product.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    })
  }
}
