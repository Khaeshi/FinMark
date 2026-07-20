import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Settings</h1>
      </div>

      <div
        className="rounded-2xl border border-white/[0.06] p-16 flex flex-col items-center justify-center gap-4 min-h-[400px]"
        style={{ background: 'rgba(255,255,255,0.025)' }}
      >
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <Settings className="h-7 w-7 text-slate-500" />
        </div>
        <p className="text-slate-400 text-sm font-medium">Configuration panel</p>
      </div>
    </div>
  )
}
