import type { MenuPalette } from "./public-menu.types";

const MENU_PALETTES: MenuPalette[] = [
  {
    id: "classic-pizza",
    primary: "#D90416",
    secondary: "#FF4A00",
    accent: "#FDBA21",
    soft: "#FFF4DC",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "hot-spicy",
    primary: "#5F0208",
    secondary: "#C1121F",
    accent: "#F97316",
    soft: "#FEF3C7",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "fresh-healthy",
    primary: "#14532D",
    secondary: "#16A34A",
    accent: "#BBF7D0",
    soft: "#F0FDF4",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "burger-grill",
    primary: "#4A2C17",
    secondary: "#C05621",
    accent: "#111827",
    soft: "#FFF7ED",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "elegant",
    primary: "#0F172A",
    secondary: "#164E63",
    accent: "#CBD5E1",
    soft: "#F8FAFC",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "sweet-warm",
    primary: "#BE5B72",
    secondary: "#FDBA9B",
    accent: "#FDA4AF",
    soft: "#FFF7ED",
    textOnPrimary: "#FFFFFF",
  },
];

export function getMenuPalette(paletteId?: string | null) {
  return (
    MENU_PALETTES.find((palette) => palette.id === paletteId) ??
    MENU_PALETTES[0]
  );
}
