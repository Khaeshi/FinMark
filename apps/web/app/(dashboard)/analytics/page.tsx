export default function AnalyticsPage() {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mb-1">
            Finmark — Project Finer
          </p>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Marketing analytics and business intelligence
          </p>
        </div>
        <div
          className="rounded-2xl border border-white/5 p-12 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <span className="text-4xl">📈</span>
          <p className="text-slate-400 text-sm">Analytics module coming soon</p>
          <p className="text-slate-600 text-xs">Connecting to data pipeline</p>
        </div>
      </div>
    )
  }