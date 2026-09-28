import { X, Send, Download, FileText } from 'lucide-react'
import type { DashboardMetrics } from '../core/types'

interface ReceivablesDrawerProps {
  isOpen: boolean
  onClose: () => void
  metrics: DashboardMetrics | null
}

export const ReceivablesDrawer = ({ isOpen, onClose, metrics }: ReceivablesDrawerProps) => {
  if (!isOpen) return null

  const invoices = metrics?.receivables?.invoices || []
  const total = metrics?.receivables?.total || 0

  const handleSendReminder = (inv: any) => {
    const text = `Namaste ${inv.party}, aapka payment for Invoice #${inv.number} (Amount: ₹${inv.amount.toLocaleString('en-IN')}) due hai on ${inv.due_date}. Please clear at earliest.`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Outstanding Receivables</h3>
            <p className="text-xs text-slate-400 mt-0.5">{invoices.length} invoices pending payment</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Summary */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Total Pending Amount</span>
          <span className="text-xl font-bold text-amber-600 font-mono">
            ₹{total.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Invoice List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {invoices.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No pending receivables found for this company.
            </div>
          )}

          {invoices.length > 0 &&
            invoices.map((inv, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900">{inv.number}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    ₹{inv.amount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{inv.party}</span>
                  <span className="text-[11px] text-slate-400">Due: {inv.due_date}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleSendReminder(inv)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Reminder</span>
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex items-center space-x-3">
          <button
            onClick={() => alert('Downloading Excel / PDF Receivables Report from Tally...')}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
