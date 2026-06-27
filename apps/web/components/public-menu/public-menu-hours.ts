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

const weekDays = [
  { key: 'sunday', label: 'domingo' },
  { key: 'monday', label: 'segunda-feira' },
  { key: 'tuesday', label: 'terca-feira' },
  { key: 'wednesday', label: 'quarta-feira' },
  { key: 'thursday', label: 'quinta-feira' },
  { key: 'friday', label: 'sexta-feira' },
  { key: 'saturday', label: 'sabado' },
] as const

function getOpeningRange(openingHours?: DeliveryOpeningHours, date = new Date()) {
  const day = date.getDay()
  const dayKey = weekDays[day].key

  if (openingHours?.[dayKey]) return openingHours[dayKey] ?? defaultOpeningRange
  if (day === 0) return openingHours?.sunday ?? defaultOpeningRange
  if (day === 6) return openingHours?.saturday ?? defaultOpeningRange

  return openingHours?.weekday ?? defaultOpeningRange
}

function getNextOpeningMessage(openingHours?: DeliveryOpeningHours, date = new Date()) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + offset)

    const range = getOpeningRange(openingHours, nextDate)

    if (range.enabled === false) continue

    const label = offset === 1 ? 'amanha' : weekDays[nextDate.getDay()].label

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
  const range = getOpeningRange(delivery?.openingHours, now)

  if (range.enabled === false) {
    return {
      isOpen: false,
      message: `Estamos fechados hoje. ${getNextOpeningMessage(delivery?.openingHours, now)}`,
    }
  }

  const openMinutes = timeToMinutes(range.open)
  const closeMinutes = timeToMinutes(range.close)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const isOpen =
    openMinutes <= closeMinutes
      ? currentMinutes >= openMinutes && currentMinutes <= closeMinutes
      : currentMinutes >= openMinutes || currentMinutes <= closeMinutes

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
