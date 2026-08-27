"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/reminders", label: "Rappels" },
  { href: "/notes", label: "Notes" },
  { href: "/finances", label: "Finances" },
  { href: "/schedule", label: "Planning" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavLinks({ variant }: { variant: "sidebar" | "bottom" }) {
  const pathname = usePathname();

  if (variant === "sidebar") {
    return (
      <>
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
            className={`flex-1 truncate px-1 py-3 text-center text-[11px] leading-tight transition-colors ${
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
