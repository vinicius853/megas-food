export function temporaryId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function generateSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (!(error instanceof Error)) return fallback

  try {
    const parsed = JSON.parse(error.message) as {
      message?: string | string[]
    }

    if (Array.isArray(parsed.message)) {
      return parsed.message.join(', ')
    }

    return parsed.message || error.message
  } catch {
    return error.message || fallback
  }
}
