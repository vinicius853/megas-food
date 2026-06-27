export const ORDERING_PAUSED_MESSAGE =
  'Esta loja não está recebendo pedidos no momento.';

export const ORDERING_CLOSED_MESSAGE =
  'Estamos fora do horario de atendimento.';

type OpeningHourRange = {
  enabled?: unknown;
  open?: unknown;
  close?: unknown;
};

type DeliveryOrderingStatus = {
  canAcceptOrders: boolean;
  reason?: 'MANUAL_PAUSE' | 'OUTSIDE_HOURS';
  message?: string;
};

const weekDayKeys = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export function resolveDeliveryOrderingStatus(
  settings: unknown,
  date = new Date(),
): DeliveryOrderingStatus {
  const delivery = getDeliverySettings(settings);

  if (delivery?.isDeliveryOpen === false) {
    return {
      canAcceptOrders: false,
      reason: 'MANUAL_PAUSE',
      message: ORDERING_PAUSED_MESSAGE,
    };
  }

  const openingRange = getOpeningRange(delivery?.openingHours, date);

  if (!openingRange) {
    return { canAcceptOrders: true };
  }

  if (openingRange.enabled === false) {
    return {
      canAcceptOrders: false,
      reason: 'OUTSIDE_HOURS',
      message: ORDERING_CLOSED_MESSAGE,
    };
  }

  const openMinutes = timeToMinutes(openingRange.open);
  const closeMinutes = timeToMinutes(openingRange.close);

  if (openMinutes === null || closeMinutes === null) {
    return { canAcceptOrders: true };
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const isOpen =
    openMinutes <= closeMinutes
      ? currentMinutes >= openMinutes && currentMinutes <= closeMinutes
      : currentMinutes >= openMinutes || currentMinutes <= closeMinutes;

  return isOpen
    ? { canAcceptOrders: true }
    : {
        canAcceptOrders: false,
        reason: 'OUTSIDE_HOURS',
        message: ORDERING_CLOSED_MESSAGE,
      };
}

function getDeliverySettings(settings: unknown) {
  if (!isRecord(settings) || !isRecord(settings.delivery)) {
    return null;
  }

  return settings.delivery;
}

function getOpeningRange(openingHours: unknown, date: Date) {
  if (!isRecord(openingHours)) {
    return null;
  }

  const dayKey = weekDayKeys[date.getDay()];
  const dayRange = openingHours[dayKey];

  if (isOpeningHourRange(dayRange)) {
    return dayRange;
  }

  const weekdayRange = openingHours.weekday;
  if (
    date.getDay() !== 0 &&
    date.getDay() !== 6 &&
    isOpeningHourRange(weekdayRange)
  ) {
    return weekdayRange;
  }

  return null;
}

function isOpeningHourRange(value: unknown): value is OpeningHourRange {
  return isRecord(value);
}

function timeToMinutes(value: unknown) {
  if (typeof value !== 'string') return null;

  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
