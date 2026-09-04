import { BackButton } from "@/app/components/IconButton";

export default function RecettesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <h1 className="font-display text-2xl text-parchment">Recettes</h1>
      </div>
      <p className="text-sm text-muted">Aucune recette pour le moment.</p>
    </div>
  );
}
