import { useState } from 'react'
import type { FormEvent } from 'react'
import { Layers, Plus, RefreshCw, FileCheck } from 'lucide-react'
import type { QueueItem } from '../core/types'
import { VoucherCard } from './VoucherCard'
import { api } from '../core/api'

interface QueueViewProps {
  queueItems: QueueItem[]
  onRefresh: () => void
  isRefreshing: boolean
  selectedCompany?: string
}

export const QueueView = ({
  queueItems,
  onRefresh,
  isRefreshing,
  selectedCompany = '',
}: QueueViewProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [partyLedger, setPartyLedger] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalValue = queueItems.reduce((acc, it) => acc + (it.payload?.payload?.amount || 0), 0)

  const handleManualCreate = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.createSalesVoucher({
        company_name: selectedCompany || undefined,
        party_ledger: partyLedger,
        date: date,
        total_amount: parseFloat(amount) || 0,
        narration: `Manual sales invoice for ${selectedCompany || 'ledger'} created via CtrlBooks UI`,
      })
      setShowCreateModal(false)
      onRefresh()
    } catch (err) {
      console.error('Failed to create manual voucher', err)
      alert('Error creating voucher')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top Banner & Summary Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            <span>Invoices & CtrlBooks 2-Way Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Asynchronous command queue syncing sales invoices and ledgers to Tally Prime XML Connector
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 block">Total Queued Commands</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{queueItems.length}</span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              Ready to sync
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 block">Total Queue Value</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 block">Target Engine</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-lg font-bold text-slate-800">Tally XML Connector</span>
            <span className="text-xs text-slate-400">• Idempotent</span>
          </div>
        </div>
      </div>

      {/* Queue Items List */}
      {queueItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Queue is currently clear</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            All vouchers have synced to Tally Prime. Create a new invoice via the AI Assistant or click below.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
          >
            Create Test Invoice
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queueItems.map((item, index) => (
            <VoucherCard key={item.command_hash || index} item={item} />
          ))}
        </div>
      )}

      {/* Manual Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Queue Sales Invoice</h3>
            <p className="text-xs text-slate-500 mb-4">Directly enqueue a sales invoice to the active Tally Prime XML port.</p>

            <form onSubmit={handleManualCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Party / Customer Ledger</label>
                <input
                  type="text"
                  value={partyLedger}
                  onChange={(e) => setPartyLedger(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Taxable Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  9% CGST and 9% SGST will be added automatically (+18%).
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Voucher Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Queueing...' : 'Add to Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
