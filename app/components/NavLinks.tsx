"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BurgerMenu } from "@/app/components/BurgerMenu";
import { NAV, isActive } from "@/app/lib/nav";

export function NavLinks({ variant }: { variant: "sidebar" | "bottom" }) {
  const pathname = usePathname();

  if (variant === "sidebar") {
    return (
      <>
        <div className="flex items-center justify-between mb-8">
          <p className="font-display text-lg text-parchment">Rapply</p>
          <BurgerMenu align="left" />
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-surface-raised text-parchment"
                    : "text-muted hover:bg-surface-raised hover:text-parchment"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </>
    );
  }

  return (
    <>
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 truncate px-1 py-4 text-center text-xs leading-tight transition-colors ${
              active ? "text-parchment" : "text-muted hover:text-parchment"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
