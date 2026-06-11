import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { OrdersGateway } from '../orders/gateways/orders.gateway';
import { PriceEngineService } from '../price-engine/price-engine.service';

import { CreatePublicOrderV2Dto } from './dto/create-public-order-v2.dto';

@Injectable()
export class PublicOrdersV2Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceEngineService: PriceEngineService,
    private readonly couponsService: CouponsService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  async createByTenantSlug(tenantSlug: string, dto: CreatePublicOrderV2Dto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug: tenantSlug,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Cardapio nao encontrado.');
    }

    return this.create(tenant.id, dto);
  }

  async create(tenantId: string, dto: CreatePublicOrderV2Dto) {
    if (!dto.items?.length) {
      throw new BadRequestException('O pedido precisa ter pelo menos 1 item.');
    }

    const itemsData: any[] = [];
    let subtotal = 0;

    for (const [index, item] of dto.items.entries()) {
      const product = await this.prisma.product.findFirst({
        where: {
          id: item.productId,
          tenantId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!product) {
        throw new NotFoundException('Produto nao encontrado.');
      }

      const priceResult = await this.priceEngineService.calculate({
        tenantId,
        productId: item.productId,
        quantity: item.quantity,
        selectedModifiers: item.selectedModifiers,
      });

      if (priceResult.validationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Modificadores invalidos para o item.',
          itemIndex: index,
          validationErrors: priceResult.validationErrors,
        });
      }

      subtotal += priceResult.totalPrice;

      itemsData.push({
        id: randomUUID(),
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: priceResult.unitPrice,
        total: priceResult.totalPrice,
        notes: item.notes,
        modifiers: {
          create: priceResult.appliedModifiers.map((modifier, sortOrder) => ({
            id: randomUUID(),
            modifierGroupId: modifier.groupId,
            modifierOptionId: modifier.optionId,
            groupName: modifier.groupName,
            groupCode: modifier.groupCode,
            optionName: modifier.optionName,
            optionCode: modifier.optionCode,
            pricingMode: modifier.pricingMode,
            quantity: modifier.quantity,
            fraction: modifier.fraction,
            dependsOnOptionId: modifier.dependsOnOptionId,
            unitPriceDelta: modifier.unitPriceDelta,
            totalDelta: modifier.totalDelta,
            sortOrder,
            metadata: {
              source: 'public-orders-v2',
              pricingMode: modifier.pricingMode,
            },
          })),
        },
      });
    }

    const deliveryFee = Number(dto.deliveryFee ?? 0);
    const totalBeforeDiscount = subtotal + deliveryFee;
    const couponCode = dto.couponCode?.trim();
    const coupon = couponCode
      ? await this.couponsService.validateCoupon(tenantId, couponCode, subtotal)
      : null;
    const discountAmount = coupon?.discountAmount ?? 0;
    const total = Math.max(totalBeforeDiscount - discountAmount, 0);

    const order = await this.prisma.order.create({
      data: {
        id: randomUUID(),
        tenantId,
        customerName: dto.customer?.name ?? dto.customerName,
        customerPhone: dto.customer?.phone ?? dto.customerPhone,
        type: dto.type,
        paymentType: dto.paymentType,
        subtotal,
        deliveryFee,
        totalBeforeDiscount,
        discountAmount,
        couponCode: coupon?.code,
        total,
        notes: dto.notes,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: {
          include: {
            modifiers: true,
          },
        },
      },
    });

    this.ordersGateway.emitOrderCreated(tenantId, order);

    return order;
  }
}
