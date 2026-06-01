import type { PizzaMode } from '../types/menu-management'

export const pizzaModes: {
  id: PizzaMode
  label: string
}[] = [
  {
    id: 'round',
    label: 'Pizza redonda',
  },
  {
    id: 'square',
    label: 'Pizza quadrada',
  },
  {
    id: 'mixed',
    label: 'Redonda + quadrada',
  },
]

export const fixedProductSectionSlugs = [
  'pizzas',
  'bebidas',
  'adicionais',
]
