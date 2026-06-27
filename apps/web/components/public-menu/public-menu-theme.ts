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
  {
    id: "wood-fired-oven",
    primary: "#B8321B",
    secondary: "#E85D1C",
    accent: "#F6A23A",
    soft: "#FFF1DC",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "italian-cantina",
    primary: "#0F6B3A",
    secondary: "#D62828",
    accent: "#F4A261",
    soft: "#FFF3E0",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "popular-delivery",
    primary: "#E63900",
    secondary: "#FFB703",
    accent: "#2B2D42",
    soft: "#FFF8E8",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "bbq-ember",
    primary: "#3A1F12",
    secondary: "#7A2E12",
    accent: "#D97706",
    soft: "#FFF4E6",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "tropical-acai",
    primary: "#4B145F",
    secondary: "#7B2CBF",
    accent: "#F72585",
    soft: "#E9D8FD",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "bakery-coffee",
    primary: "#5C3317",
    secondary: "#A0522D",
    accent: "#D9A441",
    soft: "#FFF4DC",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "crispy-pastry",
    primary: "#C2410C",
    secondary: "#F59E0B",
    accent: "#78350F",
    soft: "#FFF7ED",
    textOnPrimary: "#FFFFFF",
  },
  {
    id: "dark-premium",
    primary: "#111827",
    secondary: "#7C2D12",
    accent: "#D97706",
    soft: "#F8E7C9",
    textOnPrimary: "#FFFFFF",
  },
];

export function getMenuPalette(paletteId?: string | null) {
  return (
    MENU_PALETTES.find((palette) => palette.id === paletteId) ??
    MENU_PALETTES[0]
  );
}
