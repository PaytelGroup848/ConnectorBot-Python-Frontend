import { TrendingUp, Share2 } from 'lucide-react'

interface SalesSummaryCardProps {
  analyticsData: any
}

export const SalesSummaryCard = ({ analyticsData }: SalesSummaryCardProps) => {
  const moduleLabel = analyticsData.module_label || 'Sales'
  const periodLabel = analyticsData.period_label || 'Today'
  const totalAmount = analyticsData.total_amount ?? 0
  const totalCount = analyticsData.total_count ?? 0
  const companyName = analyticsData.company_name || 'CtrlBooks'
  const items = analyticsData.items || []

  const handleShareWhatsApp = () => {
    const tot = totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    const text = `📊 *${companyName} - ${periodLabel} ${moduleLabel} Report*\n• Total Amount: ₹${tot}\n• Total Entries: ${totalCount}\n- Generated via CtrlBooks AI.`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="bg-white rounded-2xl border border-emerald-300 p-3.5 shadow-sm space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block">
              {moduleLabel} Report
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {periodLabel}
            </span>
          </div>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
          {totalCount} {moduleLabel}
        </span>
      </div>

      {/* Big Stat Box */}
      <div className="bg-linear-to-br from-emerald-50 to-teal-50/50 p-3 rounded-xl border border-emerald-100 flex items-baseline justify-between">
        <div>
          <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
            Total {moduleLabel} Value
          </span>
          <div className="text-xl font-extrabold text-emerald-900 font-mono mt-0.5">
            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="text-[10px] text-emerald-700 font-medium text-right">
          <span>{companyName}</span>
        </div>
      </div>

      {/* Top Transactions List */}
      {items.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-0.5">
            Transactions ({items.length})
          </span>
          <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-1">
            {items.slice(0, 4).map((itm: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-1.5 px-2 text-[11px]">
                <div>
                  <span className="font-semibold text-slate-800 block leading-tight">
                    {itm.party_ledger}
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-mono">
                    #{itm.voucher_number} • {itm.date}
                  </span>
                </div>
                <span className="font-bold text-slate-900 font-mono">
                  ₹{(itm.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Share Button */}
      <div className="pt-1 flex items-center space-x-2">
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center justify-center space-x-1 shadow-2xs transition cursor-pointer"
        >
          <Share2 className="w-3 h-3" />
          <span>WhatsApp Summary</span>
        </button>
      </div>
    </div>
  )
}
