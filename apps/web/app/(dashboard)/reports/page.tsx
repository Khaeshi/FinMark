'use client'
import { useReports } from '@/hooks/useReports'
import { formatPHP } from '@/lib/format'

interface FinancialItem {
  id?:        string
  clientId?:  string
  period?:    string
  revenue?:   string
  expenses?:  string
  netProfit?: string
  orderCount?: number
  client?:    { name: string; industry: string }
}

export default function ReportsPage() {
  const { financials, isLoading, error, refetch } = useReports();
  
  const typedFinancials = financials as FinancialItem[];

  const totalRevenue  = typedFinancials.reduce((sum, f) => sum + parseFloat(f.revenue  || '0'), 0)
  const totalExpenses = typedFinancials.reduce((sum, f) => sum + parseFloat(f.expenses || '0'), 0)
  const totalProfit   = typedFinancials.reduce((sum, f) => sum + parseFloat(f.netProfit || '0'), 0)

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mb-1">Finmark — Project Finer</p>
          <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Quarterly financial summaries per SME client</p>
        </div>
        <button
          onClick={refetch}
          className="text-xs px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">⚠ {error}</p>
        </div>
      )}

      {/* Summary cards */}
      {!isLoading && financials.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue',  value: formatPHP(totalRevenue.toString()),  color: '#10B981' },
            { label: 'Total Expenses', value: formatPHP(totalExpenses.toString()), color: '#F59E0B' },
            { label: 'Net Profit',     value: formatPHP(totalProfit.toString()),   color: '#3B82F6' },
          ].map(card => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/5 p-5"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
              <p className="text-xs text-slate-500 mt-1">{financials.length} period{financials.length !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : financials.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <span className="text-3xl">📊</span>
            <p className="text-slate-400 text-sm">No financial records found</p>
            <p className="text-slate-600 text-xs">Run db:seed or add financial records to populate this view</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Client', 'Period', 'Revenue', 'Expenses', 'Net Profit', 'Orders'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {financials.map((f, i) => {
                const profitNum   = parseFloat(f.netProfit || '0')
                const revenueNum  = parseFloat(f.revenue   || '0')
                const marginPct   = revenueNum > 0 ? ((profitNum / revenueNum) * 100).toFixed(1) : '0'
                const isProfit    = profitNum >= 0

                return (
                  <tr
                    key={f.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i === financials.length - 1 ? 'border-none' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-white">{f.client?.name || f.clientId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">{f.period}</td>
                    <td className="px-4 py-3 text-sm text-emerald-400 font-semibold">{formatPHP(f.revenue)}</td>
                    <td className="px-4 py-3 text-sm text-amber-400">{formatPHP(f.expenses)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isProfit ? 'text-blue-400' : 'text-red-400'}`}>
                          {formatPHP(f.netProfit)}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${isProfit ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                          {marginPct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{f.orderCount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
