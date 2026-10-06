import React from 'react'
import { Volume2 } from 'lucide-react'
import type { ChatMessage, QueueItem } from '../../core/types'
import { renderFormattedMessage } from '../../core/formatMessage'
import { InvoiceCard } from './InvoiceCard'
import { CorporateTicketCard } from './CorporateTicketCard'
import { SalesSummaryCard } from './SalesSummaryCard'
import { AccountingReportCard } from './AccountingReportCard'
import { CashBankCard } from './CashBankCard'
import { PartyCard } from './PartyCard'
import { ConnectorStatusCard } from './ConnectorStatusCard'
import { SubscriptionCard } from './SubscriptionCard'

interface WidgetMessageItemProps {
  msg: ChatMessage
  playingAudioId: string | null
  playBase64Audio: (id: string, base64Audio: string) => void
  handleWhatsAppShare: (voucher: any) => void
  resolvedCompany: string
  activePort: number | null
}

export const WidgetMessageItem: React.FC<WidgetMessageItemProps> = ({
  msg,
  playingAudioId,
  playBase64Audio,
  handleWhatsAppShare,
  resolvedCompany,
  activePort,
}) => {
  const isUser = msg.role === 'user'

  const voucherTool = msg.tool_calls?.find(
    (t) =>
      t.tool === 'create_sales_invoice_command' ||
      t.tool === 'create_receipt_voucher_command' ||
      t.tool === 'get_company_vouchers_command'
  )
  const voucherData = voucherTool?.result as QueueItem | undefined

  const ticketTool = msg.tool_calls?.find(
    (t) => t.tool === 'create_support_ticket' || t.tool === 'check_support_ticket_status'
  )
  const ticketData = ticketTool?.result as any

  const analyticsTool = msg.tool_calls?.find((t) => t.tool === 'get_sales_analytics_command')
  const analyticsData = analyticsTool?.result as any

  const reportTool = msg.tool_calls?.find((t) => t.tool === 'get_accounting_report_command')
  const reportData = reportTool?.result as any

  const cashBankTool = msg.tool_calls?.find((t) => t.tool === 'get_cash_bank_command')
  const cashBankData = cashBankTool?.result as any

  const partyTool = msg.tool_calls?.find((t) => t.tool === 'get_parties_command')
  const partyData = partyTool?.result as any

  const connectorTool = msg.tool_calls?.find((t) => t.tool === 'get_connector_status_command')
  const connectorData = connectorTool?.result as any

  const subscriptionTool = msg.tool_calls?.find((t) => t.tool === 'get_subscription_status_command')
  const subscriptionData = subscriptionTool?.result as any

  return (
    <div
      className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${
          isUser ? 'bg-slate-700' : 'bg-emerald-700 shadow-sm'
        }`}
      >
        {isUser ? 'ME' : 'CB'}
      </div>

      <div className="flex flex-col space-y-1.5 max-w-[85%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
            isUser
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          {msg.transcription && (
            <div className="text-[10px] text-emerald-200 italic mb-1 flex items-center space-x-1">
              <span>🎙️ Voice:</span>
              <span>"{msg.transcription}"</span>
            </div>
          )}

          <div>{renderFormattedMessage(msg.content, isUser)}</div>

          {/* Voice Audio Listen Button */}
          {msg.audio_base64 && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center space-x-2">
              <button
                onClick={() => playBase64Audio(msg.id, msg.audio_base64!)}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200 transition"
              >
                <Volume2
                  className={`w-3 h-3 ${playingAudioId === msg.id ? 'animate-bounce text-emerald-600' : ''}`}
                />
                <span>
                  {playingAudioId === msg.id
                    ? 'Playing...'
                    : `Listen in ${msg.detected_language || 'Voice'}`}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Interactive Invoice Card with Tally 4-Step Stepper */}
        {voucherData && (
          <InvoiceCard voucherData={voucherData} onWhatsAppShare={handleWhatsAppShare} />
        )}

        {/* Interactive Corporate Support Ticket Card */}
        {ticketData && (
          <CorporateTicketCard
            ticketData={ticketData}
            resolvedCompany={resolvedCompany}
            activePort={activePort}
          />
        )}

        {/* Interactive Financial Summary & Analytics Card (Sales, Receipts, Orders, Credit Notes) */}
        {analyticsData && (
          <SalesSummaryCard analyticsData={analyticsData} />
        )}

        {/* Interactive Official Accounting Report Card (Day Book, Trial Balance, P&L, Balance Sheet, Voucher Lines) */}
        {reportData && (
          <AccountingReportCard reportData={reportData} />
        )}

        {/* Interactive Cash & Bank Module Card */}
        {cashBankData && (
          <CashBankCard cashBankData={cashBankData} />
        )}

        {/* Interactive Party Ledger & Directory Card */}
        {partyData && (
          <PartyCard partyData={partyData} />
        )}

        {/* Interactive Connector Status Card */}
        {connectorData && (
          <ConnectorStatusCard statusData={connectorData} />
        )}

        {/* Interactive Subscription & Plan Card */}
        {subscriptionData && (
          <SubscriptionCard subData={subscriptionData} />
        )}

        <span className={`text-[9px] text-slate-400 px-1 flex items-center gap-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {msg.detected_language && !isUser && (
            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              🌐 {msg.detected_language}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
