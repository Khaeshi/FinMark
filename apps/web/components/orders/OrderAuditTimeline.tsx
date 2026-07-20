'use client'

const STATUS_DOT: Record<string, string> = {
  PENDING:    'bg-amber-400',
  CONFIRMED:  'bg-blue-400',
  PROCESSING: 'bg-purple-400',
  FULFILLED:  'bg-emerald-400',
  CANCELLED:  'bg-red-400',
  REFUNDED:   'bg-slate-400',
}

interface AuditEntry {
  id:        string
  action:    string
  userName:  string
  metadata:  Record<string, unknown> | null
  createdAt: string
}

interface Props {
  entries:   AuditEntry[]
  isLoading: boolean
  error:     string | null
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function describe(entry: AuditEntry): { title: string; detail?: string; dot: string } {
  const meta = entry.metadata || {}
  if (entry.action === 'ORDER_STATUS_CHANGED') {
    const from = String(meta.from ?? '?')
    const to = String(meta.to ?? '?')
    return {
      title: `Status ${from} → ${to}`,
      detail: `by ${entry.userName}`,
      dot: STATUS_DOT[to] || 'bg-emerald-400',
    }
  }
  if (entry.action === 'ORDER_FLAGGED_ANOMALY') {
    const mult = meta.multiplier != null ? `${meta.multiplier}x` : 'unusual'
    return {
      title: 'Anomaly flagged',
      detail: `Amount ${mult} client average · by ${entry.userName}`,
      dot: 'bg-amber-400',
    }
  }
  return {
    title: entry.action.replace(/_/g, ' '),
    detail: `by ${entry.userName}`,
    dot: 'bg-slate-400',
  }
}

export function OrderAuditTimeline({ entries, isLoading, error }: Props) {
  return (
    <div
      className="rounded-2xl border border-white/[0.06] p-5"
      style={{ background: 'rgba(255,255,255,0.025)' }}
    >
      <h2 className="text-white font-semibold text-sm mb-1">Audit trail</h2>
      <p className="text-slate-500 text-xs mb-4">Status changes and risk flags for this order</p>

      {isLoading && (
        <div className="flex justify-center py-8">
          <span className="w-5 h-5 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      )}

      {error && !isLoading && (
        <p className="text-red-400 text-sm py-4">{error}</p>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <p className="text-slate-500 text-sm py-4">No audit events yet — change the order status to generate one.</p>
      )}

      {!isLoading && entries.length > 0 && (
        <ul className="space-y-0">
          {entries.map((entry, i) => {
            const { title, detail, dot } = describe(entry)
            const isLast = i === entries.length - 1
            return (
              <li key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
                  {!isLast && <span className="w-px flex-1 bg-white/[0.08] my-1" />}
                </div>
                <div className={`pb-4 min-w-0 ${isLast ? 'pb-0' : ''}`}>
                  <p className="text-sm text-white font-medium">{title}</p>
                  {detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}
                  <p className="text-[11px] text-slate-600 mt-1">{formatTs(entry.createdAt)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
