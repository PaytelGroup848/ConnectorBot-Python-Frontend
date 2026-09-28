import { Shield, Layers, Bot, Lock, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AdminTabId = 'tickets' | 'queue' | 'assistant'

interface MenuItem {
  id: AdminTabId
  label: string
  subtitle: string
  icon: LucideIcon
  badge?: number
  badgeColor?: string
}

interface SidebarProps {
  currentTab: AdminTabId
  setCurrentTab: (tab: AdminTabId) => void
  ticketCount: number
  queueCount: number
}

export const Sidebar = ({
  currentTab,
  setCurrentTab,
  ticketCount,
  queueCount,
}: SidebarProps) => {
  const menuItems: MenuItem[] = [
    {
      id: 'tickets',
      label: 'Support & SLA Desk',
      subtitle: 'Customer tickets & telemetry',
      icon: Shield,
      badge: ticketCount > 0 ? ticketCount : undefined,
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'queue',
      label: 'Tally 2-Way Queue',
      subtitle: 'Live Tally voucher monitor',
      icon: Layers,
      badge: queueCount > 0 ? queueCount : undefined,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'assistant',
      label: 'AI Diagnostic Sandbox',
      subtitle: 'Test multilingual voice & tools',
      icon: Bot,
    },
  ]

  return (
    <aside className="w-68 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none h-full overflow-y-auto">
      {/* Top Brand & Staff RBAC Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-extrabold text-lg shadow-md shadow-emerald-500/20">
              C
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-white tracking-tight">CtrlBooks Ops</span>
                <span className="text-[9px] uppercase font-extrabold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  STAFF
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">Internal Engineering Console</span>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Support & Operations
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold leading-tight">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.subtitle}</div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Staff RBAC Security Footer Card */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>RBAC: SUPPORT_ADMIN</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-[10.5px] text-slate-400 leading-relaxed">
            Authorized access to multi-tenant SLA tickets, live Tally port telemetry snapshots, and 2-Way Tally sync queues.
          </p>
          <div className="flex items-center space-x-1 text-[10px] text-slate-300 pt-1 border-t border-slate-700/70">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Zero-Knowledge PII Scrubber Active</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
