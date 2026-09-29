import { UserCheck, Users, Phone, MapPin, Calendar, Share2, Building } from 'lucide-react'

export interface PartyItem {
  _id: string
  name: string
  partyName: string
  closingBalance: number
  openingBalance?: number
  gstin?: string
  phone?: string
  email?: string
  address?: string
  creditLimit?: number
  creditDays?: number
  lastSoldDate?: string
  tallyExternalId?: string
}

export interface PartyData {
  success: boolean
  company_name: string
  company_id: string
  search_query?: string
  total: number
  page?: number
  limit?: number
  total_debit: number
  total_credit: number
  net_balance: number
  items: PartyItem[]
}

interface PartyCardProps {
  partyData: PartyData
}

export const PartyCard = ({ partyData }: PartyCardProps) => {
  const companyName = partyData.company_name || 'CtrlBooks'
  const items = partyData.items || []
  const total = partyData.total ?? items.length
  const totalDebit = partyData.total_debit ?? 0
  const totalCredit = partyData.total_credit ?? 0
  const searchQuery = partyData.search_query

  const formatCurrency = (val: number) => {
    return Math.abs(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return ''
    try {
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return isoStr.split('T')[0] || isoStr
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return isoStr.split('T')[0] || isoStr
    }
  }

  // Handle single party WhatsApp share
  const handleShareSingleParty = (party: PartyItem) => {
    const isDr = party.closingBalance > 0
    const sign = isDr ? 'Dr (Receivable / Lena hai)' : 'Cr (Payable / Dena hai)'
    const balFormatted = formatCurrency(party.closingBalance)
    const lastDate = formatDate(party.lastSoldDate)

    const text =
      `💼 *${companyName} - Party Balance Confirmation*\n` +
      `• Party Name: *${party.partyName}*\n` +
      `• Closing Balance: *₹${balFormatted}* (${sign})\n` +
      (party.gstin ? `• GSTIN: ${party.gstin}\n` : '') +
      (party.phone ? `• Phone: ${party.phone}\n` : '') +
      (lastDate ? `• Last Transaction Date: ${lastDate}\n` : '') +
      `- Synchronized live from Tally Prime via CtrlBooks AI.`

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Handle multiple parties roster WhatsApp share
  const handleShareRoster = () => {
    let topList = ''
    items.slice(0, 5).forEach((p) => {
      const sign = p.closingBalance >= 0 ? 'Dr' : 'Cr'
      topList += `• ${p.partyName}: ₹${formatCurrency(p.closingBalance)} (${sign})\n`
    })

    const text =
      `👥 *${companyName} - Parties & Outstandings Summary*\n` +
      `• Total Parties: ${total}\n` +
      `• Total Receivables (Dr): ₹${formatCurrency(totalDebit)}\n` +
      `• Total Payables/Advance (Cr): ₹${formatCurrency(totalCredit)}\n\n` +
      `*Key Parties:*\n${topList}` +
      `- Synchronized live from Tally Prime via CtrlBooks AI.`

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const isSingleParty = items.length === 1 && searchQuery

  // Single Party View
  if (isSingleParty) {
    const party = items[0]
    const isDr = party.closingBalance > 0
    const isCr = party.closingBalance < 0

    return (
      <div className="bg-white rounded-2xl border border-emerald-300 p-3.5 shadow-sm space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block leading-tight">
                {party.partyName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {companyName} • Party Ledger Profile
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
              Tally Live
            </span>
          </div>
        </div>

        {/* Big Balance Box */}
        <div
          className={`p-3 rounded-xl border flex items-baseline justify-between ${
            isDr
              ? 'bg-linear-to-br from-emerald-50 to-teal-50/50 border-emerald-200'
              : isCr
              ? 'bg-linear-to-br from-amber-50 to-orange-50/50 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <span
              className={`text-[9.5px] font-semibold uppercase tracking-wider block ${
                isDr ? 'text-emerald-800' : isCr ? 'text-amber-800' : 'text-slate-600'
              }`}
            >
              Current Ledger Balance
            </span>
            <div
              className={`text-xl font-extrabold font-mono mt-0.5 ${
                isDr ? 'text-emerald-950' : isCr ? 'text-amber-950' : 'text-slate-800'
              }`}
            >
              ₹{formatCurrency(party.closingBalance)}
            </div>
            <span
              className={`text-[9px] font-bold ${
                isDr ? 'text-emerald-700' : isCr ? 'text-amber-700' : 'text-slate-500'
              }`}
            >
              {isDr
                ? '✓ Debit — Outstanding to Receive (Lena hai)'
                : isCr
                ? '⚠️ Credit — Payable / Advance Balance (Dena hai)'
                : 'Settled (Zero Balance)'}
            </span>
          </div>
          {party.lastSoldDate && (
            <div className="text-[9.5px] text-slate-500 font-medium text-right flex flex-col items-end">
              <span className="text-slate-400">Last Transaction</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {formatDate(party.lastSoldDate)}
              </span>
            </div>
          )}
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* GSTIN */}
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-[9px] text-slate-400 uppercase font-semibold block">GSTIN</span>
            <span className="font-mono font-bold text-slate-800 text-[11px]">
              {party.gstin || 'Unregistered / Not Provided'}
            </span>
          </div>

          {/* Contact Phone */}
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-[9px] text-slate-400 uppercase font-semibold block">Phone</span>
            <span className="text-slate-700 text-[11px] font-medium flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {party.phone || 'N/A'}
            </span>
          </div>
        </div>

        {/* Address */}
        {party.address && (
          <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-200 text-[10px] text-slate-600 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{party.address}</span>
          </div>
        )}

        {/* WhatsApp Action Footer */}
        <div className="pt-1 flex items-center justify-between border-t border-slate-100">
          <span className="text-[9px] text-slate-400 font-medium">
            Tally Master ID: #{party.tallyExternalId ? party.tallyExternalId.slice(-8) : party._id.slice(-6)}
          </span>
          <button
            onClick={() => handleShareSingleParty(party)}
            className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-xl transition border border-emerald-200 shadow-2xs"
          >
            <Share2 className="w-3 h-3" />
            <span>Share Ledger Confirmation</span>
          </button>
        </div>
      </div>
    )
  }

  // Multiple Parties / Roster View
  return (
    <div className="bg-white rounded-2xl border border-emerald-300 p-3.5 shadow-sm space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block">
              Parties & Debtors Directory
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {companyName} {searchQuery ? `• Filter: "${searchQuery}"` : ''}
            </span>
          </div>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
          {total} Parties
        </span>
      </div>

      {/* Aggregate KPI Tiles */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
          <span className="text-[9px] font-semibold text-emerald-800 uppercase block">
            Total Outstanding (Dr)
          </span>
          <div className="text-sm font-extrabold text-emerald-950 font-mono mt-0.5">
            ₹{formatCurrency(totalDebit)}
          </div>
          <span className="text-[8.5px] text-emerald-600 font-medium block">
            Receivable from Debtors
          </span>
        </div>

        <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
          <span className="text-[9px] font-semibold text-amber-800 uppercase block">
            Total Payables (Cr)
          </span>
          <div className="text-sm font-extrabold text-amber-950 font-mono mt-0.5">
            ₹{formatCurrency(totalCredit)}
          </div>
          <span className="text-[8.5px] text-amber-600 font-medium block">
            Creditor / Advance Balances
          </span>
        </div>
      </div>

      {/* Party List Breakdown */}
      {items.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 px-1">
            <span className="flex items-center gap-1">
              <Building className="w-3 h-3 text-teal-600" />
              Party Ledgers List
            </span>
            <span className="text-[9px] text-slate-400 font-normal">
              Showing {items.length} of {total}
            </span>
          </div>
          <div className="divide-y divide-slate-100 rounded-xl bg-slate-50/80 border border-slate-200 px-2.5 py-1 max-h-56 overflow-y-auto">
            {items.map((p, i) => {
              const isDr = p.closingBalance > 0
              const isCr = p.closingBalance < 0

              return (
                <div key={p._id || i} className="py-2 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-slate-900 block truncate leading-tight">
                      {p.partyName}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium block truncate">
                      {p.gstin ? `GST: ${p.gstin}` : 'Non-GST'}
                      {p.lastSoldDate ? ` • ${formatDate(p.lastSoldDate)}` : ''}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 font-mono block">
                      ₹{formatCurrency(p.closingBalance)}
                    </span>
                    <span
                      className={`text-[8.5px] px-1 rounded font-semibold ${
                        isDr
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCr
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isDr ? 'Dr (Lena)' : isCr ? 'Cr (Dena)' : 'Settled'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* WhatsApp Action Footer */}
      <div className="pt-1 flex items-center justify-between border-t border-slate-100">
        <span className="text-[9px] text-slate-400 font-medium">
          Source: Tally Masters live ledger sync
        </span>
        <button
          onClick={handleShareRoster}
          className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-xl transition border border-emerald-200 shadow-2xs"
        >
          <Share2 className="w-3 h-3" />
          <span>Share Parties Summary</span>
        </button>
      </div>
    </div>
  )
}
