'use client'

export function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="h-8 w-64 rounded bg-slate-800" />
        <div className="h-4 w-40 rounded bg-slate-800" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 rounded bg-slate-800" />
              <div className="h-10 w-10 rounded-full bg-slate-800" />
            </div>

            <div className="h-8 w-32 rounded bg-slate-800 mb-3" />
            <div className="h-4 w-20 rounded bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Charts + Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="h-6 w-40 rounded bg-slate-800 mb-6" />

          <div className="flex items-end justify-between h-[320px] gap-3">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-slate-800"
                style={{
                  height: `${30 + ((i * 17) % 70)}%`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="h-6 w-32 rounded bg-slate-800 mb-6" />

          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-slate-800 pb-3"
              >
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded bg-slate-800" />
                  <div className="h-3 w-20 rounded bg-slate-800" />
                </div>

                <div className="h-6 w-16 rounded-full bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}