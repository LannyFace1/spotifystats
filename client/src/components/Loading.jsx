// Reusable loading components
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className={`${s} border-2 border-spotify-gray border-t-spotify-green rounded-full animate-spin`} />
  );
}

export function LoadingScreen() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-spotify-lightgray text-sm">Lädt...</p>
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div className={`bg-spotify-gray animate-pulse rounded ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card space-y-2">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
