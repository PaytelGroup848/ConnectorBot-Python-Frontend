import { BookOpen, Share2 } from 'lucide-react'

interface AccountingReportCardProps {
  reportData: any
}

export const AccountingReportCard = ({ reportData }: AccountingReportCardProps) => {
  const reportType = reportData.report_type || 'day-book'
  const reportTitle = reportData.report_title || 'Executive Accounting Report'
  const companyName = reportData.company_name || 'CtrlBooks'
  const periodLabel = reportData.period_label || companyName || 'Today'
  const totalCount = reportData.total_count ?? 0
  const rows = reportData.rows || []

  const handleShareReportWhatsApp = () => {
    let details = ''
    if (reportType === 'day-book') {
      details = `\n• Total Credit (In): ₹${reportData.total_credit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Total Debit (Out): ₹${reportData.total_debit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Net Flow: ₹${reportData.net_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    } else if (reportType === 'trial-balance') {
      details = `\n• Total Debit: ₹${reportData.total_debit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Total Credit: ₹${reportData.total_credit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    } else if (reportType === 'pnl') {
      details = `\n• Revenue: ₹${reportData.total_income?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Expenses: ₹${reportData.total_expense?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Net Profit: ₹${reportData.net_profit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    } else if (reportType === 'balance-sheet') {
      details = `\n• Assets: ₹${reportData.total_assets?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Liabilities: ₹${reportData.total_liabilities?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    }
    const text = `📊 *${companyName} - ${reportTitle} (${periodLabel})*\n• Total Entries: ${totalCount}${details}\n- Generated via CtrlBooks AI.`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="bg-white rounded-2xl border border-emerald-300 p-3.5 shadow-sm space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block">
              {reportTitle}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {periodLabel}
            </span>
          </div>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
          {totalCount} {reportType === 'day-book' ? 'Entries' : 'Records'}
        </span>
      </div>

      {/* Metric Tiles based on report_type */}
      {reportType === 'day-book' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
            <span className="text-[9.5px] font-semibold text-emerald-800 uppercase block">Total Credit (In)</span>
            <div className="text-sm font-extrabold text-emerald-900 font-mono mt-0.5">
              ₹{reportData.total_credit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200">
            <span className="text-[9.5px] font-semibold text-rose-800 uppercase block">Total Debit (Out)</span>
            <div className="text-sm font-extrabold text-rose-900 font-mono mt-0.5">
              ₹{reportData.total_debit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {reportType === 'trial-balance' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[9.5px] font-semibold text-slate-600 uppercase block">Total Debit</span>
            <div className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">
              ₹{reportData.total_debit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[9.5px] font-semibold text-slate-600 uppercase block">Total Credit</span>
            <div className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">
              ₹{reportData.total_credit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {reportType === 'pnl' && (
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
            <span className="text-[9px] font-semibold text-emerald-800 block">Revenue</span>
            <div className="text-xs font-bold text-emerald-900 font-mono mt-0.5">
              ₹{reportData.total_income?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-100">
            <span className="text-[9px] font-semibold text-amber-800 block">Expenses</span>
            <div className="text-xs font-bold text-amber-900 font-mono mt-0.5">
              ₹{reportData.total_expense?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className={`p-2 rounded-xl border ${reportData.is_profit ? 'bg-teal-50/80 border-teal-200' : 'bg-rose-50/80 border-rose-200'}`}>
            <span className={`text-[9px] font-semibold block ${reportData.is_profit ? 'text-teal-800' : 'text-rose-800'}`}>
              {reportData.is_profit ? 'Net Profit' : 'Net Loss'}
            </span>
            <div className={`text-xs font-bold font-mono mt-0.5 ${reportData.is_profit ? 'text-teal-900' : 'text-rose-900'}`}>
              ₹{Math.abs(reportData.net_profit || 0)?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {reportType === 'balance-sheet' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200">
            <span className="text-[9.5px] font-semibold text-blue-800 uppercase block">Total Assets</span>
            <div className="text-sm font-extrabold text-blue-900 font-mono mt-0.5">
              ₹{reportData.total_assets?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200">
            <span className="text-[9.5px] font-semibold text-purple-800 uppercase block">Total Liabilities</span>
            <div className="text-sm font-extrabold text-purple-900 font-mono mt-0.5">
              ₹{reportData.total_liabilities?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {reportType === 'voucher-lines' && (
        <div className="bg-linear-to-br from-teal-50 to-emerald-50/50 p-2.5 rounded-xl border border-teal-100 flex items-baseline justify-between">
          <div>
            <span className="text-[10px] font-semibold text-teal-800 uppercase tracking-wider block">
              Voucher #{reportData.voucher_id} Total
            </span>
            <div className="text-base font-extrabold text-teal-900 font-mono mt-0.5">
              ₹{reportData.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-[10px] text-teal-700 font-medium text-right">
            <span>{totalCount} items</span>
          </div>
        </div>
      )}

      {/* Breakdown List of Rows (Top 4 rows) */}
      {rows.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-0.5">
            {reportType === 'day-book' ? 'Day Book Transactions' : reportType === 'voucher-lines' ? 'Itemized Lines' : 'Ledger Balances'} ({rows.length})
          </span>
          <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-1">
            {rows.slice(0, 4).map((row: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-1.5 px-2 text-[11px]">
                <div>
                  <span className="font-semibold text-slate-800 block leading-tight">
                    {row.party_ledger || row.ledger_name || row.particulars || row.item_name || 'Entry'}
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-mono">
                    {row.voucher_type ? `${row.voucher_type} #${row.voucher_number || ''}` : row.group || row.ledger_type || (row.unit ? `${row.quantity} ${row.unit} @ ₹${row.rate}` : '')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 font-mono block">
                    ₹{(row.amount || row.debit || row.credit || row.closing_balance || 0)?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  {row.debit > 0 && <span className="text-[9px] text-rose-600 font-bold">Dr</span>}
                  {row.credit > 0 && <span className="text-[9px] text-emerald-600 font-bold">Cr</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Share Button */}
      <div className="pt-1 flex items-center space-x-2">
        <button
          type="button"
          onClick={handleShareReportWhatsApp}
          className="flex-1 py-1.5 px-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold flex items-center justify-center space-x-1 shadow-2xs transition cursor-pointer"
        >
          <Share2 className="w-3 h-3" />
          <span>WhatsApp Report</span>
        </button>
      </div>
    </div>
  )
}
