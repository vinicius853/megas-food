import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

export const DEFAULT_ORDER_TIME_ZONE = 'America/Sao_Paulo';

type TenantSettingsWithTimeZone = {
  timeZone?: unknown;
  timezone?: unknown;
  operation?: {
    timeZone?: unknown;
    timezone?: unknown;
  };
  business?: {
    timeZone?: unknown;
    timezone?: unknown;
  };
};

type DailyCounterRow = {
  lastNumber: number;
};

@Injectable()
export class OrderNumberingService {
  resolveBusinessDate(settings: unknown, now = new Date()) {
    const timeZone = this.resolveTenantTimeZone(settings);
    return getBusinessDateForTimeZone(now, timeZone);
  }

  async reserveNextDailyNumber(
    tx: Prisma.TransactionClient,
    tenantId: string,
    businessDate: Date,
  ) {
    const rows = await tx.$queryRaw<DailyCounterRow[]>`
      INSERT INTO "daily_order_counters" (
        "id",
        "tenantId",
        "businessDate",
        "lastNumber",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${randomUUID()},
        ${tenantId},
        ${businessDate},
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("tenantId", "businessDate")
      DO UPDATE SET
        "lastNumber" = "daily_order_counters"."lastNumber" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "lastNumber"
    `;

    const nextNumber = Number(rows[0]?.lastNumber);

    if (!Number.isInteger(nextNumber) || nextNumber < 1) {
      throw new Error('Nao foi possivel reservar o numero diario do pedido.');
    }

    return nextNumber;
  }

  private resolveTenantTimeZone(settings: unknown) {
    if (!isRecord(settings)) {
      return DEFAULT_ORDER_TIME_ZONE;
    }

    const tenantSettings = settings as TenantSettingsWithTimeZone;
    const candidates = [
      tenantSettings.timeZone,
      tenantSettings.timezone,
      tenantSettings.operation?.timeZone,
      tenantSettings.operation?.timezone,
      tenantSettings.business?.timeZone,
      tenantSettings.business?.timezone,
    ];
    const timeZone = candidates.find(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0,
    );

    if (timeZone && isValidTimeZone(timeZone)) {
      return timeZone;
    }

    return DEFAULT_ORDER_TIME_ZONE;
  }
}

export function getBusinessDateForTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return new Date(
    Date.UTC(getPart('year'), getPart('month') - 1, getPart('day'), 0, 0, 0, 0),
  );
}

export function formatOrderDisplayNumber(order: {
  dailyNumber?: number | null;
  number?: number | null;
}) {
  if (typeof order.dailyNumber === 'number') {
    return `#${String(order.dailyNumber).padStart(3, '0')}`;
  }

  if (typeof order.number === 'number') {
    return `#${order.number}`;
  }

  return '#---';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidTimeZone(value: string | undefined) {
  if (!value) return false;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
