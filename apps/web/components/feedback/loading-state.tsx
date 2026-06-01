import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  label = "Carregando...",
  className,
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-slate-500",
        fullScreen ? "min-h-[60vh]" : "py-12",
        className
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/**
 * Skeleton genérico — útil para placeholders de cards/linhas.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/70", className)}
      {...props}
    />
  );
}
