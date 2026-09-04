"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreIcon } from "@/app/components/IconButton";

const SECONDARY_LINKS = [
  { href: "/recettes", label: "Recettes" },
  { href: "/parametres", label: "Paramètres" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BurgerMenu({ align = "right" }: { align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Plus de liens"
        className={`hover:text-parchment transition-colors ${
          open ? "text-parchment" : "text-muted"
        }`}
      >
        <MoreIcon className="w-4 h-4" />
      </button>
      {open && (
        <div
          className={`absolute top-full mt-2 z-50 min-w-[140px] bg-surface-raised border border-border-log rounded-md py-1 shadow-lg ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {SECONDARY_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 text-sm transition-colors ${
                isActive(pathname, item.href)
                  ? "text-parchment bg-surface"
                  : "text-muted hover:text-parchment hover:bg-surface"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

