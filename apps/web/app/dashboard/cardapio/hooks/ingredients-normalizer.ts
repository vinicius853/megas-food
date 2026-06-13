export function capitalizeWords(value: string) {
  return value
    .trim()
    .replace(/[ \t]+/g, " ")
    .replace(/\p{L}[\p{L}\p{M}]*/gu, (word) => {
      const normalized = word.toLocaleLowerCase("pt-BR");

      return (
        normalized.charAt(0).toLocaleUpperCase("pt-BR") +
        normalized.slice(1)
      );
    });
}

export function normalizeIngredientsText(value?: string | null) {
  const normalized = capitalizeWords(value ?? "");

  return normalized || null;
}
