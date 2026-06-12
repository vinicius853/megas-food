import type { Category, CategoryType } from "../types/menu-management";

const categoryTypeOrder: Record<CategoryType, number> = {
  PIZZA_FLAVOR_GROUP: 0,
  PRODUCT_SECTION: 1,
};

export function orderCategories(categories: Category[]) {
  return [...categories].sort((first, second) => {
    const typeDifference =
      categoryTypeOrder[first.type] - categoryTypeOrder[second.type];

    if (typeDifference !== 0) return typeDifference;

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

  const current = ordered[currentIndex];
  const sameTypeIndexes = ordered.flatMap((item, index) =>
    item.type === current.type ? [index] : [],
  );
  const position = sameTypeIndexes.indexOf(currentIndex);
  const targetPosition = direction === "up" ? position - 1 : position + 1;
  const targetIndex = sameTypeIndexes[targetPosition];

  if (targetIndex === undefined) return ordered;

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

  const sameType = ordered.filter((item) => item.type === category.type);
  const position = sameType.findIndex((item) => item.id === categoryId);

  return {
    canMoveUp: position > 0,
    canMoveDown: position >= 0 && position < sameType.length - 1,
  };
}
