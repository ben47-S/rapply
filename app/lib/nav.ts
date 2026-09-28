// Source unique de la navigation : `NavLinks` (sidebar + bottom) et `BurgerMenu`
// lisaient chacun leur propre liste et dupliquaient `isActive`, ce qui a laissé
// /budgets hors de la nav alors que la page existe.

export type NavLink = { href: string; label: string };

export const NAV: NavLink[] = [
  { href: "/", label: "Accueil" },
  { href: "/reminders", label: "Rappels" },
  { href: "/notes", label: "Notes" },
  { href: "/finances", label: "Finances" },
  { href: "/budgets", label: "Budgets" },
  { href: "/schedule", label: "Planning" },
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
