import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersGateway } from './gateways/orders.gateway';
import { WhatsAppEventType } from '@prisma/client';
import { WhatsAppNotificationService } from '../whatsapp/whatsapp-notification.service';

const dashboardOrdersTimeZone = 'America/Sao_Paulo';

type FindOrdersFilters = {
  dateFrom?: string;
  dateTo?: string;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
    private readonly whatsappNotifications: WhatsAppNotificationService,
  ) {}

  async findAll(tenantId: string, filters: FindOrdersFilters = {}) {
    const range = this.resolveOrdersDateRange(filters);

    return this.prisma.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: range.dateFrom,
          lt: range.dateTo,
        },
      },
      include: {
        items: {
          include: {
            modifiers: true,
          },
        },
      } as any,
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        items: {
          include: {
            modifiers: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado.');
    }

    return order;
  }

  async update(tenantId: string, id: string, dto: UpdateOrderDto) {
    const previousOrder = await this.findOne(tenantId, id);

    const order = await this.prisma.order.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
        paymentType: dto.paymentType,
        notes: dto.notes,
      },
      include: {
        items: {
          include: {
            modifiers: true,
          },
        },
      },
    });

    this.ordersGateway.emitOrderUpdated(tenantId, order);

    const eventType = this.getWhatsAppEvent(dto.status);
    if (eventType && previousOrder.status !== dto.status) {
      await this.whatsappNotifications.enqueueOrderEvent({
        tenantId,
        orderId: order.id,
        eventType,
      });
    }

    return order;
  }

  async remove(tenantId: string, id: string) {
    const order = await this.findOne(tenantId, id);

    const deletedOrder = await this.prisma.order.delete({
      where: {
        id,
      },
    });

    this.ordersGateway.emitOrderCancelled(tenantId, order);

    return deletedOrder;
  }

  private resolveOrdersDateRange(filters: FindOrdersFilters) {
    const dateFrom = filters.dateFrom
      ? this.parseDateFilter(filters.dateFrom, 'dateFrom')
      : null;
    const dateTo = filters.dateTo
      ? this.parseDateFilter(filters.dateTo, 'dateTo')
      : null;

    if (dateFrom || dateTo) {
      return {
        dateFrom: dateFrom ?? new Date(0),
        dateTo: dateTo ?? this.getStartOfNextDay(dashboardOrdersTimeZone),
      };
    }

    return {
      dateFrom: this.getStartOfToday(dashboardOrdersTimeZone),
      dateTo: this.getStartOfNextDay(dashboardOrdersTimeZone),
    };
  }

  private parseDateFilter(value: string, field: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Filtro de data invalido: ${field}.`);
    }

    return date;
  }

  private getStartOfToday(timeZone: string) {
    const parts = this.getTimeZoneDateParts(new Date(), timeZone);

    return this.getZonedStartOfDay(
      parts.year,
      parts.month,
      parts.day,
      timeZone,
    );
  }

  private getStartOfNextDay(timeZone: string) {
    const parts = this.getTimeZoneDateParts(new Date(), timeZone);

    return this.getZonedStartOfDay(
      parts.year,
      parts.month,
      parts.day + 1,
      timeZone,
    );
  }

  private getZonedStartOfDay(
    year: number,
    month: number,
    day: number,
    timeZone: string,
  ) {
    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const offset = this.getTimeZoneOffset(utcDate, timeZone);

    return new Date(utcDate.getTime() - offset);
  }

  private getTimeZoneDateParts(date: Date, timeZone: string) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value);

    return {
      year: getPart('year'),
      month: getPart('month'),
      day: getPart('day'),
    };
  }

  private getTimeZoneOffset(date: Date, timeZone: string) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value);
    const timeZoneDate = Date.UTC(
      getPart('year'),
      getPart('month') - 1,
      getPart('day'),
      getPart('hour'),
      getPart('minute'),
      getPart('second'),
    );

    return timeZoneDate - date.getTime();
  }

  private getWhatsAppEvent(status?: string) {
    const events: Record<string, WhatsAppEventType> = {
      CONFIRMED: WhatsAppEventType.ORDER_CONFIRMED,
      CANCELLED: WhatsAppEventType.ORDER_CANCELLED,
      READY: WhatsAppEventType.ORDER_READY,
      OUT_FOR_DELIVERY: WhatsAppEventType.ORDER_OUT_FOR_DELIVERY,
      DELIVERED: WhatsAppEventType.ORDER_DELIVERED,
    };

    return status ? events[status] : undefined;
  }
}
