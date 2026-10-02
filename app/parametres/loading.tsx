import { PageLayout } from "@/app/components/PageLayout";
import { Skeleton } from "@/app/components/Skeleton";
import { BackButton } from "@/app/components/IconButton";

export default function ParametresLoading() {
  return (
    <div className="min-h-screen px-4 pb-6 md:px-8 md:py-6">
      <PageLayout title="Paramètres" leading={<BackButton />} standalone refreshable={false}>
        <div
          aria-busy="true"
          aria-label="Chargement"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-md lg:max-w-none"
        >
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-3 max-w-md">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </PageLayout>
    </div>
  );
}
