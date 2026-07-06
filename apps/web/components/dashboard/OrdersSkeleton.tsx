import { Skeleton } from '@/components/ui/Skeleton'

export function OrdersSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="divide-y divide-white/5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
