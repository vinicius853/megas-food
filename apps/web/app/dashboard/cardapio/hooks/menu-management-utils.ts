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
  return error instanceof Error ? error.message : fallback
}
