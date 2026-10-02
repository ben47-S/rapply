import { PageLayout } from "@/app/components/PageLayout";
import { Skeleton } from "@/app/components/Skeleton";

export default function FinancesLoading() {
  return (
    <PageLayout
      title="Finances"
      refreshable={false}
      actions={
        <>
          <Skeleton className="h-7 w-7 sm:h-6 sm:w-6 rounded" />
          <Skeleton className="h-7 w-7 sm:h-6 sm:w-6 rounded" />
        </>
      }
    >
      <div aria-busy="true" aria-label="Chargement" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-16 w-full sm:h-20" />
          <Skeleton className="h-16 w-full sm:h-20" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
