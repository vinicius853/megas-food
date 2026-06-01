import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Util padrão shadcn: combina classes condicionais (clsx) e
 * resolve conflitos de utilitários Tailwind (tailwind-merge).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
