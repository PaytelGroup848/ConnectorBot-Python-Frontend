import { ArrowUpRight, TrendingUp, ChevronRight, Sparkles, FileText } from 'lucide-react'
import type { DashboardMetrics } from '../core/types'

interface DashboardViewProps {
  metrics: DashboardMetrics | null
  onOpenAssistant: (initialPrompt?: string) => void
  onOpenReceivables: () => void
  companyName?: string
  userName?: string
}

export const DashboardView = ({
  metrics,
  onOpenAssistant,
  onOpenReceivables,
  companyName,
  userName,
}: DashboardViewProps) => {
  const chips = [
    'Pending invoices',
    'GST return status',
    'TDS details',
    'Business reports',
    'Create invoice',
    'Payment follow-up',
  ]

  const displayName = userName || (companyName ? companyName.split(' ')[0] : 'Admin')
  const currentMonthYear = metrics?.sales?.period || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const salesTotal = metrics?.sales?.total ?? 0
  const salesChange = metrics?.sales?.change_pct !== undefined ? `${metrics.sales.change_pct > 0 ? '+' : ''}${metrics.sales.change_pct}%` : '+0%'
  const receivablesTotal = metrics?.receivables?.total ?? 0
  const receivablesCount = metrics?.receivables?.count ?? (metrics?.receivables?.invoices?.length || 0)
  const payablesTotal = metrics?.payables?.total ?? 0
  const payablesCount = metrics?.payables?.count ?? 0
  const gstDue = metrics?.gst_due?.total ?? 0
  const gstr1Status = metrics?.gst_due?.gstr1_status ? `GSTR-1 ${metrics.gst_due.gstr1_status}` : 'GSTR-1 Ready'
  const gstr3bStatus = metrics?.gst_due?.gstr3b_status ? `GSTR-3B: ${metrics.gst_due.gstr3b_status}` : 'Tax Summary'
  const payablesStatus = payablesCount > 0 ? `${payablesCount} Due` : 'All Clear'

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>Good morning, {displayName}</span>
          <span className="text-xl">👋</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's a quick snapshot for <strong className="text-slate-700">{companyName || 'your business'}</strong> synced with Tally Prime
        </p>
      </div>

      {/* 4 Financial KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Total Sales</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>{salesChange}</span>
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ₹{salesTotal.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            <span>vs last month</span>
            {/* Mini SVG Sparkline */}
            <svg className="w-16 h-5 text-emerald-500 overflow-visible" viewBox="0 0 60 20">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points="0,15 12,12 24,14 36,8 48,10 60,3"
              />
            </svg>
          </div>
        </div>

        {/* KPI 2: Outstanding Receivables */}
        <div
          onClick={onOpenReceivables}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition cursor-pointer group hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Outstanding Receivables</span>
            <span className="text-slate-400 group-hover:text-emerald-600 transition">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono tracking-tight">
            ₹{receivablesTotal.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">{receivablesCount} invoices</span>
            <span className="text-emerald-600 font-medium">Click to view details</span>
          </div>
        </div>

        {/* KPI 3: Payables */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Payables</span>
            <span className="text-slate-500 font-medium text-[11px]">{payablesStatus}</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono tracking-tight">
            ₹{payablesTotal.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span>{payablesCount} pending bills</span>
            <span className="text-slate-400 font-mono">{currentMonthYear}</span>
          </div>
        </div>

        {/* KPI 4: GST Due */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>GST Due</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
              {gstr1Status}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ₹{gstDue.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span>{gstr3bStatus}</span>
            <span className="text-slate-400 font-mono">{currentMonthYear}</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Quick Questions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: You can ask me about */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">You can ask me about</h3>

            <div className="flex flex-wrap gap-2.5">
              {chips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenAssistant(`Mujhe ${chip} ke baare me batao`)}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-medium border border-slate-200 hover:border-emerald-300 transition shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Quick Prompt Card */}
            <div
              onClick={() => onOpenAssistant('How many invoices are pending?')}
              className="mt-4 p-4 rounded-xl bg-linear-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/60 flex items-center justify-between cursor-pointer hover:border-emerald-400 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-emerald-800 font-semibold block">Quick Question</span>
                  <span className="text-sm text-slate-800 font-medium">How many invoices are pending?</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          {/* Need Deeper Insights Banner */}
          <div className="bg-linear-to-br from-slate-900 to-emerald-950 rounded-2xl p-6 text-white flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">CtrlBooks Assistant</span>
              <h3 className="text-lg font-bold">Need deeper accounting insights?</h3>
              <p className="text-xs text-slate-300 max-w-md">
                Ask CtrlBooks AI for automatic voucher generation, GST reconciliation, and vendor ledgers.
              </p>
            </div>
            <button
              onClick={() => onOpenAssistant()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition shrink-0"
            >
              CTRLBooks AI Assistant
            </button>
          </div>
        </div>

        {/* Right 1 Col: Recent Activity matching Figma */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <span className="text-xs text-slate-400">Live feed</span>
          </div>

          <div className="space-y-4 text-xs divide-y divide-slate-100">
            {metrics?.recent_activity && metrics.recent_activity.length > 0 ? (
              metrics.recent_activity.map((act) => (
                <div key={act.id} className="pt-3 first:pt-0 flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{act.title}</span>
                      <span className="text-[10px] text-slate-400">{act.time}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{act.subtitle}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
