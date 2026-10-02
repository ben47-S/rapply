import { PageLayout } from "@/app/components/PageLayout";
import { Skeleton } from "@/app/components/Skeleton";

export default function ScheduleLoading() {
  return (
    <PageLayout
      title="Planning"
      variant="responsive-tools"
      refreshable={false}
      titleActions={<Skeleton className="h-6 w-6 rounded" />}
      actions={<Skeleton className="h-8 w-full md:w-64 rounded" />}
    >
      <div aria-busy="true" aria-label="Chargement" className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, col) => (
              <Skeleton key={col} className="h-16 w-full" />
            ))}
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
