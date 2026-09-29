import { RefreshCw, Ticket, PlusCircle, Sparkles, FileText } from 'lucide-react'
import { downloadCorporateTicketPDF } from '../../core/ticketPdf'
import type { TallyStatus } from '../../core/types'

interface TicketsListTabProps {
  ticketsList: any[]
  filteredTickets: any[]
  ticketFilter: 'ALL' | 'ACTIVE' | 'RESOLVED'
  setTicketFilter: (filter: 'ALL' | 'ACTIVE' | 'RESOLVED') => void
  ticketsLoading: boolean
  loadCustomerTickets: () => void
  setWidgetTab: (tab: 'chat' | 'tickets') => void
  handleSendMessage: (text: string) => void
  resolvedCompany: string
  activePort: number | string | null
  tallyStatus: TallyStatus | null
}

export const TicketsListTab = ({
  ticketsList,
  filteredTickets,
  ticketFilter,
  setTicketFilter,
  ticketsLoading,
  loadCustomerTickets,
  setWidgetTab,
  handleSendMessage,
  resolvedCompany,
  activePort,
  tallyStatus,
}: TicketsListTabProps) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/70">
      {/* Sub Header Filters */}
      <div className="p-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl font-semibold text-[11px]">
          <button
            type="button"
            onClick={() => setTicketFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              ticketFilter === 'ALL'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({ticketsList.length})
          </button>
          <button
            type="button"
            onClick={() => setTicketFilter('ACTIVE')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              ticketFilter === 'ACTIVE'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active ({ticketsList.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length})
          </button>
          <button
            type="button"
            onClick={() => setTicketFilter('RESOLVED')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              ticketFilter === 'RESOLVED'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Resolved ({ticketsList.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length})
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={loadCustomerTickets}
            disabled={ticketsLoading}
            title="Refresh Tickets List"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ticketsLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {ticketsLoading && ticketsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="text-xs">Loading tickets from server...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                {ticketFilter === 'ALL'
                  ? 'No Support Tickets Found'
                  : `No ${ticketFilter === 'ACTIVE' ? 'Active' : 'Resolved'} Tickets`}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                Agar aapko Tally Sync ya billing me koi dikkat hai, toh aap seedha AI Assistant se bolkar ticket raise kar sakte hain.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setWidgetTab('chat')
                handleSendMessage('Mujhe ek support ticket create karna hai.')
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Raise New Ticket</span>
            </button>
          </div>
        ) : (
          filteredTickets.map((t) => {
            const isResolved = t.status === 'RESOLVED'
            const isClosed = t.status === 'CLOSED'
            const isInProgress = t.status === 'IN_PROGRESS'
            const isOpen = t.status === 'OPEN'

            return (
              <div
                key={t.ticket_id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 p-3.5 shadow-2xs transition space-y-2.5"
              >
                {/* Top Bar */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-slate-900">
                        🎫 #{t.ticket_id}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {new Date(t.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {t.ai_summary?.department || 'L2 Connector Engineering'}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase shrink-0 ${
                      isResolved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : isInProgress
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : isClosed
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {isResolved && '✅ '}
                    {isInProgress && '⏳ '}
                    {isOpen && '📩 '}
                    {isClosed && '🔒 '}
                    {t.status}
                  </span>
                </div>

                {/* Subject & Description */}
                <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 space-y-1">
                  <div className="text-xs font-semibold text-slate-800 leading-snug">
                    {t.subject}
                  </div>
                  {t.description && t.description !== t.subject && (
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
                    <span>Priority: <strong className="text-slate-700">{t.priority}</strong></span>
                    <span>SLA: <strong className="text-emerald-700">{t.ai_summary?.resolution_sla || 'Within 4 Hours'}</strong></span>
                  </div>
                </div>

                {/* Engineer Resolution Note */}
                {t.engineer_reply && (
                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-2.5 space-y-1">
                    <div className="text-[10px] font-bold text-emerald-800 flex items-center space-x-1">
                      <span>💬 Support Engineer Resolution Note:</span>
                    </div>
                    <p className="text-[11px] text-slate-700 italic leading-relaxed">
                      "{t.engineer_reply}"
                    </p>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setWidgetTab('chat')
                      handleSendMessage(`Ticket #${t.ticket_id} solve hua kya? Status aur latest update batao.`)
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-semibold flex items-center justify-center space-x-1 transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Ask AI for Update</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      downloadCorporateTicketPDF({
                        ticket_id: t.ticket_id,
                        subject: t.subject,
                        description: t.description,
                        status: t.status,
                        priority: t.priority,
                        company: t.ai_summary?.company || resolvedCompany,
                        user_id: t.user_id,
                        department: t.ai_summary?.department || 'L2 Connector Engineering',
                        assigned_team: t.ai_summary?.assigned_team || 'Tally Core Team',
                        sla_tier: t.ai_summary?.sla_tier || 'P3 - Standard',
                        response_sla: t.ai_summary?.response_sla || 'Within 1 Hour',
                        resolution_sla: t.ai_summary?.resolution_sla || 'Within 4 Hours',
                        created_at: t.created_at,
                        diagnostics: t.ai_summary?.diagnostics || {
                          tally_port: activePort || 9000,
                          tally_connector: tallyStatus?.is_online ? 'ONLINE' : 'STANDBY',
                        },
                        engineer_reply: t.engineer_reply,
                      })
                    }}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold flex items-center space-x-1 transition cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3 h-3" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Tab Footer Note */}
      <div className="p-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-400">
        <span>Auto-synced with L2 Enterprise Support Queue</span>
        <button
          type="button"
          onClick={() => {
            setWidgetTab('chat')
            handleSendMessage('Mujhe naya support ticket raise karna hai.')
          }}
          className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
        >
          + Raise New Ticket
        </button>
      </div>
    </div>
  )
}
