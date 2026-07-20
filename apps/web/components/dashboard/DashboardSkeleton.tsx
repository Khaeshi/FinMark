'use client'

export function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-pulse">
      <div className="flex flex-col gap-3">
        <div className="h-8 w-72 rounded-lg bg-white/[0.04]" />
        <div className="h-4 w-48 rounded bg-white/[0.04]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] p-5"
            style={{ background: 'rgba(255,255,255,0.025)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-9 w-9 rounded-xl bg-white/[0.04]" />
              <div className="h-5 w-14 rounded-full bg-white/[0.04]" />
            </div>
            <div className="h-7 w-28 rounded bg-white/[0.04] mb-2" />
            <div className="h-3 w-20 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 rounded-2xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="h-5 w-40 rounded bg-white/[0.04] mb-6" />
          <div className="flex items-end justify-between h-[260px] gap-2">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-white/[0.04]"
                style={{ height: `${30 + ((i * 17) % 70)}%` }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="h-5 w-32 rounded bg-white/[0.04] mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-white/[0.04]" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-28 rounded bg-white/[0.04]" />
                    <div className="h-3 w-16 rounded bg-white/[0.04]" />
                  </div>
                </div>
                <div className="h-4 w-16 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
