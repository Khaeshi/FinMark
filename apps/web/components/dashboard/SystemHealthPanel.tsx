'use client'
import { useEffect, useState } from 'react'
import { Activity, Shield } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface ServiceStatus {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  latency?: number
}

interface WafStatus {
  enabled: boolean
  blocksTotal: number
}

const STATUS_STYLE: Record<string, string> = {
  healthy:  'bg-emerald-500',
  degraded: 'bg-amber-500',
  down:     'bg-red-500',
}

export function SystemHealthPanel() {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [waf, setWaf]           = useState<WafStatus | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/health`)
        const json = await res.json()
        if (!cancelled) {
          setServices(json.services || [{ service: 'api-gateway', status: json.status || 'healthy' }])
          if (json.waf) {
            setWaf({
              enabled: Boolean(json.waf.enabled),
              blocksTotal: Number(json.waf.blocksTotal) || 0,
            })
          }
        }
      } catch {
        if (!cancelled) setServices([{ service: 'api-gateway', status: 'down' }])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div
      className="rounded-2xl border border-white/[0.06] p-5"
      style={{ background: 'rgba(255,255,255,0.025)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-emerald-400" />
        <h2 className="text-white font-semibold text-base">System Health</h2>
      </div>
      {loading ? (
        <div className="flex justify-center py-6">
          <span className="w-5 h-5 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {waf?.enabled && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-sm text-emerald-300 font-medium">WAF: active</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {waf.blocksTotal} block{waf.blocksTotal === 1 ? '' : 's'}
              </span>
            </div>
          )}
          <ul className="space-y-2">
            {services.map(s => (
              <li key={s.service} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[s.status] || 'bg-slate-500'}`} />
                  <span className="text-sm text-slate-300 font-medium">{s.service}</span>
                </div>
                <div className="flex items-center gap-3">
                  {typeof s.latency === 'number' && (
                    <span className="text-[11px] text-slate-500">{s.latency}ms</span>
                  )}
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {s.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
