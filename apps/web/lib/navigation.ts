import {
  LayoutDashboard,
  Users,
  UserCog,
  ScrollText,
  ShieldCheck,
  Wallet,
  Settings,
  UtensilsCrossed,
  ClipboardList,
  TicketPercent,
  Truck,
  Paintbrush,
  Headphones,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

/**
 * Menu do painel master (plataforma).
 * Rotas definidas em apps/web/app/master/**.
 */
export const masterNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/master", icon: LayoutDashboard },
      { label: "Clientes", href: "/master/clientes", icon: Users },
      { label: "Usuários", href: "/master/usuarios", icon: UserCog },
      { label: "Auditoria", href: "/master/auditoria", icon: ScrollText },
      { label: "Permissões", href: "/master/permissoes", icon: ShieldCheck },
      { label: "Financeiro", href: "/master/financeiro", icon: Wallet },
      { label: "Configurações", href: "/master/configuracoes", icon: Settings },
    ],
  },
];

/**
 * Menu do painel da pizzaria.
 * Rotas definidas em apps/web/app/dashboard/**.
 */
export const dashboardNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Cardápio", href: "/dashboard/cardapio", icon: UtensilsCrossed },
      { label: "Pedidos", href: "/dashboard/pedidos", icon: ClipboardList },
      { label: "Cupons", href: "/dashboard/cardapio/cupons", icon: TicketPercent },
      { label: "Financeiro", href: "/dashboard/financeiro", icon: Wallet },
      { label: "Entregas", href: "/dashboard/entregas", icon: Truck },
      { label: "Personalizacao", href: "/dashboard/personalizacao", icon: Paintbrush },
      {
        label: "Suporte",
        href: "https://wa.me/5524998522102?text=Ol%C3%A1!%20Preciso%20de%20suporte%20no%20sistema%20Megas%20Food.",
        icon: Headphones,
        external: true,
      },
      { label: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
    ],
  },
];

export type WorkspaceKind = "master" | "dashboard";

export const workspaceMeta: Record<
  WorkspaceKind,
  { title: string; subtitle: string; accent: string }
> = {
  master: {
    title: "Megas Food",
    subtitle: "Painel Master",
    accent: "from-slate-900 to-slate-700",
  },
  dashboard: {
    title: "Megas Food",
    subtitle: "Pizzaria",
    accent: "from-orange-600 to-rose-600",
  },
};
