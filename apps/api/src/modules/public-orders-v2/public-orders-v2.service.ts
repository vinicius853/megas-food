import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionAccessService } from '../billing/subscription-access.service';
import { CouponsService } from '../coupons/coupons.service';
import { OrdersGateway } from '../orders/gateways/orders.gateway';
import {
  formatOrderDisplayNumber,
  OrderNumberingService,
} from '../orders/order-numbering.service';
import { PriceEngineService } from '../price-engine/price-engine.service';
import { WhatsAppEventType } from '@prisma/client';
import { WhatsAppNotificationService } from '../whatsapp/whatsapp-notification.service';
import {
  calculateZoneDeliveryPricing,
  type DeliveryZoneSetting,
} from '../dashboard-settings/delivery-pricing';

import { CreatePublicOrderV2Dto } from './dto/create-public-order-v2.dto';
import {
  assertCurrentPrivacyConsent,
  PRIVACY_POLICY_VERSION,
  PrivacyRequestContext,
  sanitizePrivacyContext,
} from './privacy-consent';

@Injectable()
export class PublicOrdersV2Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionAccessService: SubscriptionAccessService,
    private readonly priceEngineService: PriceEngineService,
    private readonly couponsService: CouponsService,
    private readonly ordersGateway: OrdersGateway,
    private readonly whatsappNotifications: WhatsAppNotificationService,
    private readonly orderNumbering: OrderNumberingService,
  ) {}

  async createByTenantSlug(
    tenantSlug: string,
    dto: CreatePublicOrderV2Dto,
    privacyContext?: PrivacyRequestContext,
  ) {
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

    return this.create(tenant.id, dto, privacyContext);
  }

  async create(
    tenantId: string,
    dto: CreatePublicOrderV2Dto,
    privacyContext?: PrivacyRequestContext,
  ) {
    await this.subscriptionAccessService.assertTenantCanAcceptOrders(tenantId);

    assertCurrentPrivacyConsent(dto.privacyAccepted, dto.privacyPolicyVersion);

    if (!dto.items?.length) {
      throw new BadRequestException('O pedido precisa ter pelo menos 1 item.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        settings: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Cardapio nao encontrado.');
    }

    const deliveryFee = await this.resolveDeliveryFee(tenantId, dto);
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

    const totalBeforeDiscount = subtotal + deliveryFee;
    const couponCode = dto.couponCode?.trim();
    const coupon = couponCode
      ? await this.couponsService.validateCoupon(tenantId, couponCode, subtotal)
      : null;
    const discountAmount = coupon?.discountAmount ?? 0;
    const total = Math.max(totalBeforeDiscount - discountAmount, 0);
    const sanitizedPrivacyContext = sanitizePrivacyContext(privacyContext);
    const businessDate = this.orderNumbering.resolveBusinessDate(
      tenant.settings,
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const dailyNumber = await this.orderNumbering.reserveNextDailyNumber(
        tx,
        tenantId,
        businessDate,
      );

      return tx.order.create({
        data: {
          id: randomUUID(),
          tenantId,
          dailyNumber,
          businessDate,
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
          privacyAcceptedAt: new Date(),
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
          privacyAcceptedIp: sanitizedPrivacyContext.ip,
          privacyAcceptedUserAgent: sanitizedPrivacyContext.userAgent,
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
    });

    const publicOrder = {
      ...order,
      dailyOrderNumber: order.dailyNumber,
      displayNumber: formatOrderDisplayNumber(order),
    };

    this.ordersGateway.emitOrderCreated(tenantId, publicOrder);
    await this.whatsappNotifications.enqueueOrderEvent({
      tenantId,
      orderId: order.id,
      eventType: WhatsAppEventType.ORDER_CREATED,
    });

    return publicOrder;
  }

  private async resolveDeliveryFee(
    tenantId: string,
    dto: CreatePublicOrderV2Dto,
  ) {
    if (dto.type !== 'DELIVERY') {
      return 0;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        settings: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Cardapio nao encontrado.');
    }

    const pricing = calculateZoneDeliveryPricing(
      getDeliveryZones(tenant.settings),
      {
        deliveryZoneId: dto.deliveryZoneId,
        street: dto.deliveryAddress?.street,
      },
    );

    if (pricing.status !== 'OK') {
      throw new BadRequestException(pricing.reason);
    }

    return pricing.fee;
  }
}

function getDeliveryZones(settings: unknown): DeliveryZoneSetting[] {
  if (!isRecord(settings)) {
    return [];
  }

  const delivery = settings.delivery;

  if (!isRecord(delivery) || !Array.isArray(delivery.zones)) {
    return [];
  }

  return delivery.zones as DeliveryZoneSetting[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
