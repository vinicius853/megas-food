export function capitalizePublicDisplayName(value: string | null | undefined) {
  const text = String(value ?? '').trim()
  if (!text) return text

  const firstLetterIndex = text.search(/\p{L}/u)
  if (firstLetterIndex < 0) return text

  return (
    text.slice(0, firstLetterIndex) +
    text.charAt(firstLetterIndex).toLocaleUpperCase('pt-BR') +
    text.slice(firstLetterIndex + 1)
  )
}
