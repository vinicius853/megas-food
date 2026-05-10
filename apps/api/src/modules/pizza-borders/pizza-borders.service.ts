import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

import { CreatePizzaBorderDto } from './dto/create-pizza-border.dto'
import { UpdatePizzaBorderDto } from './dto/update-pizza-border.dto'

@Injectable()
export class PizzaBordersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePizzaBorderDto) {
    const alreadyExists = await this.prisma.pizzaBorder.findFirst({
      where: {
        tenantId,
        name: dto.name,
      },
    })

    if (alreadyExists) {
      throw new BadRequestException('Já existe uma borda com este nome.')
    }

    return this.prisma.pizzaBorder.create({
      data: {
        tenantId,
        name: dto.name,
      },
    })
  }

  async findAll(tenantId: string) {
    return this.prisma.pizzaBorder.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        name: 'asc',
      },
    })
  }

  async findOne(tenantId: string, id: string) {
    const border = await this.prisma.pizzaBorder.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        prices: true,
      },
    })

    if (!border) {
      throw new NotFoundException('Borda não encontrada.')
    }

    return border
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePizzaBorderDto,
  ) {
    await this.findOne(tenantId, id)

    return this.prisma.pizzaBorder.update({
      where: {
        id,
      },
      data: {
        name: dto.name,
        isActive: dto.isActive,
      },
    })
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id)

    return this.prisma.pizzaBorder.delete({
      where: {
        id,
      },
    })
  }
}