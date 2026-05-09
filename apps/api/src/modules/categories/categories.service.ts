import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCategoryDto) {
    const slug = dto.slug ?? this.generateSlug(dto.name)

    return this.prisma.category.create({
      data: {
        tenantId,
        name: dto.name,
        slug,
      },
    })
  }

  async findAll(tenantId: string) {
    return this.prisma.category.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!category) {
      throw new NotFoundException('Categoria não encontrada')
    }

    return this.prisma.category.update({
      where: {
        id,
      },
      data: {
        ...dto,
        slug: dto.slug ?? (dto.name ? this.generateSlug(dto.name) : undefined),
      },
    })
  }

  async remove(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!category) {
      throw new NotFoundException('Categoria não encontrada')
    }

    return this.prisma.category.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    })
  }

  private generateSlug(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }
}
