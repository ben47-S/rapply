import { serverFetch } from "@/app/lib/server-fetch";
import { RecipesView } from "@/app/components/RecipesView";

export default async function RecettesPage() {
  const [recipes, { currency }] = await Promise.all([
    serverFetch("/api/recipes").catch(() => []),
    serverFetch("/api/user").catch(() => ({ currency: "XOF" })),
  ]);

  return (
    <div className="mobile-app-main px-2 pb-6 sm:px-4">
      <RecipesView initial={recipes} currency={currency} />
    </div>
  );
}
