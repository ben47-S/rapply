import { serverFetch } from "@/app/lib/server-fetch";
import { RecipesView } from "@/app/components/RecipesView";
import { BackButton } from "@/app/components/IconButton";

export default async function RecettesPage() {
  const [recipes, { currency }] = await Promise.all([
    serverFetch("/api/recipes").catch(() => []),
    serverFetch("/api/user").catch(() => ({ currency: "XOF" })),
  ]);

  return (
    <div className="px-2 sm:px-4">
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <h1 className="font-display text-2xl text-parchment">Recettes</h1>
      </div>
      <RecipesView initial={recipes} currency={currency} />
    </div>
  );
}
