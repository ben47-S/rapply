"use client";

import { BurgerMenu } from "@/app/components/BurgerMenu";

export function MobileHeader() {
  return (
    <header className="mobile-app-header fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-border-log bg-surface md:hidden">
      <p className="font-display text-lg text-parchment">Rapply</p>
      <BurgerMenu align="right" />
    </header>
  );
}
