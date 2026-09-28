import { Search, Bell, Building2, ChevronDown, AlertTriangle, Minimize2, RefreshCw, LogOut } from 'lucide-react'
import type { TallyStatus, TallyCompany } from '../core/types'

interface HeaderProps {
  tallyStatus: TallyStatus | null
  companies: TallyCompany[]
  selectedCompany: string
  onSelectCompany: (company: string) => void
  onToggleWidgetMode: () => void
  onRefresh: () => void
  isRefreshing: boolean
  userName?: string
  userRole?: string
  onLogout?: () => void
}

export const Header = ({
  tallyStatus,
  companies,
  selectedCompany,
  onSelectCompany,
  onToggleWidgetMode,
  onRefresh,
  isRefreshing,
  userName,
  userRole,
  onLogout,
}: HeaderProps) => {
  const effectiveName = userName || (selectedCompany ? selectedCompany.split(' ')[0] : 'Workspace')
  const effectiveRole = userRole || 'Owner'
  const initials = effectiveName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CB'
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anything (invoices, ledgers, GST)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Middle & Right Section Controls */}
      <div className="flex items-center space-x-4">
        {/* Live Tally Bridge Status */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs">
          {tallyStatus?.is_online ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-700 font-semibold">Tally Prime Port {tallyStatus.tally_port}</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-600 font-medium">Online</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-700 font-medium">Tally Standby</span>
            </>
          )}
        </div>

        {/* Company Switcher Dropdown */}
        <div className="relative">
          <select
            value={selectedCompany}
            onChange={(e) => onSelectCompany(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-xl pl-8 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition shadow-2xs"
          >
            {companies.length > 0 ? (
              companies.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))
            ) : (
              <option value={selectedCompany || 'Primary Company'}>{selectedCompany || 'Primary Company'}</option>
            )}
          </select>
          <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Refresh Sync Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title={`Sync with Tally Port ${tallyStatus?.tally_port || 'Auto'}`}
          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>

        {/* Floating Widget Mode Switcher */}
        <button
          onClick={onToggleWidgetMode}
          title="Switch to Floating Widget mode"
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-medium transition"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Widget View</span>
        </button>

        {/* Notifications Bell */}
        <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white"></span>
        </button>

        {/* User Profile & Logout */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
          <div className="hidden lg:block text-left">
            <span className="block text-xs font-semibold text-slate-900 leading-tight">{effectiveName}</span>
            <span className="block text-[10px] text-slate-400">{effectiveRole}</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out of Admin Console"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition cursor-pointer ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
