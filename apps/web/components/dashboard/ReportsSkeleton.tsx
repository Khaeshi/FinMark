import { Skeleton } from '@/components/ui/Skeleton'

export function ReportsSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="p-4 border-b border-white/5 flex gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-3 w-16" />)}
        </div>
        <div className="divide-y divide-white/5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex gap-6 items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
