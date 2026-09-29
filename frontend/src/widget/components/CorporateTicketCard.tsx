import { downloadCorporateTicketPDF } from '../../core/ticketPdf'

interface CorporateTicketCardProps {
  ticketData: any
  activePort?: number | string | null
  resolvedCompany: string
}

export const CorporateTicketCard = ({
  ticketData,
  activePort,
  resolvedCompany,
}: CorporateTicketCardProps) => {
  const isResolved = ticketData.status === 'RESOLVED'
  const isInProgress = ticketData.status === 'IN_PROGRESS'
  const isClosed = ticketData.status === 'CLOSED'

  return (
    <div className="bg-white rounded-2xl border border-emerald-300 p-3.5 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-bold text-xs text-slate-900 block">
            🎫 #{ticketData.ticket_id}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {ticketData.department || 'L2 Connector Engineering'}
          </span>
        </div>
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
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
          {isClosed && '🔒 '}
          {ticketData.sla_tier || ticketData.priority} • {ticketData.status}
        </span>
      </div>

      <div className="text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-800 font-semibold space-y-1">
        <div>{ticketData.subject}</div>
        <div className="flex justify-between text-[10px] text-emerald-700 pt-1 border-t border-slate-200/70">
          <span>Response SLA: {ticketData.response_sla || '1 Hour'}</span>
          <span>Target: {ticketData.resolution_sla || '4 Hours'}</span>
        </div>
      </div>

      {ticketData.engineer_reply && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-2.5 space-y-1">
          <div className="text-[10px] font-bold text-emerald-800 flex items-center space-x-1">
            <span>💬 Engineer Resolution Note:</span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed italic">
            "{ticketData.engineer_reply}"
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-[9.5px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium">
        <span>✅ Tally Port {ticketData.diagnostics?.tally_port || activePort || 'Auto-Detect'} Telemetry Attached</span>
        <button
          type="button"
          onClick={() =>
            downloadCorporateTicketPDF({
              ticket_id: ticketData.ticket_id,
              subject: ticketData.subject,
              description: ticketData.description,
              status: ticketData.status,
              priority: ticketData.priority,
              company: ticketData.company || resolvedCompany,
              user_id: ticketData.user_id,
              department: ticketData.department,
              sla_tier: ticketData.sla_tier,
              response_sla: ticketData.response_sla,
              resolution_sla: ticketData.resolution_sla,
              created_at: ticketData.created_at,
              diagnostics: ticketData.diagnostics,
              engineer_reply: ticketData.engineer_reply,
            })
          }
          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition cursor-pointer"
        >
          📥 PDF Receipt
        </button>
      </div>
    </div>
  )
}
