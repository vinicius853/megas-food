"use client";

import * as React from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { MasterShell } from "./components/master-shell";

export default function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard area="master">
      <MasterShell>{children}</MasterShell>
    </RouteGuard>
  );
}
