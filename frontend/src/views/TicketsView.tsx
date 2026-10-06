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
  FileText,
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
      const items = await api.fetchAdminTickets()
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
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Support & SLA Operations Console</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time ticket queue with automated Tally Port telemetry, SLA timers, and department routing.
            </p>
          </div>
        </div>

        <button
          onClick={loadTickets}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Queue</span>
        </button>
      </div>

      {/* 4 Clean White KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all hover:border-slate-300">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Service Requests</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1.5">{totalCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all hover:border-slate-300">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active In Queue</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1.5">{openCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all hover:border-slate-300">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">P1 / P2 Priority SLA</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1.5">{highSlaCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all hover:border-slate-300">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Resolved & Closed</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1.5">{resolvedCount}</p>
        </div>
      </div>

      {/* Minimalist Filter Pills */}
      <div className="flex items-center space-x-2">
        {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              statusFilter === st
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/90'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-2 shadow-xs">
          <Shield className="w-10 h-10 text-slate-400 mx-auto" />
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

            const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED'

            return (
              <div
                key={t.ticket_id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-xs transition overflow-hidden"
              >
                <div className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    {/* Clean Minimalist Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                        #{t.ticket_id}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isResolved ? 'bg-slate-400' : t.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-slate-500" />
                        <span>{slaTier}</span>
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1">
                        <Briefcase className="w-3 h-3 text-slate-500" />
                        <span>{department}</span>
                      </span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center space-x-1">
                        <Globe className="w-3 h-3 text-slate-500" />
                        <span>{lang}</span>
                      </span>
                    </div>

                    {/* Subject & Customer Statement */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{t.subject}</h3>
                      {t.description && (
                        <p className="text-xs text-slate-600 mt-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                          <strong className="text-slate-800 font-semibold">Customer Statement:</strong> "{t.description}"
                        </p>
                      )}
                    </div>

                    {/* Metadata Details */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          <strong className="text-slate-700 font-medium">Company:</strong> {company}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          <strong className="text-slate-700 font-medium">Raised By:</strong>{' '}
                          <span className="font-semibold text-slate-800">{customerName}</span>{' '}
                          <code className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            {customerEmail} • {customerPhone}
                          </code>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          <strong className="text-slate-700 font-medium">Raised At:</strong> {formattedDate}, {formattedTime}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
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
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium shadow-2xs flex items-center space-x-1.5 transition cursor-pointer"
                      title="Download Official Corporate Service Ticket PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>PDF</span>
                    </button>

                    <button
                      onClick={() => setExpandedTicketId(isExpanded ? null : t.ticket_id)}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium shadow-2xs flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5 text-slate-500" />
                      <span>Diagnostics</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {!isResolved ? (
                      <button
                        onClick={() => handleAction(t.ticket_id, 'RESOLVED')}
                        disabled={processingId === t.ticket_id}
                        className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{processingId === t.ticket_id ? 'Updating...' : 'Mark Resolved'}</span>
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-slate-700 flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Expandable Clean Telemetry & Engineer Console */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Clean Light Telemetry Snapshot */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between text-slate-900 font-sans font-bold">
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-slate-600" />
                            AUTO-ATTACHED TALLY TELEMETRY SNAPSHOT
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono font-medium shadow-2xs">
                            Port {diag.tally_port || 'Auto'} {diag.tally_connector || 'ONLINE'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-1.5 pt-1 leading-relaxed">
                          <div>• Assigned Escalation Team: {assignedTeam}</div>
                          <div>• Connector Agent Version: v{diag.agent_version || '1.0.1'}</div>
                          <div>• Pending 2-Way Queue Items: {diag.pending_queue_items ?? 0} vouchers</div>
                          <div>• AI Root-Cause Hypothesis: {diag.root_cause_hypothesis || `Port ${diag.tally_port || 'Auto'} sync inspection required.`}</div>
                          <div className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs font-sans text-xs">
                            <span className="font-semibold text-slate-900">Engineer Playbook:</span> {diag.engineer_playbook || `Verify Tally HTTP port ${diag.tally_port || 'Auto'}.`}
                          </div>
                        </div>
                      </div>

                      {/* Clean Engineer Reply & Action Box */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block mb-2">
                            Support Engineer Official Response & Action
                          </span>
                          {t.messages && t.messages.length > 1 && (
                            <div className="space-y-1.5 mb-3 max-h-28 overflow-y-auto pr-1">
                              {t.messages.slice(1).map((m: any) => (
                                <div
                                  key={m.id}
                                  className="text-[11px] bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-800"
                                >
                                  <strong className="text-slate-900">[{m.sender_type}]:</strong> {m.message}
                                </div>
                              ))}
                            </div>
                          )}
                          <textarea
                            rows={3}
                            value={replyTextMap[t.ticket_id] || ''}
                            onChange={(e) =>
                              setReplyTextMap((prev) => ({ ...prev, [t.ticket_id]: e.target.value }))
                            }
                            placeholder="Write engineer resolution note or reply to customer..."
                            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 bg-white text-slate-800 placeholder-slate-400"
                          />
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-1">
                          <button
                            onClick={() => handleAction(t.ticket_id, 'IN_PROGRESS')}
                            disabled={processingId === t.ticket_id}
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition cursor-pointer shadow-2xs"
                          >
                            Send & Mark In-Progress
                          </button>
                          <button
                            onClick={() => handleAction(t.ticket_id, 'RESOLVED')}
                            disabled={processingId === t.ticket_id}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
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
