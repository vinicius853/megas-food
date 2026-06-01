import type { MenuPalette } from './public-menu.types'

export const PIZZA_IMAGES = [
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=90',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=90',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=90',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=90',
]

export const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&q=80',
  'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=300&q=80',
  'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&q=80',
]

const MENU_PALETTES: MenuPalette[] = [
  {
    id: 'classic-pizza',
    primary: '#D90416',
    secondary: '#FF4A00',
    accent: '#FDBA21',
    soft: '#FFF4DC',
    textOnPrimary: '#FFFFFF',
  },
  {
    id: 'hot-spicy',
    primary: '#5F0208',
    secondary: '#C1121F',
    accent: '#F97316',
    soft: '#FEF3C7',
    textOnPrimary: '#FFFFFF',
  },
  {
    id: 'fresh-healthy',
    primary: '#14532D',
    secondary: '#16A34A',
    accent: '#BBF7D0',
    soft: '#F0FDF4',
    textOnPrimary: '#FFFFFF',
  },
  {
    id: 'burger-grill',
    primary: '#4A2C17',
    secondary: '#C05621',
    accent: '#111827',
    soft: '#FFF7ED',
    textOnPrimary: '#FFFFFF',
  },
  {
    id: 'elegant',
    primary: '#0F172A',
    secondary: '#164E63',
    accent: '#CBD5E1',
    soft: '#F8FAFC',
    textOnPrimary: '#FFFFFF',
  },
  {
    id: 'sweet-warm',
    primary: '#BE5B72',
    secondary: '#FDBA9B',
    accent: '#FDA4AF',
    soft: '#FFF7ED',
    textOnPrimary: '#FFFFFF',
  },
]

export function getMenuPalette(paletteId?: string | null) {
  return (
    MENU_PALETTES.find((palette) => palette.id === paletteId) ??
    MENU_PALETTES[0]
  )
}
