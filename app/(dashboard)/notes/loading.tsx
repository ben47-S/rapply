import { PageLayout } from "@/app/components/PageLayout";
import { Skeleton } from "@/app/components/Skeleton";

export default function NotesLoading() {
  return (
    <PageLayout
      title="Notes"
      variant="search"
      refreshable={false}
      actions={<Skeleton className="h-7 w-7 sm:h-6 sm:w-6 rounded" />}
      subheader={
        <input
          disabled
          placeholder="Rechercher une note…"
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
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
    </PageLayout>
  );
}
