'use client'
import { sileo } from 'sileo'
import { TrendingUp } from 'lucide-react'
import { useReports } from '@/hooks/useReports'
import { formatPHP } from '@/lib/format'
import { ReportsSkeleton } from '@/components/dashboard/ReportsSkeleton'

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

const SUMMARY_ACCENTS = ['#10B981', '#F59E0B', '#3B82F6']
const SUMMARY_TRENDS  = [+14.2, +9.8, +18.6]

function marginBadgeClass(margin: number) {
  if (margin >= 30) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (margin >= 10) return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-red-500/10 text-red-400 border-red-500/20'
}

export default function ReportsPage() {
  const { financials, isLoading, error, refetch } = useReports()

  if (isLoading && financials.length === 0) return <ReportsSkeleton />

  const typedFinancials = financials as FinancialItem[]

  const totalRevenue  = typedFinancials.reduce((sum, f) => sum + parseFloat(f.revenue  || '0'), 0)
  const totalExpenses = typedFinancials.reduce((sum, f) => sum + parseFloat(f.expenses || '0'), 0)
  const totalProfit   = typedFinancials.reduce((sum, f) => sum + parseFloat(f.netProfit || '0'), 0)

  const summaryCards = [
    { label: 'Total Revenue',  value: formatPHP(totalRevenue.toString()) },
    { label: 'Total Expenses', value: formatPHP(totalExpenses.toString()) },
    { label: 'Net Profit',     value: formatPHP(totalProfit.toString()) },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Quarterly financial summaries per SME client</p>
        </div>
        <button
          onClick={() => { refetch(); sileo.success({ title: 'Reports refreshed' }) }}
          className="text-xs px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:bg-white/[0.07] hover:text-white transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">⚠ {error}</p>
        </div>
      )}

      {!isLoading && financials.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summaryCards.map((card, i) => (
            <div
              key={card.label}
              className="relative rounded-2xl border border-white/[0.06] p-5 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.025)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-slate-500 font-semibold tracking-[0.08em] uppercase">{card.label}</p>
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  {SUMMARY_TRENDS[i]}%
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40"
                style={{ background: `linear-gradient(90deg, ${SUMMARY_ACCENTS[i]}, transparent 80%)` }}
              />
            </div>
          ))}
        </div>
      )}

      <div
        className="rounded-2xl border border-white/[0.06] overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.025)' }}
      >
        {isLoading ? (
          <div className="p-16 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : financials.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <p className="text-slate-400 text-sm">No financial records found</p>
            <p className="text-slate-600 text-xs">Run db:seed or add financial records to populate this view</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Client', 'Period', 'Revenue', 'Expenses', 'Net Profit', 'Margin %', 'Orders'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {typedFinancials.map((f, i) => {
                  const profitNum  = parseFloat(f.netProfit || '0')
                  const revenueNum = parseFloat(f.revenue   || '0')
                  const marginPct  = revenueNum > 0 ? (profitNum / revenueNum) * 100 : 0
                  const isProfit   = profitNum >= 0

                  return (
                    <tr
                      key={f.id}
                      className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === typedFinancials.length - 1 ? 'border-none' : ''}`}
                    >
                      <td className="px-5 py-4 text-sm font-medium text-white">{f.client?.name || f.clientId?.slice(0, 8)}</td>
                      <td className="px-5 py-4 text-sm text-slate-400 font-mono">{f.period}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-emerald-400">{formatPHP(f.revenue || '0')}</td>
                      <td className="px-5 py-4 text-sm text-amber-400">{formatPHP(f.expenses || '0')}</td>
                      <td className={`px-5 py-4 text-sm font-semibold ${isProfit ? 'text-blue-400' : 'text-red-400'}`}>
                        {formatPHP(f.netProfit || '0')}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${marginBadgeClass(marginPct)}`}>
                          {marginPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">{f.orderCount}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
