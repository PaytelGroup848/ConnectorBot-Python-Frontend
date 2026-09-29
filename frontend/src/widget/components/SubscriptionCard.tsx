import { CreditCard, ShieldCheck, Calendar, Users, CheckCircle2, Sparkles, Share2 } from 'lucide-react'

export interface SubscriptionData {
  success: boolean
  id?: string
  status: string
  is_active: boolean
  plan_name: string
  plan_id?: string
  features?: string[]
  seat_limit: number
  extra_seats: number
  total_seats: number
  from_date?: string
  to_date?: string
  days_remaining?: number
}

interface SubscriptionCardProps {
  subData: SubscriptionData
}

export const SubscriptionCard = ({ subData }: SubscriptionCardProps) => {
  const planName = subData.plan_name || 'Pro'
  const status = subData.status || 'ACTIVE'
  const isActive = subData.is_active ?? true
  const totalSeats = subData.total_seats || 17
  const baseSeats = subData.seat_limit || 2
  const extraSeats = subData.extra_seats || 15
  const daysRemaining = subData.days_remaining ?? 365
  const features = subData.features || [
    'COMPANY_READ',
    'LEDGER_READ',
    'CUSTOMER_READ',
    'VOUCHER_READ',
    'REPORTS_READ',
    'CONNECTOR_STATUS',
    'SYNC_LEDGER',
    'SYNC_VOUCHER',
  ]

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Active'
    try {
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return isoStr.split('T')[0] || isoStr
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return isoStr.split('T')[0] || isoStr
    }
  }

  const validTillStr = formatDate(subData.to_date)

  const featureLabels: Record<string, string> = {
    COMPANY_READ: 'Company Profiles & Masters',
    LEDGER_READ: 'Full Ledgers & Accounts Directory',
    CUSTOMER_READ: 'Sundry Debtors & Receivables',
    SUPPLIER_READ: 'Sundry Creditors & Payables',
    STOCK_READ: 'Inventory & Stock Valuation',
    VOUCHER_READ: 'Complete Day Book & Voucher Lines',
    REPORTS_READ: 'Trial Balance & Financial Reports',
    CONNECTOR_STATUS: 'Real-time Tally Prime Telemetry',
    COMMAND_CREATE: '2-Way Tally Voucher Automation',
    SYNC_LEDGER: 'Auto-Master Creation in Tally',
    SYNC_VOUCHER: 'Direct Voucher Import to Tally',
    SYNC_STOCK: 'Real-Time Inventory Sync',
    SYNC_MASTER: 'Live Master Synchronization',
  }

  const handleShareSubscription = () => {
    const text =
      `💳 *CtrlBooks AI — Subscription Confirmation*\n` +
      `• Active Plan: *${planName} Plan* (${status})\n` +
      `• Validity: *Valid till ${validTillStr}* (${daysRemaining} days remaining)\n` +
      `• Seats Allocation: *${totalSeats} Total Seats* (${baseSeats} Base + ${extraSeats} Add-on)\n` +
      `• Live Tally 2-Way Sync & AI Accounting: *Active*\n` +
      `- Managed via CtrlBooks AI SaaS Cloud.`

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="w-full my-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden font-sans transition-all duration-300">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight text-white">{planName} Plan</h3>
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full text-white">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" /> Enterprise Tier
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">CtrlBooks AI SaaS Active Subscription</p>
            </div>
          </div>

          <div className="flex items-center">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/30 text-white border border-emerald-300/40 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-400/30 text-white border border-rose-300/40 shadow-sm">
                EXPIRED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Metric 1: Validity & Days Remaining */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Plan Validity</span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
              {validTillStr}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                {daysRemaining} Days Left
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: User Seats Allocation */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Team Access</span>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              {totalSeats} Seats
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {baseSeats} Base + {extraSeats} Add-on Seats
            </p>
          </div>
        </div>
      </div>

      {/* Enabled Feature Badges */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Included SaaS Capabilities ({features.length})
          </span>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">All Unlocked</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {features.slice(0, 8).map((feat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 py-0.5 truncate"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{featureLabels[feat] || feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <CreditCard className="w-3.5 h-3.5 text-purple-500" />
          Auto-Renews via CtrlBooks Cloud
        </div>
        <button
          onClick={handleShareSubscription}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Plan Details
        </button>
      </div>
    </div>
  )
}
