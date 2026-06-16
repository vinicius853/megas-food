"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

let scrollLockCount = 0;
let lockedScrollY = 0;
let originalBodyStyle: {
  position: string;
  top: string;
  width: string;
  overflow: string;
} | null = null;
const modalBackStack: string[] = [];

type PublicMenuFloatingPanelProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidthClassName?: string;
  onBack?: () => boolean | void;
  zIndexClassName?: string;
};

export function PublicMenuFloatingPanel({
  children,
  className,
  contentClassName,
  maxWidthClassName = "max-w-md",
  onBack,
  zIndexClassName = "z-[70]",
}: PublicMenuFloatingPanelProps) {
  const tokenRef = useRef(`public-menu-panel-${crypto.randomUUID()}`);
  const onBackRef = useRef(onBack);
  const hasBackHandler = Boolean(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, []);

  useEffect(() => {
    if (!hasBackHandler) return;

    const token = tokenRef.current;
    modalBackStack.push(token);
    window.history.pushState(
      { megasFoodPublicMenuPanel: token },
      "",
      window.location.href,
    );

    function handlePopState() {
      if (modalBackStack[modalBackStack.length - 1] !== token) return;

      const shouldStayOpen = onBackRef.current?.() === true;

      if (shouldStayOpen) {
        window.history.pushState(
          { megasFoodPublicMenuPanel: token },
          "",
          window.location.href,
        );
      }
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      const index = modalBackStack.lastIndexOf(token);
      if (index >= 0) {
        modalBackStack.splice(index, 1);
      }
    };
  }, [hasBackHandler]);

  return (
    <div
      className={cn(
        "fixed inset-0 flex touch-none items-end justify-center overscroll-none bg-black/60 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 font-sans backdrop-blur-sm md:items-center md:p-6",
        zIndexClassName,
        className,
      )}
    >
      <div
        className={cn(
          "flex max-h-[calc(100dvh-7.5rem)] min-h-0 w-full touch-auto flex-col overflow-hidden overscroll-contain rounded-b-[24px] rounded-t-[32px] bg-white shadow-2xl md:max-h-[calc(100dvh-3rem)] md:rounded-[28px]",
          maxWidthClassName,
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function lockBodyScroll() {
  scrollLockCount += 1;
  if (scrollLockCount > 1) return;

  lockedScrollY = window.scrollY;
  originalBodyStyle = {
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
    overflow: document.body.style.overflow,
  };

  document.body.style.position = "fixed";
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.style.width = "100%";
  document.body.style.overflow = "hidden";
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(scrollLockCount - 1, 0);
  if (scrollLockCount > 0 || !originalBodyStyle) return;

  document.body.style.position = originalBodyStyle.position;
  document.body.style.top = originalBodyStyle.top;
  document.body.style.width = originalBodyStyle.width;
  document.body.style.overflow = originalBodyStyle.overflow;
  window.scrollTo(0, lockedScrollY);
  originalBodyStyle = null;
  lockedScrollY = 0;
}
