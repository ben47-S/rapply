function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface-raised ${className}`} />;
}

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement" className="space-y-6 px-4 py-6 md:px-8">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
