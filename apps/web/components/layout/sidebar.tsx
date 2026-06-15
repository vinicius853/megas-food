"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Pizza } from "lucide-react";

import megasFoodLogo from "@/app/login/imagens/megas-food-logo.png";
import { cn } from "@/lib/utils";

import { type NavSection, type WorkspaceKind } from "@/lib/navigation";
import type { DashboardBrand } from "./app-shell";

interface SidebarProps {
  workspace: WorkspaceKind;
  sections: NavSection[];
  homeHref: string;
  brand?: DashboardBrand | null;
}

export function Sidebar({
  workspace,
  sections,
  homeHref,
  brand,
}: SidebarProps) {
  const isMaster = workspace === "master";
  const displayName = isMaster ? "Megas Food" : brand?.name || "Megas Food";
  const displaySubtitle = isMaster
    ? "Painel Master"
    : brand?.subtitle || "Painel da loja";
  const BrandIcon = isMaster ? Building2 : Pizza;

  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
      <div className="flex flex-col items-center border-b border-slate-200 px-6 py-7 text-center">
        <div
          className={cn(
            "relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl shadow-sm",
            isMaster
              ? "bg-slate-900 text-white"
              : "bg-orange-50 text-orange-600",
          )}
        >
          {!isMaster && brand?.logoUrl ? (
            <Image
              src={brand.logoUrl}
              alt={displayName}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : isMaster ? (
            <Image
              src={megasFoodLogo}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              sizes="80px"
              priority
            />
          ) : (
            <BrandIcon className="h-10 w-10" />
          )}
        </div>

        <h2 className="mt-4 text-lg font-black tracking-tight text-slate-950">
          {displayName}
        </h2>

        <p className="mt-1 text-sm text-slate-500">{displaySubtitle}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        {sections.map((section, index) => (
          <SidebarSection key={index} section={section} homeHref={homeHref} />
        ))}
      </nav>

      <div className="p-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-950 ring-1 ring-slate-200">
              <Image
                src={megasFoodLogo}
                alt=""
                aria-hidden="true"
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900">Megas Food</p>

              <p className="text-xs text-slate-500">
                {isMaster ? "Gestao da plataforma" : "Sistema para pizzarias"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarSection({
  section,
  homeHref,
}: {
  section: NavSection;
  homeHref: string;
}) {
  const pathname = usePathname();

  return (
    <div className="mb-5">
      {section.title && (
        <p className="mb-3 px-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          {section.title}
        </p>
      )}

      <ul className="space-y-2">
        {section.items.map((item) => {
          const Icon = item.icon;
          const activeItemHref = section.items
            .filter((currentItem) => {
              if (currentItem.external) return false;
              if (currentItem.href === homeHref) return pathname === homeHref;

              return (
                pathname === currentItem.href ||
                pathname.startsWith(currentItem.href + "/")
              );
            })
            .sort(
              (first, second) => second.href.length - first.href.length,
            )[0]?.href;
          const active = item.href === activeItemHref;

          const content = (
            <>
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  active
                    ? "text-orange-600"
                    : "text-slate-400 group-hover:text-orange-600",
                )}
              />

              <span className="truncate">{item.label}</span>
            </>
          );

          return (
            <li key={item.href}>
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "group flex items-center gap-4 rounded-3xl px-4 py-3 text-sm font-black transition",
                    "text-slate-700 hover:bg-slate-50 hover:text-orange-600",
                  )}
                >
                  {content}
                </a>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-4 rounded-3xl px-4 py-3 text-sm font-black transition",
                    active
                      ? "bg-orange-50 text-orange-600 shadow-sm"
                      : "text-slate-700 hover:bg-slate-50 hover:text-orange-600",
                  )}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
