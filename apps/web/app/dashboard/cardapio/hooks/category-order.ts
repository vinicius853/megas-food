import type { Category } from "../types/menu-management";

export function orderCategories(categories: Category[]) {
  return [...categories].sort((first, second) => {
    const sortDifference =
      (first.sortOrder ?? 0) - (second.sortOrder ?? 0);

    if (sortDifference !== 0) return sortDifference;

    return first.name.localeCompare(second.name, "pt-BR");
  });
}

export function moveCategory(
  categories: Category[],
  categoryId: string,
  direction: "up" | "down",
) {
  const ordered = orderCategories(categories);
  const currentIndex = ordered.findIndex((item) => item.id === categoryId);

  if (currentIndex < 0) return ordered;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex === undefined) return ordered;
  if (targetIndex < 0 || targetIndex >= ordered.length) return ordered;

  [ordered[currentIndex], ordered[targetIndex]] = [
    ordered[targetIndex],
    ordered[currentIndex],
  ];

  return ordered.map((category, sortOrder) => ({
    ...category,
    sortOrder,
  }));
}

export function getCategoryMoveAvailability(
  categories: Category[],
  categoryId: string,
) {
  const ordered = orderCategories(categories);
  const category = ordered.find((item) => item.id === categoryId);

  if (!category) return { canMoveUp: false, canMoveDown: false };

  const position = ordered.findIndex((item) => item.id === categoryId);

  return {
    canMoveUp: position > 0,
    canMoveDown: position >= 0 && position < ordered.length - 1,
  };
}
