"use client";

import { usePathname } from "next/navigation";
import { BurgerMenu } from "@/app/components/BurgerMenu";

const HIDE_HEADER_ON = ["/parametres"];

export function MobileHeader() {
  const pathname = usePathname();

  if (HIDE_HEADER_ON.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border-log bg-surface md:hidden">
      <p className="font-display text-lg text-parchment">Rapply</p>
      <BurgerMenu align="right" />
    </header>
  );
}
