"use client";

import * as React from "react";

import { AppShell } from "@/components/layout/app-shell";
import { RouteGuard } from "@/components/auth/route-guard";

import { dashboardNav } from "@/lib/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard area="dashboard">
      <AppShell
        workspace="dashboard"
        sections={dashboardNav}
        homeHref="/dashboard"
      >
        {children}
      </AppShell>
    </RouteGuard>
  );
}