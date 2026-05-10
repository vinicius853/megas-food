import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

import { CreatePizzaFlavorDto } from './dto/create-pizza-flavor.dto'
import { UpdatePizzaFlavorDto } from './dto/update-pizza-flavor.dto'

@Injectable()
export class PizzaFlavorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePizzaFlavorDto) {
    const alreadyExists = await this.prisma.pizzaFlavor.findFirst({
      where: {
        tenantId,
        name: dto.name,
      },
    })

    if (alreadyExists) {
      throw new BadRequestException('Já existe um sabor com este nome.')
    }

    return this.prisma.pizzaFlavor.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
      },
    })
  }

  async findAll(tenantId: string) {
    return this.prisma.pizzaFlavor.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        name: 'asc',
      },
    })
  }

  async findOne(tenantId: string, id: string) {
    const flavor = await this.prisma.pizzaFlavor.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        prices: true,
      },
    })

    if (!flavor) {
      throw new NotFoundException('Sabor não encontrado.')
    }

    return flavor
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePizzaFlavorDto,
  ) {
    await this.findOne(tenantId, id)

    return this.prisma.pizzaFlavor.update({
      where: {
        id,
      },
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
      },
    })
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id)

    return this.prisma.pizzaFlavor.delete({
      where: {
        id,
      },
    })
  }
}
