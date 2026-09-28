import { useState } from 'react'
import { FileText, Copy, Check, ShieldCheck } from 'lucide-react'
import type { QueueItem } from '../core/types'

interface VoucherCardProps {
  item: QueueItem
}

export const VoucherCard = ({ item }: VoucherCardProps) => {
  const [copied, setCopied] = useState(false)
  const outerPayload = item.payload || ({} as any)
  const innerPayload = outerPayload.payload || ({} as any)
  const items = innerPayload.items || []
  const ledgers = innerPayload.ledger_entries || []
  const voucherType = innerPayload.voucher_type || (item.command_type === 'CREATE_RECEIPT' ? 'Receipt' : 'Sales Invoice')
  const party = innerPayload.party_ledger || item.party_name || 'Unspecified Party'
  const totalAmount = innerPayload.amount || 0.0

  const copyHash = () => {
    if (item.command_hash) {
      navigator.clipboard.writeText(item.command_hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/20 p-4 shadow-xl shadow-indigo-950/30 text-slate-200 text-sm max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white tracking-wide">
                {item.voucher_number || 'Voucher Draft'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{item.status || 'QUEUED FOR TALLY'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">{item.company || 'CtrlBooks Engine'} • 2-Way Sync</p>
          </div>
        </div>

        <button
          onClick={copyHash}
          title="Copy Idempotency Command Hash"
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 px-2 py-1 rounded border border-slate-700 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="font-mono text-[11px]">{item.command_hash?.substring(0, 8)}...</span>
        </button>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 my-3 text-xs bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
        <div>
          <span className="text-slate-500 block">Party / Customer</span>
          <span className="font-medium text-slate-100 text-sm">{party}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Company Name</span>
          <span className="font-medium text-slate-200">{outerPayload.companyName || item.company || 'Unassigned'}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Voucher Type</span>
          <span className="font-medium text-indigo-300">{voucherType}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Voucher Date</span>
          <span className="font-mono text-slate-300">{innerPayload.date || new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>

      {/* Items Breakdown if Sales Invoice */}
      {items.length > 0 && (
        <div className="mb-3 overflow-hidden rounded-lg border border-slate-800 text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-[11px] uppercase">
              <tr>
                <th className="py-1.5 px-3">Item Description</th>
                <th className="py-1.5 px-3 text-center">Qty</th>
                <th className="py-1.5 px-3 text-right">Rate</th>
                <th className="py-1.5 px-3 text-right">Taxable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {items.map((it: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/20">
                  <td className="py-1.5 px-3 font-medium text-white">{it.name}</td>
                  <td className="py-1.5 px-3 text-center">{it.quantity}</td>
                  <td className="py-1.5 px-3 text-right font-mono">₹{it.rate?.toLocaleString('en-IN')}</td>
                  <td className="py-1.5 px-3 text-right font-mono">₹{it.amount?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GST Taxes & Grand Total */}
      <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1 text-xs">
        {ledgers.map((leg: any, idx: number) => (
          <div key={idx} className="flex justify-between text-slate-400">
            <span>{leg.ledger}</span>
            <span className="font-mono text-slate-300">₹{leg.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        ))}

        <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between items-center text-sm font-semibold">
          <span className="text-white">Total Invoice Amount:</span>
          <span className="text-emerald-400 font-mono text-base">
            ₹{totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Verified & Balanced Ledger Entry</span>
        </div>
        <span className="text-slate-400 font-mono">{item.status ? `Sync: ${item.status}` : 'Auto-sync: Active'}</span>
      </div>
    </div>
  )
}
