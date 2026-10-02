import { PageLayout } from "@/app/components/PageLayout";
import { Skeleton } from "@/app/components/Skeleton";

export default function RemindersLoading() {
  return (
    <PageLayout
      title="Rappels"
      variant="filters"
      refreshable={false}
      actions={<Skeleton className="h-7 w-7 sm:h-6 sm:w-6 rounded" />}
      controls={
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Skeleton className="h-7 w-24 rounded" />
            <Skeleton className="h-7 w-28 rounded" />
          </div>
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
          </div>
        </>
      }
    >
      <div aria-busy="true" aria-label="Chargement" className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </PageLayout>
  );
}
