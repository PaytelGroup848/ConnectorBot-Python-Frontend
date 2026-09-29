import { Landmark, Wallet, Building2, Share2, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export interface CashBankItem {
  _id: string
  name: string
  group: string
  ledgerType: 'CASH' | 'BANK'
  openingBalance: number
  closingBalance: number
  tallyExternalId?: string
  parent?: string
}

export interface CashBankData {
  success: boolean
  module: 'cash' | 'bank' | 'both'
  company_name: string
  company_id: string
  search_query?: string
  cash_accounts: CashBankItem[]
  bank_accounts: CashBankItem[]
  total_cash: number
  total_bank: number
  total_liquid: number
  page?: number
  limit?: number
}

interface CashBankCardProps {
  cashBankData: CashBankData
}

export const CashBankCard = ({ cashBankData }: CashBankCardProps) => {
  const module = cashBankData.module || 'both'
  const companyName = cashBankData.company_name || 'CtrlBooks'
  const totalCash = cashBankData.total_cash ?? 0
  const totalBank = cashBankData.total_bank ?? 0
  const totalLiquid = cashBankData.total_liquid ?? (totalCash + totalBank)
  const searchQuery = cashBankData.search_query
  const cashAccounts = cashBankData.cash_accounts || []
  const bankAccounts = cashBankData.bank_accounts || []

  const formatCurrency = (val: number) => {
    return Math.abs(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleShareWhatsApp = () => {
    let breakdown = ''
    if (cashAccounts.length > 0) {
      breakdown += `\n*Cash Accounts:*\n`
      cashAccounts.forEach((c) => {
        const sign = c.closingBalance >= 0 ? 'Dr' : 'Cr'
        breakdown += `• ${c.name}: ₹${formatCurrency(c.closingBalance)} (${sign})\n`
      })
    }
    if (bankAccounts.length > 0) {
      breakdown += `\n*Bank Accounts:*\n`
      bankAccounts.forEach((b) => {
        const sign = b.closingBalance >= 0 ? 'Dr' : 'OD/Cr'
        breakdown += `• ${b.name}: ₹${formatCurrency(b.closingBalance)} (${sign})\n`
      })
    }

    const text =
      `💼 *${companyName} - Cash & Bank Balance Position*\n` +
      `• Cash in Hand: ₹${formatCurrency(totalCash)} ${totalCash < 0 ? '(Cr)' : ''}\n` +
      `• Bank Accounts Total: ₹${formatCurrency(totalBank)} ${totalBank < 0 ? '(OD/Cr)' : ''}\n` +
      `• Net Liquid Funds: ₹${formatCurrency(totalLiquid)} ${totalLiquid < 0 ? '(Cr)' : ''}\n` +
      `${breakdown}` +
      `- Synchronized live from Tally Prime via CtrlBooks AI.`

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const title =
    module === 'cash'
      ? 'Cash-in-Hand Position'
      : module === 'bank'
      ? 'Bank Accounts Summary'
      : 'Cash & Bank Liquid Funds'

  return (
    <div className="bg-white rounded-2xl border border-emerald-300 p-3.5 shadow-sm space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
            {module === 'cash' ? (
              <Wallet className="w-4 h-4" />
            ) : module === 'bank' ? (
              <Building2 className="w-4 h-4" />
            ) : (
              <Landmark className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block">{title}</span>
            <span className="text-[10px] text-slate-500 font-medium">
              {companyName} {searchQuery ? `• Filter: "${searchQuery}"` : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
            Live Tally
          </span>
        </div>
      </div>

      {/* KPI Stat Tiles */}
      {module === 'both' && (
        <div className="grid grid-cols-3 gap-2">
          {/* Cash */}
          <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
            <span className="text-[9px] font-semibold text-emerald-800 uppercase block">
              Cash in Hand
            </span>
            <div className="text-xs font-bold text-emerald-950 font-mono mt-0.5">
              ₹{formatCurrency(totalCash)}
            </div>
            <span className="text-[8.5px] text-emerald-600 font-medium block">
              {totalCash >= 0 ? 'Dr (In Hand)' : 'Cr (Negative)'}
            </span>
          </div>

          {/* Bank */}
          <div
            className={`p-2 rounded-xl border ${
              totalBank < 0
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-teal-50/70 border-teal-200'
            }`}
          >
            <span
              className={`text-[9px] font-semibold uppercase block ${
                totalBank < 0 ? 'text-amber-800' : 'text-teal-800'
              }`}
            >
              Bank Total
            </span>
            <div
              className={`text-xs font-bold font-mono mt-0.5 ${
                totalBank < 0 ? 'text-amber-950' : 'text-teal-950'
              }`}
            >
              ₹{formatCurrency(totalBank)}
            </div>
            <span
              className={`text-[8.5px] font-medium block ${
                totalBank < 0 ? 'text-amber-700' : 'text-teal-600'
              }`}
            >
              {totalBank < 0 ? 'OD / CC (Cr)' : 'Dr (In Bank)'}
            </span>
          </div>

          {/* Net Liquid Funds */}
          <div className="bg-linear-to-br from-emerald-100/70 to-teal-100/70 p-2 rounded-xl border border-emerald-300">
            <span className="text-[9px] font-bold text-emerald-900 uppercase block">
              Net Liquidity
            </span>
            <div className="text-xs font-extrabold text-emerald-950 font-mono mt-0.5">
              ₹{formatCurrency(totalLiquid)}
            </div>
            <span className="text-[8.5px] text-emerald-700 font-semibold block">
              Total Available
            </span>
          </div>
        </div>
      )}

      {module === 'cash' && (
        <div className="bg-linear-to-br from-emerald-50 to-teal-50/50 p-3 rounded-xl border border-emerald-200 flex items-baseline justify-between">
          <div>
            <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Total Cash in Hand
            </span>
            <div className="text-xl font-extrabold text-emerald-900 font-mono mt-0.5">
              ₹{formatCurrency(totalCash)}
            </div>
            <span className="text-[9px] text-emerald-600 font-medium">
              {totalCash >= 0 ? 'Dr (Active Cash)' : 'Cr (Negative Ledger)'}
            </span>
          </div>
          <div className="text-[10px] text-emerald-700 font-medium text-right">
            <span>{cashAccounts.length} Cash Ledger(s)</span>
          </div>
        </div>
      )}

      {module === 'bank' && (
        <div
          className={`p-3 rounded-xl border flex items-baseline justify-between ${
            totalBank < 0
              ? 'bg-linear-to-br from-amber-50 to-orange-50/50 border-amber-200'
              : 'bg-linear-to-br from-teal-50 to-emerald-50/50 border-teal-200'
          }`}
        >
          <div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider block ${
                totalBank < 0 ? 'text-amber-800' : 'text-teal-800'
              }`}
            >
              Total Bank Balance
            </span>
            <div
              className={`text-xl font-extrabold font-mono mt-0.5 ${
                totalBank < 0 ? 'text-amber-950' : 'text-teal-950'
              }`}
            >
              ₹{formatCurrency(totalBank)}
            </div>
            <span
              className={`text-[9px] font-semibold ${
                totalBank < 0 ? 'text-amber-700' : 'text-teal-600'
              }`}
            >
              {totalBank < 0 ? '⚠️ Overdraft / CC Balance (Cr)' : '✓ In Credit (Dr)'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium text-right">
            <span>{bankAccounts.length} Bank Account(s)</span>
          </div>
        </div>
      )}

      {/* Cash Accounts Breakdown */}
      {cashAccounts.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 px-1">
            <span className="flex items-center gap-1">
              <Wallet className="w-3 h-3 text-emerald-600" />
              Cash Ledger Accounts
            </span>
            <span className="text-[9px] text-slate-400 font-normal">
              {cashAccounts.length} Account(s)
            </span>
          </div>
          <div className="divide-y divide-slate-100 rounded-xl bg-slate-50/80 border border-slate-200 px-2.5 py-1">
            {cashAccounts.map((c, i) => (
              <div key={c._id || i} className="py-1.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block leading-tight">{c.name}</span>
                  <span className="text-[9px] text-slate-500 font-medium">
                    Opening: ₹{formatCurrency(c.openingBalance)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-950 font-mono block">
                    ₹{formatCurrency(c.closingBalance)}
                  </span>
                  <span
                    className={`text-[8.5px] px-1 rounded font-semibold ${
                      c.closingBalance >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {c.closingBalance >= 0 ? 'Dr' : 'Cr'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bank Accounts Breakdown */}
      {bankAccounts.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 px-1">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-teal-600" />
              Bank Accounts Breakdown
            </span>
            <span className="text-[9px] text-slate-400 font-normal">
              {bankAccounts.length} Account(s)
            </span>
          </div>
          <div className="divide-y divide-slate-100 rounded-xl bg-slate-50/80 border border-slate-200 px-2.5 py-1">
            {bankAccounts.map((b, i) => (
              <div key={b._id || i} className="py-1.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900 block leading-tight">
                      {b.name}
                    </span>
                    {b.closingBalance < 0 && (
                      <span className="text-[8px] px-1 py-0.2 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        OD / CC
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium">
                    Opening: ₹{formatCurrency(b.openingBalance)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {b.closingBalance >= 0 ? (
                      <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3 text-amber-600" />
                    )}
                    <span
                      className={`font-bold font-mono ${
                        b.closingBalance >= 0 ? 'text-slate-900' : 'text-amber-900'
                      }`}
                    >
                      ₹{formatCurrency(b.closingBalance)}
                    </span>
                  </div>
                  <span
                    className={`text-[8.5px] px-1 rounded font-semibold ${
                      b.closingBalance >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {b.closingBalance >= 0 ? 'Dr (Deposit)' : 'Cr (Overdraft)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Action Footer */}
      <div className="pt-1 flex items-center justify-between border-t border-slate-100">
        <span className="text-[9px] text-slate-400 font-medium">
          Source: Tally Prime Live Masters
        </span>
        <button
          onClick={handleShareWhatsApp}
          className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-xl transition border border-emerald-200"
        >
          <Share2 className="w-3 h-3" />
          <span>Share via WhatsApp</span>
        </button>
      </div>
    </div>
  )
}
