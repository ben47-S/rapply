"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BurgerMenu } from "@/app/components/BurgerMenu";
import {
  BellIcon,
  BudgetIcon,
  CalendarIcon,
  HomeIcon,
  NoteIcon,
  WalletIcon,
} from "@/app/components/IconButton";
import { NAV, isActive, type NavIcon } from "@/app/lib/nav";

const NAV_ICONS: Record<NavIcon, (props: { className?: string }) => React.ReactElement> = {
  home: HomeIcon,
  bell: BellIcon,
  note: NoteIcon,
  wallet: WalletIcon,
  budget: BudgetIcon,
  calendar: CalendarIcon,
};

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
        const Icon = item.icon ? NAV_ICONS[item.icon] : null;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center py-3.5 transition-colors ${
              active ? "text-parchment" : "text-muted hover:text-parchment"
            }`}
          >
            {Icon ? (
              <Icon className="w-[22px] h-[22px]" />
            ) : (
              <span className="text-xs">{item.label}</span>
            )}
          </Link>
        );
      })}
    </>
  );
}
