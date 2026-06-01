import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'
import { SubscriptionAccessService } from '../billing/subscription-access.service'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'

@Controller('public-orders')
export class PublicOrdersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly subscriptionAccessService: SubscriptionAccessService,
  ) {}

  @Post(':slug')
  async createPublicOrder(
    @Param('slug') slug: string,
    @Body() dto: CreateOrderDto,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        isActive: true,
      },
    })

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Pizzaria não encontrada.')
    }

    await this.subscriptionAccessService.assertTenantCanAcceptOrders(tenant.id)

    return this.ordersService.create(
      tenant.id,
      null as any,
      dto,
    )
  }
}
