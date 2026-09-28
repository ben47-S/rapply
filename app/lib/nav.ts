// Source unique de la navigation : `NavLinks` (sidebar + bottom) et `BurgerMenu`
// lisaient chacun leur propre liste et dupliquaient `isActive`, ce qui a laissé
// /budgets hors de la nav alors que la page existe.

export type NavIcon = "home" | "bell" | "note" | "wallet" | "budget" | "calendar";

export type NavLink = { href: string; label: string; icon?: NavIcon };

export const NAV: NavLink[] = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/reminders", label: "Rappels", icon: "bell" },
  { href: "/notes", label: "Notes", icon: "note" },
  { href: "/finances", label: "Finances", icon: "wallet" },
  { href: "/budgets", label: "Budgets", icon: "budget" },
  { href: "/schedule", label: "Planning", icon: "calendar" },
];

// /recettes et /parametres vivent hors du groupe (dashboard) : pas de sidebar ni
// de bottom nav, on les garde donc dans le burger.
export const SECONDARY_LINKS: NavLink[] = [
  { href: "/recettes", label: "Recettes" },
  { href: "/parametres", label: "Paramètres" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
