import { PageLayout } from "@/app/components/PageLayout";
import { Skeleton } from "@/app/components/Skeleton";
import { BackButton } from "@/app/components/IconButton";

export default function RecettesLoading() {
  return (
    <div className="px-2 pb-6 sm:px-4 md:py-6">
      <PageLayout
        title="Recettes"
        variant="search"
        standalone
        refreshable={false}
        leading={<BackButton />}
        actions={<Skeleton className="h-7 w-7 sm:h-6 sm:w-6 rounded" />}
        subheader={
          <input
            disabled
            placeholder="Rechercher une recette…"
            className="w-full rounded border border-border-log bg-ink px-3 py-2 text-sm outline-none opacity-60"
          />
        }
      >
        <div
          aria-busy="true"
          aria-label="Chargement"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </PageLayout>
    </div>
  );
}
