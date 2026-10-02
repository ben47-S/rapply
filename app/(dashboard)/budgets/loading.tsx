import { PageLayout } from "@/app/components/PageLayout";
import { Skeleton } from "@/app/components/Skeleton";

export default function BudgetsLoading() {
  return (
    <PageLayout
      title="Budgets"
      refreshable={false}
      actions={<Skeleton className="ml-auto h-7 w-7 sm:h-6 sm:w-6 rounded" />}
    >
      <div aria-busy="true" aria-label="Chargement" className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </PageLayout>
  );
}
