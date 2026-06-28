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

const ORDERING_TIME_ZONE = 'America/Sao_Paulo';

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

  const localTime = getLocalTimeInOrderingZone(date);
  const previousOpeningRange = getOpeningRange(
    delivery?.openingHours,
    localTime.previousDayIndex,
  );

  if (isOpenFromPreviousOvernightRange(previousOpeningRange, localTime.minutes)) {
    return { canAcceptOrders: true };
  }

  const openingRange = getOpeningRange(
    delivery?.openingHours,
    localTime.dayIndex,
  );

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

  const isOpen = isOpenInCurrentDayRange(
    openingRange,
    localTime.minutes,
    openMinutes,
    closeMinutes,
  );

  return isOpen
    ? { canAcceptOrders: true }
    : {
        canAcceptOrders: false,
        reason: 'OUTSIDE_HOURS',
        message: ORDERING_CLOSED_MESSAGE,
      };
}

function isOpenFromPreviousOvernightRange(
  openingRange: OpeningHourRange | null,
  currentMinutes: number,
) {
  if (!openingRange || openingRange.enabled === false) {
    return false;
  }

  const openMinutes = timeToMinutes(openingRange.open);
  const closeMinutes = timeToMinutes(openingRange.close);

  if (
    openMinutes === null ||
    closeMinutes === null ||
    openMinutes <= closeMinutes
  ) {
    return false;
  }

  return currentMinutes <= closeMinutes;
}

function isOpenInCurrentDayRange(
  openingRange: OpeningHourRange,
  currentMinutes: number,
  openMinutes: number,
  closeMinutes: number,
) {
  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  return currentMinutes >= openMinutes;
}

function getDeliverySettings(settings: unknown) {
  if (!isRecord(settings) || !isRecord(settings.delivery)) {
    return null;
  }

  return settings.delivery;
}

function getOpeningRange(openingHours: unknown, dayIndex: number) {
  if (!isRecord(openingHours)) {
    return null;
  }

  const dayKey = weekDayKeys[dayIndex];
  const dayRange = openingHours[dayKey];

  if (isOpeningHourRange(dayRange)) {
    return dayRange;
  }

  const weekdayRange = openingHours.weekday;
  if (
    dayIndex !== 0 &&
    dayIndex !== 6 &&
    isOpeningHourRange(weekdayRange)
  ) {
    return weekdayRange;
  }

  return null;
}

function getLocalTimeInOrderingZone(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ORDERING_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  const dayIndex = getWeekdayIndex(weekday);

  if (
    dayIndex === null ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return {
      dayIndex: date.getDay(),
      previousDayIndex: (date.getDay() + 6) % 7,
      minutes: date.getHours() * 60 + date.getMinutes(),
    };
  }

  return {
    dayIndex,
    previousDayIndex: (dayIndex + 6) % 7,
    minutes: hour * 60 + minute,
  };
}

function getWeekdayIndex(value: string | undefined) {
  switch (value) {
    case 'Sun':
      return 0;
    case 'Mon':
      return 1;
    case 'Tue':
      return 2;
    case 'Wed':
      return 3;
    case 'Thu':
      return 4;
    case 'Fri':
      return 5;
    case 'Sat':
      return 6;
    default:
      return null;
  }
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
