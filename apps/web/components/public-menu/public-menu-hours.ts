import type {
  DeliveryOpeningHours,
  DeliverySettings,
  OpeningHourRange,
} from './public-menu.types'

function timeToMinutes(value?: string) {
  const [hours, minutes] = String(value ?? '')
    .split(':')
    .map((part) => Number(part))

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0

  return hours * 60 + minutes
}

const defaultOpeningRange: OpeningHourRange = {
  enabled: true,
  open: '18:00',
  close: '23:30',
}

const ORDERING_TIME_ZONE = 'America/Sao_Paulo'

const weekDays = [
  { key: 'sunday', label: 'domingo' },
  { key: 'monday', label: 'segunda-feira' },
  { key: 'tuesday', label: 'terca-feira' },
  { key: 'wednesday', label: 'quarta-feira' },
  { key: 'thursday', label: 'quinta-feira' },
  { key: 'friday', label: 'sexta-feira' },
  { key: 'saturday', label: 'sabado' },
] as const

function getOpeningRangeByDay(openingHours: DeliveryOpeningHours | undefined, day: number) {
  const dayKey = weekDays[day].key

  if (openingHours?.[dayKey]) return openingHours[dayKey] ?? defaultOpeningRange
  if (day === 0) return openingHours?.sunday ?? defaultOpeningRange
  if (day === 6) return openingHours?.saturday ?? defaultOpeningRange

  return openingHours?.weekday ?? defaultOpeningRange
}

function getOpeningRange(openingHours?: DeliveryOpeningHours, date = new Date()) {
  return getOpeningRangeByDay(openingHours, getLocalTimeInOrderingZone(date).dayIndex)
}

function getNextOpeningMessage(openingHours?: DeliveryOpeningHours, date = new Date()) {
  const localTime = getLocalTimeInOrderingZone(date)

  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDay = (localTime.dayIndex + offset) % 7
    const range = getOpeningRangeByDay(openingHours, nextDay)

    if (range.enabled === false) continue

    const label = offset === 1 ? 'amanha' : weekDays[nextDay].label

    return `Abrimos ${label} as ${range.open}.`
  }

  return 'Consulte nossos horarios de atendimento.'
}

export function getStoreOpenStatus(delivery?: DeliverySettings) {
  if (delivery?.isDeliveryOpen === false) {
    return {
      isOpen: false,
      message: 'Esta loja não está recebendo pedidos no momento.',
    }
  }

  const now = new Date()
  const localTime = getLocalTimeInOrderingZone(now)
  const previousRange = getOpeningRangeByDay(
    delivery?.openingHours,
    localTime.previousDayIndex,
  )

  if (isOpenFromPreviousOvernightRange(previousRange, localTime.minutes)) {
    return {
      isOpen: true,
      message: 'Aberto para pedidos.',
    }
  }

  const range = getOpeningRangeByDay(delivery?.openingHours, localTime.dayIndex)

  if (range.enabled === false) {
    return {
      isOpen: false,
      message: `Estamos fechados hoje. ${getNextOpeningMessage(delivery?.openingHours, now)}`,
    }
  }

  const openMinutes = timeToMinutes(range.open)
  const closeMinutes = timeToMinutes(range.close)
  const currentMinutes = localTime.minutes
  const isOpen =
    openMinutes <= closeMinutes
      ? currentMinutes >= openMinutes && currentMinutes <= closeMinutes
      : currentMinutes >= openMinutes

  return {
    isOpen,
    message: isOpen
      ? 'Aberto para pedidos.'
      : `Estamos fora do horario de atendimento. ${
          openMinutes <= closeMinutes && currentMinutes > closeMinutes
            ? getNextOpeningMessage(delivery?.openingHours, now)
            : `Abrimos as ${range.open}.`
        }`,
  }
}

function isOpenFromPreviousOvernightRange(
  range: OpeningHourRange | undefined,
  currentMinutes: number,
) {
  if (!range || range.enabled === false) return false

  const openMinutes = timeToMinutes(range.open)
  const closeMinutes = timeToMinutes(range.close)

  if (openMinutes <= closeMinutes) return false

  return currentMinutes <= closeMinutes
}

function getLocalTimeInOrderingZone(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ORDERING_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const weekday = parts.find((part) => part.type === 'weekday')?.value
  const hour = Number(parts.find((part) => part.type === 'hour')?.value)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value)
  const dayIndex = getWeekdayIndex(weekday)

  if (
    dayIndex === null ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return {
      dayIndex: date.getDay(),
      previousDayIndex: (date.getDay() + 6) % 7,
      minutes: date.getHours() * 60 + date.getMinutes(),
    }
  }

  return {
    dayIndex,
    previousDayIndex: (dayIndex + 6) % 7,
    minutes: hour * 60 + minute,
  }
}

function getWeekdayIndex(value: string | undefined) {
  switch (value) {
    case 'Sun':
      return 0
    case 'Mon':
      return 1
    case 'Tue':
      return 2
    case 'Wed':
      return 3
    case 'Thu':
      return 4
    case 'Fri':
      return 5
    case 'Sat':
      return 6
    default:
      return null
  }
}
