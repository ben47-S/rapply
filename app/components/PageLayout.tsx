"use client";

import type { ReactNode } from "react";

import { PullToRefresh } from "@/app/components/PullToRefresh";

type PageLayoutVariant = "standard" | "search" | "filters" | "responsive-tools";

type PageLayoutProps = {
  title: string;
  children: ReactNode;
  leading?: ReactNode;
  titleActions?: ReactNode;
  actions?: ReactNode;
  controls?: ReactNode;
  subheader?: ReactNode;
  variant?: PageLayoutVariant;
  refreshable?: boolean;
  standalone?: boolean;
};

export function PageLayout({
  title,
  children,
  leading,
  titleActions,
  actions,
  controls,
  subheader,
  variant = "standard",
  refreshable = true,
  standalone = false,
}: PageLayoutProps) {
  const rootClass = [
    "mobile-page-root",
    variant === "search" && "mobile-page-root--search",
    variant === "filters" && "mobile-page-root--filters",
    variant === "responsive-tools" && "mobile-page-root--responsive-tools",
    standalone && "mobile-page-root--standalone",
  ]
    .filter(Boolean)
    .join(" ");

  const headerClass = [
    "mobile-page-header",
    "flex",
    variant === "filters" && "flex-col",
    variant === "responsive-tools" && "flex-col md:flex-row",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <header className={headerClass}>
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            {leading}
            <h1 className="font-display text-2xl text-parchment">{title}</h1>
            {titleActions}
          </div>
          {actions && variant !== "responsive-tools" && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
        {actions && variant === "responsive-tools" && (
          <div className="w-full md:w-auto mt-2 md:mt-0">{actions}</div>
        )}
        {controls && <div className="w-full mt-2">{controls}</div>}
      </header>

      {subheader && (
        <div className="mobile-page-header mobile-page-subheader !z-30">
          {subheader}
        </div>
      )}

      <PullToRefresh enabled={refreshable}>{children}</PullToRefresh>
    </div>
  );
}