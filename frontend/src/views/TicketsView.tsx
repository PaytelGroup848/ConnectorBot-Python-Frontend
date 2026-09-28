import { useState, useEffect } from 'react'
import {
  Shield,
  Clock,
  User,
  Building2,
  CheckCircle2,
  RefreshCw,
  Globe,
  AlertTriangle,
  Activity,
  Send,
  ChevronDown,
  ChevronUp,
  Terminal,
  Briefcase,
} from 'lucide-react'
import { api } from '../core/api'
import { downloadCorporateTicketPDF } from '../core/ticketPdf'

export const TicketsView = () => {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL')
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null)
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadTickets = async () => {
    setLoading(true)
    try {
      const items = await api.fetchTickets()
      setTickets(items)
    } catch (err) {
      console.error('Failed to load tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleAction = async (ticketId: string, newStatus: string) => {
    setProcessingId(ticketId)
    try {
      const reply = replyTextMap[ticketId]?.trim()
      await api.updateTicketAction(ticketId, newStatus, reply)
      setReplyTextMap((prev) => ({ ...prev, [ticketId]: '' }))
      await loadTickets()
    } catch (err) {
      console.error('Ticket update error:', err)
    } finally {
      setProcessingId(null)
    }
  }

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'RESOLVED') return t.status === 'RESOLVED' || t.status === 'CLOSED'
    return t.status === statusFilter
  })

  const totalCount = tickets.length
  const openCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length
  const highSlaCount = tickets.filter((t) => t.priority === 'HIGH' || t.priority === 'URGENT').length
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Corporate Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900">CtrlBooks Enterprise Support Operations & SLA Desk</h1>
              <p className="text-xs text-slate-500">
                Real-time corporate ticket queue with automated Tally Port telemetry, SLA timers, and department routing.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadTickets}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Support Queue</span>
        </button>
      </div>

      {/* 4 Enterprise SLA KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Service Requests</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Active In Queue</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{openCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">P1 / P2 Priority SLA</span>
          <p className="text-2xl font-bold text-rose-700 mt-1">{highSlaCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resolved & Closed</span>
          <p className="text-2xl font-bold text-slate-700 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === st
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <Shield className="w-10 h-10 text-emerald-600 mx-auto opacity-80" />
          <h3 className="text-sm font-bold text-slate-800">No Tickets Matching Filter</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Speak or type in the AI Assistant: <em>"Tally port sync error ke liye urgent support ticket bana do"</em> to generate a corporate ticket with full telemetry.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((t) => {
            const summary = t.ai_summary || {}
            const diag = summary.diagnostics || {}
            const company = summary.company || 'Your Company'
            const customerName = summary.customer_name || 'Authorized User'
            const customerEmail = summary.customer_email || t.user_id || 'user@ctrlbooks.com'
            const customerPhone = summary.customer_phone || 'Session Verified'
            const department = summary.department || 'L2 Connector Engineering'
            const assignedTeam = summary.assigned_team || 'L2 Senior Technical Support'
            const slaTier = summary.sla_tier || (t.priority === 'HIGH' ? 'P2 - High' : 'P3 - Standard')
            const responseSla = summary.response_sla || '1 Hour'
            const resolutionSla = summary.resolution_sla || '4 Hours'
            const lang = summary.detected_language || 'English'
            const isExpanded = expandedTicketId === t.ticket_id

            const createdDate = new Date(t.created_at)
            const formattedDate = createdDate.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
            const formattedTime = createdDate.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })

            return (
              <div
                key={t.ticket_id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 shadow-2xs transition overflow-hidden"
              >
                <div className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    {/* Top Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                        #{t.ticket_id}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          t.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                          t.priority === 'URGENT' || t.priority === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>{slaTier}</span>
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-1">
                        <Briefcase className="w-3 h-3" />
                        <span>{department}</span>
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center space-x-1">
                        <Globe className="w-3 h-3" />
                        <span>{lang}</span>
                      </span>
                    </div>

                    {/* Corporate Normalized Subject & Customer Transcript */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{t.subject}</h3>
                      {t.description && (
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <strong>Customer Statement:</strong> "{t.description}"
                        </p>
                      )}
                    </div>

                    {/* Who Raised, When Raised, & SLA Targets */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          <strong>Company:</strong> {company}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          <strong>Raised By:</strong>{' '}
                          <span className="font-semibold text-slate-800">{customerName}</span>{' '}
                          <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                            {customerEmail} • {customerPhone}
                          </code>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          <strong>Raised At:</strong> {formattedDate}, {formattedTime}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                        <Activity className="w-3.5 h-3.5" />
                        <span>
                          SLA Target: First Response {responseSla} | Resolution {resolutionSla}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="shrink-0 flex items-center space-x-2">
                    <button
                      onClick={() =>
                        downloadCorporateTicketPDF({
                          ticket_id: t.ticket_id,
                          subject: t.subject,
                          description: t.description,
                          status: t.status,
                          priority: t.priority,
                          user_id: `${customerName} (${customerEmail} | ${customerPhone})`,
                          company,
                          department,
                          assigned_team: assignedTeam,
                          sla_tier: slaTier,
                          response_sla: responseSla,
                          resolution_sla: resolutionSla,
                          detected_language: lang,
                          created_at: t.created_at,
                          diagnostics: diag,
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
                      title="Download Official Corporate Service Ticket PDF"
                    >
                      📥 PDF
                    </button>

                    <button
                      onClick={() => setExpandedTicketId(isExpanded ? null : t.ticket_id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Diagnostics & Reply</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {t.status !== 'RESOLVED' && t.status !== 'CLOSED' ? (
                      <button
                        onClick={() => handleAction(t.ticket_id, 'RESOLVED')}
                        disabled={processingId === t.ticket_id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{processingId === t.ticket_id ? 'Updating...' : 'Mark Resolved'}</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center space-x-1 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Expandable Enterprise Diagnostic Telemetry & Engineer Console */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/90 p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Auto-Attached Tally Telemetry */}
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between text-emerald-400 font-sans font-bold">
                          <span>🩺 AUTO-ATTACHED TALLY TELEMETRY SNAPSHOT</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30">
                            Port {diag.tally_port || 'Auto'} {diag.tally_connector || 'ONLINE'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 space-y-1 pt-1">
                          <div>• Assigned Escalation Team: {assignedTeam}</div>
                          <div>• Connector Agent Version: v{diag.agent_version || '1.0.1'}</div>
                          <div>• Pending 2-Way Queue Items: {diag.pending_queue_items ?? 0} vouchers</div>
                          <div>• AI Root-Cause Hypothesis: {diag.root_cause_hypothesis || `Port ${diag.tally_port || 'Auto'} sync inspection required.`}</div>
                          <div className="text-amber-300">• Engineer Playbook: {diag.engineer_playbook || `Verify Tally HTTP port ${diag.tally_port || 'Auto'}.`}</div>
                        </div>
                      </div>

                      {/* Engineer Reply & Status Update Box */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block mb-2">
                            Support Engineer Official Response & Action
                          </span>
                          {t.messages && t.messages.length > 1 && (
                            <div className="space-y-1.5 mb-3 max-h-28 overflow-y-auto pr-1">
                              {t.messages.slice(1).map((m: any) => (
                                <div
                                  key={m.id}
                                  className="text-[11px] bg-emerald-50/80 border border-emerald-200 p-2 rounded-lg text-slate-800"
                                >
                                  <strong className="text-emerald-800">[{m.sender_type}]:</strong> {m.message}
                                </div>
                              ))}
                            </div>
                          )}
                          <textarea
                            rows={2}
                            value={replyTextMap[t.ticket_id] || ''}
                            onChange={(e) =>
                              setReplyTextMap((prev) => ({ ...prev, [t.ticket_id]: e.target.value }))
                            }
                            placeholder="Write engineer resolution note or reply to customer..."
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleAction(t.ticket_id, 'IN_PROGRESS')}
                            disabled={processingId === t.ticket_id}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition cursor-pointer"
                          >
                            Send & Mark In-Progress
                          </button>
                          <button
                            onClick={() => handleAction(t.ticket_id, 'RESOLVED')}
                            disabled={processingId === t.ticket_id}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send Reply & Resolve</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
