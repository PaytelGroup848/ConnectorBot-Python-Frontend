import { FileText, CheckCircle2, Share2 } from 'lucide-react'
import type { QueueItem } from '../../core/types'

interface InvoiceCardProps {
  voucherData: QueueItem
  onWhatsAppShare: (voucher: QueueItem) => void
}

export const InvoiceCard = ({ voucherData, onWhatsAppShare }: InvoiceCardProps) => {
  const payload = voucherData.payload?.payload
  const partyLedger = payload?.party_ledger || 'Customer'
  const amount = payload?.amount ?? 0
  const voucherNumber = voucherData.voucher_number || 'N/A'
  const statusLabel = voucherData.status ? voucherData.status.replace(/_/g, ' ') : 'QUEUED'

  return (
    <div className="bg-white rounded-2xl border border-emerald-300 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>Invoice {voucherNumber}</span>
        </span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
          {statusLabel}
        </span>
      </div>

      <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-400">Party</span>
          <span className="font-semibold text-slate-800">{partyLedger}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Total (incl. GST)</span>
          <span className="font-bold text-emerald-700 font-mono">
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* 4-Step Stepper */}
      <div className="text-[10px]">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-emerald-700 font-semibold flex items-center space-x-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>AI Created</span>
          </span>
          <span>➔</span>
          <span className="text-emerald-700 font-semibold flex items-center space-x-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>GST Balanced</span>
          </span>
          <span>➔</span>
          <span className="text-emerald-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping mr-1"></span>
            <span>Queued</span>
          </span>
          <span>➔</span>
          <span>Tally Synced</span>
        </div>
      </div>

      {/* WhatsApp Share Button */}
      <div className="pt-1 flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onWhatsAppShare(voucherData)}
          className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center justify-center space-x-1 shadow-xs transition cursor-pointer"
        >
          <Share2 className="w-3 h-3" />
          <span>WhatsApp Invoice</span>
        </button>
      </div>
    </div>
  )
}
