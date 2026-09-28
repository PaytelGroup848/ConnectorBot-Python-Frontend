import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import {
  Send,
  FileText,
  Shield,
  BarChart3,
  CreditCard,
  Clock,
  HelpCircle,
  Volume2,
  Share2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Printer,
} from 'lucide-react'
import type { ChatMessage, QueueItem } from '../core/types'
import { downloadCorporateTicketPDF } from '../core/ticketPdf'
import { renderFormattedMessage } from '../core/formatMessage'
import { VoiceRecorder } from './VoiceRecorder'

interface AssistantViewProps {
  messages: ChatMessage[]
  onSendMessage: (text: string) => Promise<void>
  onSendVoice: (blob: Blob, transcript?: string) => Promise<void>
  isLoading: boolean
  isVoiceProcessing: boolean
}

export const AssistantView = ({
  messages,
  onSendMessage,
  onSendVoice,
  isLoading,
  isVoiceProcessing,
}: AssistantViewProps) => {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const quickCards = [
    {
      title: 'Create an Invoice',
      desc: 'Generate & manage invoices',
      icon: FileText,
      prompt: 'Naya sales voucher create karo',
    },
    {
      title: 'GST Help',
      desc: 'Returns, compliance & filings',
      icon: Shield,
      prompt: 'Mujhe GST return file karne ke liye kya documents chahiye?',
    },
    {
      title: 'Business Reports',
      desc: 'Get insights & analytics',
      icon: BarChart3,
      prompt: 'Is month ki total sales aur pending receivables dikhao',
    },
    {
      title: 'TDS Queries',
      desc: 'Deduction & filing details',
      icon: CreditCard,
      prompt: 'Contractor payment par Section 194C TDS rules kya hain?',
    },
    {
      title: 'Payment Follow-up',
      desc: 'Track outstanding payments',
      icon: Clock,
      prompt: 'Kitne outstanding invoices pending hain?',
    },
    {
      title: 'General Help',
      desc: 'How-to guides & support',
      icon: HelpCircle,
      prompt: 'Tally Prime live port sync kaise verify karein?',
    },
  ]

  const userPastMessages = messages.filter((m) => m.role === 'user')
  const recentConversations = userPastMessages.length > 0
    ? userPastMessages.slice(-5).reverse().map((m) => ({
        title: m.content.length > 36 ? m.content.substring(0, 36) + '...' : m.content,
        time: 'Recent message',
      }))
    : [
        { title: 'GST return compliance', time: 'Compliance' },
        { title: 'Create sales voucher', time: 'Accounting' },
        { title: 'Tally Prime port status', time: 'Sync' },
        { title: 'Outstanding invoices', time: 'Receivables' },
        { title: 'TDS deduction rules', time: 'Tax' },
      ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isLoading) return
    const text = inputText.trim()
    setInputText('')
    await onSendMessage(text)
  }

  const playBase64Audio = (id: string, base64Audio: string) => {
    try {
      if (audioRef.current) audioRef.current.pause()
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      setPlayingAudioId(id)

      audio.onended = () => setPlayingAudioId(null)
      audio.onerror = () => setPlayingAudioId(null)
      audio.play()
    } catch (err) {
      console.error('Audio playback failed', err)
      setPlayingAudioId(null)
    }
  }

  const handleWhatsAppShare = (voucher: any) => {
    const party = voucher?.payload?.payload?.party_ledger || 'Customer'
    const total = voucher?.payload?.payload?.amount || 0
    const invNo = voucher?.voucher_number || 'INV'
    const text = `Namaste ${party}, aapka Tax Invoice #${invNo} for ₹${total.toLocaleString('en-IN')} successfully generate ho gaya hai. - Sent via CtrlBooks AI.`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      {/* Main Conversation & Assistant Center Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
        {/* Messages / Welcome Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length <= 1 ? (
            /* Figma Screen 1: Mascot & 6 Quick Action Cards */
            <div className="max-w-3xl mx-auto space-y-8 pt-4 pb-8">
              {/* Mascot & Hero Header */}
              <div className="text-center space-y-3">
                <div className="relative inline-block">
                  {/* Cute 3D Bot SVG Avatar */}
                  <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-600/20 ring-4 ring-emerald-50">
                    <Sparkles className="w-10 h-10 animate-pulse" />
                  </div>
                  {/* Mascot Speech Bubble */}
                  <div className="absolute -top-3 -right-20 bg-white border border-emerald-200 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                    I'm here to help!
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CtrlBooks AI</h1>
                  <p className="text-sm font-medium text-emerald-700 mt-0.5">
                    Your intelligent business & accounting assistant
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Ask me anything about invoices, GST, TDS, reports and Tally Prime sync.
                  </p>
                </div>
              </div>

              {/* 6 Quick Action Cards Grid (2x3 matching Figma) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {quickCards.map((card, idx) => {
                  const Icon = card.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(card.prompt)}
                      className="text-left bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition group shadow-2xs"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {card.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{card.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Figma Screen 5: Active Conversation Thread */
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                const voucherTool = msg.tool_calls?.find(
                  (t) =>
                    t.tool === 'create_sales_invoice_command' ||
                    t.tool === 'create_receipt_voucher_command' ||
                    t.tool === 'get_company_vouchers_command'
                )
                const voucherData = voucherTool?.result as QueueItem | undefined
                const ticketTool = msg.tool_calls?.find((t) => t.tool === 'create_support_ticket')
                const ticketData = ticketTool?.result as any

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                        isUser
                          ? 'bg-slate-700'
                          : 'bg-emerald-600 shadow-md shadow-emerald-600/20'
                      }`}
                    >
                      {isUser ? 'RS' : 'CB'}
                    </div>

                    <div className="flex flex-col space-y-2 max-w-[85%] sm:max-w-[78%]">
                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                          isUser
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white border border-slate-200/90 text-slate-800 shadow-xs'
                        }`}
                      >
                        {msg.transcription && (
                          <div className="text-[11px] text-emerald-200 italic mb-1 flex items-center space-x-1">
                            <span>🎙️ Voice:</span>
                            <span>"{msg.transcription}"</span>
                          </div>
                        )}

                        <div>{renderFormattedMessage(msg.content, isUser)}</div>

                        {/* Neural TTS Audio Playback */}
                        {msg.audio_base64 && (
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center space-x-2">
                            <button
                              onClick={() => playBase64Audio(msg.id, msg.audio_base64!)}
                              className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
                            >
                              <Volume2
                                className={`w-3.5 h-3.5 ${playingAudioId === msg.id ? 'animate-bounce text-emerald-600' : ''}`}
                              />
                              <span>
                                {playingAudioId === msg.id
                                  ? 'Playing Voice...'
                                  : `Listen in ${msg.detected_language || 'Voice'}`}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Figma Screen 6: Rich Actionable Invoice Card with Live Stepper */}
                      {voucherData && (
                        <div className="bg-white rounded-2xl border border-emerald-300 p-5 shadow-sm space-y-4">
                          {/* Card Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                                <FileText className="w-4 h-4" />
                              </span>
                              <span className="font-bold text-sm text-slate-900">
                                Invoice {voucherData.voucher_number}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                              {voucherData.status ? voucherData.status.replace(/_/g, ' ') : 'QUEUED FOR TALLY'}
                            </span>
                          </div>

                          {/* Party & Amount */}
                          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-slate-400 block text-[11px]">Party Name</span>
                              <span className="font-bold text-slate-900">
                                {voucherData.payload?.payload?.party_ledger}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Total (incl. GST)</span>
                              <span className="font-bold text-emerald-700 text-sm font-mono">
                                ₹{voucherData.payload?.payload?.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {/* World-Class Live 4-Step Sync Stepper */}
                          <div className="pt-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                              Tally Prime 2-Way Sync Progress
                            </span>
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center space-x-1 text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>AI Created</span>
                              </div>
                              <span className="text-slate-300">➔</span>
                              <div className="flex items-center space-x-1 text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>GST Balanced</span>
                              </div>
                              <span className="text-slate-300">➔</span>
                              <div className="flex items-center space-x-1 text-emerald-700 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                <span>CtrlBooks Queue</span>
                              </div>
                              <span className="text-slate-300">➔</span>
                              <div className="flex items-center space-x-1 text-slate-400">
                                <span>Tally XML Synced</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions: WhatsApp Share + Download */}
                          <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleWhatsAppShare(voucherData)}
                              className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share on WhatsApp</span>
                            </button>
                            <button
                              onClick={() => alert(`Printing Invoice ${voucherData.voucher_number}`)}
                              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition flex items-center space-x-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Rich Actionable Corporate Support Ticket Receipt Card */}
                      {ticketData && (
                        <div className="bg-white rounded-2xl border border-emerald-300 p-4 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                                <Shield className="w-4 h-4" />
                              </span>
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">
                                  Service Request #{ticketData.ticket_id}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {ticketData.department || 'L2 Connector Engineering'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              {ticketData.sla_tier || ticketData.priority} • {ticketData.status}
                            </span>
                          </div>

                          <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                            <div className="font-semibold text-slate-800">{ticketData.subject}</div>
                            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-slate-200/70">
                              <div>
                                <span className="text-slate-400 block">First Response SLA</span>
                                <span className="font-bold text-emerald-700">{ticketData.response_sla || '1 Hour'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Resolution Target</span>
                                <span className="font-bold text-emerald-700">{ticketData.resolution_sla || '4 Hours'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-emerald-700 bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-200/70 font-medium">
                            <span>✅ Auto-Attached: Tally Port {ticketData.diagnostics?.tally_port || 'Auto'} Telemetry & Queue Snapshot</span>
                            <button
                              type="button"
                              onClick={() => downloadCorporateTicketPDF(ticketData)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-2xs transition cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Download PDF</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <span className={`text-[10px] text-slate-400 px-1 flex items-center gap-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.detected_language && !isUser && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            🌐 {msg.detected_language}
                          </span>
                        )}
                        {msg.cached && <span className="text-emerald-600 font-semibold">• Instant Cache</span>}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="max-w-3xl mx-auto flex items-center space-x-3 text-xs text-slate-500 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>CtrlBooks AI is analyzing data and reasoning...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Floating Input Bar matching Figma */}
        <div className="p-4 bg-white border-t border-slate-200/80">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-2 flex items-center space-x-2 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition shadow-xs"
            >
              {/* Voice Mic Component with Waveform */}
              <VoiceRecorder
                onAudioRecorded={onSendVoice}
                disabled={isLoading || isVoiceProcessing}
                isProcessing={isVoiceProcessing}
              />

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading || isVoiceProcessing}
                placeholder="Ask anything about your business..."
                className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading || isVoiceProcessing}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-40 shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <p className="text-[10px] text-slate-400 text-center mt-2">
              CtrlBooks AI can make mistakes. Please verify important financial information with Tally Prime.
            </p>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Recent Conversations matching Figma */}
      <aside className="w-80 bg-white border-l border-slate-200/80 hidden xl:flex flex-col justify-between p-5 shrink-0">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Conversations</h3>
            <span className="text-[11px] text-emerald-600 font-semibold cursor-pointer hover:underline">View all</span>
          </div>

          <div className="space-y-3 mt-4">
            {recentConversations.map((conv, idx) => (
              <div
                key={idx}
                onClick={() => onSendMessage(conv.title)}
                className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60 cursor-pointer transition"
              >
                <h4 className="text-xs font-semibold text-slate-800 leading-tight">{conv.title}</h4>
                <span className="text-[10px] text-slate-400 mt-1 block">{conv.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Natural Language Prompt Card matching Figma */}
        <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-200/70">
          <span className="text-xs font-bold text-emerald-900 block mb-1">
            Need help with something specific?
          </span>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Try asking in natural Hindi or English, like: *"Party ka ledger dikhao"* or *"Pending invoices kitne hain"*
          </p>
        </div>
      </aside>
    </div>
  )
}
