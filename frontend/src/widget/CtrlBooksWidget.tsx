import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import {
  X,
  Send,
  Sparkles,
  Volume2,
  Share2,
  CheckCircle2,
  Minus,
  Maximize2,
  RefreshCw,
  FileText,
  ExternalLink,
  PlusCircle,
  Ticket,
  TrendingUp,
} from 'lucide-react'
import type { ChatMessage, QueueItem, TallyStatus } from '../core/types'
import { api } from '../core/api'
import { downloadCorporateTicketPDF } from '../core/ticketPdf'
import { renderFormattedMessage } from '../core/formatMessage'
import { VoiceRecorder } from '../views/VoiceRecorder'

export interface CtrlBooksWidgetProps {
  initialOpen?: boolean
  companyName?: string
  companyId?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  tallyPort?: number
  authToken?: string
  apiUrl?: string
  positionClassName?: string
  onVoucherCreated?: (voucher: QueueItem) => void
}

export const CtrlBooksWidget = ({
  initialOpen = true,
  companyName = 'CtrlBooks',
  companyId,
  userName,
  userEmail,
  userPhone,
  tallyPort,
  authToken,
  positionClassName,
  onVoucherCreated,
}: CtrlBooksWidgetProps) => {
  // Auto-resolve logged-in user identity, CompanyId, & Connector Web Token from props, window.CtrlBooksAI, or localStorage
  const globalCfg = typeof window !== 'undefined' ? (window as any).CtrlBooksAI || {} : {}
  const storedToken =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('token') ||
        window.localStorage.getItem('accessToken') ||
        window.localStorage.getItem('web_token') ||
        window.localStorage.getItem('jwt') ||
        undefined
      : undefined
  const storedCompanyId =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('companyId') ||
        window.localStorage.getItem('activeCompanyId') ||
        window.localStorage.getItem('selectedCompanyId') ||
        undefined
      : undefined

  const resolvedPosition =
    positionClassName ||
    globalCfg.position ||
    (typeof document !== 'undefined' && document.querySelector('button[aria-label="Quick create"]')
      ? 'bottom-5 right-24'
      : 'bottom-6 right-6')

  const resolvedCompany = companyName || globalCfg.companyName || 'CtrlBooks'
  const resolvedCompanyId = companyId || globalCfg.companyId || storedCompanyId || '6aa0f659f858467a84d08d57'
  const resolvedConnectorToken = authToken || globalCfg.connectorToken || globalCfg.authToken || storedToken
  const resolvedUserName = userName || globalCfg.userName || 'Authorized User'
  const resolvedUserEmail = userEmail || globalCfg.userEmail || 'user@ctrlbooks.com'
  const resolvedUserPhone = userPhone || globalCfg.userPhone || 'Session Verified'
  const resolvedTallyPort: number | undefined = tallyPort || (globalCfg.tallyPort ? Number(globalCfg.tallyPort) : undefined)

  const WIDGET_STORAGE_CONV_KEY = 'ctrlbooks_widget_conversation_id'
  const WIDGET_STORAGE_MSGS_KEY = 'ctrlbooks_widget_cached_messages'

  const defaultWelcomeMessage: ChatMessage = {
    id: 'welcome-msg',
    role: 'assistant',
    content: `Namaste! 👋 Main aapka **CtrlBooks AI Assistant** hoon (**PatwatoliAI** ka Accounting & Tally Assistant).\n\nAap mujhse seedha apni bhasha me baat karke **Sales/Receipt Vouchers** banwa sakte hain, **Tally Prime Sync** check kar sakte hain, ya **Support Ticket** raise kar sakte hain. Aaj main aapki kya madad karun?`,
    created_at: new Date().toISOString(),
  }

  const [isOpen, setIsOpen] = useState(initialOpen)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem(WIDGET_STORAGE_MSGS_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch (e) {
        console.warn('Failed to parse cached widget messages', e)
      }
    }
    return [defaultWelcomeMessage]
  })
  const [inputText, setInputText] = useState('')
  const [tallyStatus, setTallyStatus] = useState<TallyStatus | null>(null)
  const [conversationId, setConversationId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(WIDGET_STORAGE_CONV_KEY) || undefined
    }
    return undefined
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [widgetTab, setWidgetTab] = useState<'chat' | 'tickets'>('chat')
  const [ticketsList, setTicketsList] = useState<any[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const activePort = tallyStatus?.tally_port || resolvedTallyPort || null

  const loadCustomerTickets = async () => {
    setTicketsLoading(true)
    try {
      const list = await api.fetchTickets()
      setTicketsList(list || [])
    } catch (err) {
      console.error('Failed to load tickets in widget:', err)
    } finally {
      setTicketsLoading(false)
    }
  }

  const filteredTickets = ticketsList.filter((t) => {
    if (ticketFilter === 'ACTIVE') {
      return t.status !== 'RESOLVED' && t.status !== 'CLOSED'
    }
    if (ticketFilter === 'RESOLVED') {
      return t.status === 'RESOLVED' || t.status === 'CLOSED'
    }
    return true
  })

  const quickPills = [
    { label: 'Create Sales Invoice', prompt: 'Naya sales voucher create karo' },
    { label: 'Check Tally Sync', prompt: 'Tally Prime live port aur sync status check karo' },
    { label: 'GST Query', prompt: 'GSTR-1 aur GSTR-3B filing dates kya hain?' },
    { label: 'Pending Invoices', prompt: 'Kitne outstanding invoices pending hain?' },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const syncToLocal = (newMsgs: ChatMessage[], newConvId?: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(WIDGET_STORAGE_MSGS_KEY, JSON.stringify(newMsgs))
        if (newConvId) window.localStorage.setItem(WIDGET_STORAGE_CONV_KEY, newConvId)
      } catch (e) {
        console.warn('Failed to sync widget state locally', e)
      }
    }
  }

  const handleNewChat = () => {
    setConversationId(undefined)
    const freshWelcome: ChatMessage[] = [
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Namaste! 👋 Main aapka **CtrlBooks AI Assistant** hoon (**PatwatoliAI** ka Accounting & Tally Assistant).\n\nNayi chat shuru ho gayi hai. Aaj main aapki kya madad karun?`,
        created_at: new Date().toISOString(),
      },
    ]
    setMessages(freshWelcome)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(WIDGET_STORAGE_CONV_KEY)
      window.localStorage.setItem(WIDGET_STORAGE_MSGS_KEY, JSON.stringify(freshWelcome))
    }
  }

  const checkStatus = async () => {
    setIsRefreshing(true)
    try {
      const s = await api.fetchTallyStatus(resolvedCompany, resolvedUserEmail, resolvedTallyPort)
      setTallyStatus(s)
    } catch (err) {
      console.error('Status check error:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Restore past conversation from Database on mount
  useEffect(() => {
    let isCancelled = false
    const restoreFromDatabase = async () => {
      try {
        const savedId = conversationId || (typeof window !== 'undefined' ? window.localStorage.getItem(WIDGET_STORAGE_CONV_KEY) : null)
        if (savedId) {
          const detail = await api.fetchConversation(savedId)
          if (!isCancelled && detail && detail.messages && detail.messages.length > 0) {
            setMessages(detail.messages)
            syncToLocal(detail.messages, savedId)
            return
          }
        }
        // Fallback: Check if user has an existing active conversation in database
        const latest = await api.fetchLatestConversation()
        if (!isCancelled && latest && latest.messages && latest.messages.length > 0) {
          setConversationId(latest.id)
          setMessages(latest.messages)
          syncToLocal(latest.messages, latest.id)
        }
      } catch (err) {
        console.warn('Past conversation restore info:', err)
      }
    }
    restoreFromDatabase()
    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    checkStatus()
    loadCustomerTickets()
  }, [resolvedCompany, resolvedTallyPort])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom()
    }
  }, [messages, isOpen, isMinimized, isLoading])

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    const withUser = [...messages, userMsg]
    setMessages(withUser)
    syncToLocal(withUser, conversationId)
    setIsLoading(true)

    try {
      const res = await api.sendChatMessage(text, conversationId, resolvedCompany, {
        userName: resolvedUserName,
        userEmail: resolvedUserEmail,
        userPhone: resolvedUserPhone,
        tallyPort: resolvedTallyPort,
        companyId: resolvedCompanyId,
        connectorToken: resolvedConnectorToken,
      })
      const nextConvId = res.conversation_id || conversationId
      if (res.conversation_id) setConversationId(res.conversation_id)
      const withAssistant = [...withUser, res.message]
      setMessages(withAssistant)
      syncToLocal(withAssistant, nextConvId)
      
      const voucherTool = res.tool_calls?.find(
        (t: any) =>
          t.tool === 'create_sales_invoice_command' ||
          t.tool === 'create_receipt_voucher_command' ||
          t.tool === 'get_company_vouchers_command'
      )
      if (voucherTool?.result && onVoucherCreated) {
        onVoucherCreated(voucherTool.result as QueueItem)
      }

      const ticketTool = res.tool_calls?.find(
        (t: any) => t.tool === 'create_support_ticket' || t.tool === 'check_support_ticket_status'
      )
      if (ticketTool) {
        loadCustomerTickets()
      }
    } catch (err: any) {
      console.error('Chat error:', err)
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Server connection failed.'}`,
        created_at: new Date().toISOString(),
      }
      const withErr = [...withUser, errorMsg]
      setMessages(withErr)
      syncToLocal(withErr, conversationId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendVoice = async (audioBlob: Blob, transcript?: string) => {
    setIsVoiceProcessing(true)
    try {
      const res = await api.sendVoiceChat(audioBlob, conversationId, 'auto', transcript)
      const nextConvId = res.conversation_id || conversationId
      if (res.conversation_id) setConversationId(res.conversation_id)

      const userMsg: ChatMessage = {
        id: `user-voice-${Date.now()}`,
        role: 'user',
        content: res.transcription || transcript || '(Audio Speech)',
        created_at: new Date().toISOString(),
      }

      // Detect card type for rich visualization if voucher was created
      let cardType: 'invoice' | 'receivables' | 'gst' | 'none' = 'none'
      let cardData: any = null
      if (res.tool_calls && res.tool_calls.length > 0) {
        const vTool = res.tool_calls.find(
          (t: any) =>
            t.tool === 'create_sales_invoice_command' ||
            t.tool === 'create_receipt_voucher_command' ||
            t.tool === 'get_company_vouchers_command'
        )
        if (vTool) {
          cardType = 'invoice'
          cardData = vTool.result
        }
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-voice-${Date.now()}`,
        role: 'assistant',
        content: res.response_text,
        audio_base64: res.audio_base64,
        created_at: new Date().toISOString(),
        tool_calls: res.tool_calls,
        detected_language: res.detected_language,
        voice_used: res.voice_used,
        card_type: cardType,
        card_data: cardData,
      }

      const withVoice = [...messages, userMsg, assistantMsg]
      setMessages(withVoice)
      syncToLocal(withVoice, nextConvId)
      await checkStatus()
      const ticketTool = res.tool_calls?.find(
        (t: any) => t.tool === 'create_support_ticket' || t.tool === 'check_support_ticket_status'
      )
      if (ticketTool) {
        loadCustomerTickets()
      }
    } catch (err: any) {
      console.error('Voice error:', err)
      alert(`Voice processing error: ${err.message || 'Failed'}`)
    } finally {
      setIsVoiceProcessing(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isLoading) return
    const text = inputText.trim()
    setInputText('')
    await handleSendMessage(text)
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
    const text = `Namaste ${party}, aapka Tax Invoice #${invNo} for ₹${total.toLocaleString('en-IN')} Tally Prime me create ho gaya hai. - Sent via CtrlBooks AI.`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className={`fixed ${resolvedPosition} z-99999 font-sans antialiased`}>
      {/* 1. Closed State: Floating Action Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
          }}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xl hover:shadow-emerald-700/50 transition-all duration-300 hover:scale-105 active:scale-95"
          title="Open CtrlBooks AI Assistant"
        >
          {/* Pulsing ring */}
          <span className="absolute -inset-1 rounded-full bg-emerald-500 opacity-40 animate-ping"></span>
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>

          {/* Tooltip badge */}
          <div className="absolute right-16 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none">
            CtrlBooks AI Assistant
          </div>
        </button>
      )}

      {/* 2. Minimized State: Sleek Floating Pill Bar */}
      {isOpen && isMinimized && (
        <div className="flex items-center gap-2.5 bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white pl-3.5 pr-2 py-2 rounded-full shadow-2xl border border-white/20 select-none whitespace-nowrap">
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 hover:opacity-90 transition text-left cursor-pointer"
            title="Click to expand CtrlBooks AI"
          >
            <div className="w-6 h-6 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-tight">CtrlBooks AI</span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                Assistant
              </span>
            </div>
          </button>

          <a
            href="https://patwatoliai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-200/90 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full border border-white/20 transition-colors"
            title="Visit patwatoliai.com"
          >
            <span>by patwatoliai.com</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-80" />
          </a>

          {/* Port Status */}
          <div className="flex items-center space-x-1 text-[10.5px] text-emerald-100 pl-1 border-l border-white/20">
            {tallyStatus?.is_online && activePort ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>Port {activePort} Online</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{activePort ? `Port ${activePort} Standby` : 'Tally: Auto-Detect'}</span>
              </>
            )}
          </div>

          {/* Window Action Buttons */}
          <div className="flex items-center space-x-0.5 pl-1 border-l border-white/20">
            <button
              onClick={() => setIsMinimized(false)}
              title="Maximize"
              className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 transition cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              title="Close"
              className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Open State: Full Floating AI Assistant Window */}
      {isOpen && !isMinimized && (
        <div className="flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden w-[95vw] sm:w-105 md:w-112.5 h-160 max-h-[calc(100vh-5rem)]">
          {/* Header */}
          <div className="bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 px-4 py-3 text-white flex items-center justify-between shrink-0 shadow-xs select-none">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-bold text-sm tracking-tight leading-none whitespace-nowrap">CtrlBooks AI</h3>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 whitespace-nowrap">
                    Assistant
                  </span>
                  <a
                    href="https://patwatoliai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-200/90 hover:text-white bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded border border-white/20 transition-colors ml-1 whitespace-nowrap"
                    title="Visit patwatoliai.com"
                  >
                    <span>by patwatoliai.com</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                  </a>
                </div>
                <div className="flex items-center space-x-1 text-[11px] text-emerald-100 mt-0.5 whitespace-nowrap">
                  {tallyStatus?.is_online && activePort ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                      <span>Port {activePort} Online</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      <span>{activePort ? `Port ${activePort} Standby` : 'Tally Port: Auto-Detect'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={handleNewChat}
                title="Start New Chat (Nayi Chat)"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={checkStatus}
                disabled={isRefreshing}
                title="Refresh Tally Status"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                title="Minimize"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sleek Segmented Tab Switcher */}
          <div className="flex items-center bg-slate-100/90 border-b border-slate-200 p-1 shrink-0 select-none">
            <button
              type="button"
              onClick={() => setWidgetTab('chat')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                widgetTab === 'chat'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Assistant</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWidgetTab('tickets')
                loadCustomerTickets()
              }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                widgetTab === 'tickets'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-600" />
              <span>My Tickets</span>
              {ticketsList.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    widgetTab === 'tickets'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {ticketsList.length}
                </span>
              )}
            </button>
          </div>

          {widgetTab === 'tickets' ? (
            /* Dedicated My Tickets View */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/70">
              {/* Filter Toolbar */}
              <div className="p-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setTicketFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      ticketFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs'
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
          ) : (
            /* Live Assistant Chat View */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/70">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Quick Suggestion Pills if fresh */}
                {messages.length <= 1 && (
                  <div className="space-y-2 pt-2 pb-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Quick Suggestions
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quickPills.map((pill, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(pill.prompt)}
                          className="text-left p-2.5 rounded-xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-[11px] text-slate-700 hover:text-emerald-800 transition font-medium shadow-2xs"
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages Stream */}
                {messages.map((msg) => {
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

                  return (
                    <div
                      key={msg.id}
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
                          <div className="bg-white rounded-2xl border border-emerald-300 p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Invoice {voucherData.voucher_number}</span>
                              </span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                {voucherData.status ? voucherData.status.replace(/_/g, ' ') : 'QUEUED'}
                              </span>
                            </div>

                            <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Party</span>
                                <span className="font-semibold text-slate-800">
                                  {voucherData.payload?.payload?.party_ledger}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Total (incl. GST)</span>
                                <span className="font-bold text-emerald-700 font-mono">
                                  ₹{voucherData.payload?.payload?.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* 4-Step Stepper */}
                            <div className="text-[10px]">
                              <div className="flex items-center justify-between text-slate-400">
                                <span className="text-emerald-700 font-semibold flex items-center space-x-0.5">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>AI Created</span>
                                </span>
                                <span>➔</span>
                                <span className="text-emerald-700 font-semibold flex items-center space-x-0.5">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>GST Balanced</span>
                                </span>
                                <span>➔</span>
                                <span className="text-emerald-700 font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping mr-1"></span>
                                  <span>Queued</span>
                                </span>
                                <span>➔</span>
                                <span>Tally Synced</span>
                              </div>
                            </div>

                            {/* WhatsApp Share Button */}
                            <div className="pt-1 flex items-center space-x-2">
                              <button
                                onClick={() => handleWhatsAppShare(voucherData)}
                                className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center justify-center space-x-1 shadow-xs transition"
                              >
                                <Share2 className="w-3 h-3" />
                                <span>WhatsApp Invoice</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Interactive Corporate Support Ticket Card */}
                        {ticketData && (
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
                                  ticketData.status === 'RESOLVED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : ticketData.status === 'IN_PROGRESS'
                                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                                    : ticketData.status === 'CLOSED'
                                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {ticketData.status === 'RESOLVED' && '✅ '}
                                {ticketData.status === 'IN_PROGRESS' && '⏳ '}
                                {ticketData.status === 'CLOSED' && '🔒 '}
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
                        )}

                        {/* Interactive Financial Summary & Analytics Card (Sales, Receipts, Orders, Credit Notes) */}
                        {analyticsData && (
                          <div className="bg-white rounded-2xl border border-emerald-300 p-3.5 shadow-sm space-y-3">
                            {/* Card Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                                  <TrendingUp className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-bold text-xs text-slate-900 block">
                                    {analyticsData.module_label || 'Sales'} Report
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {analyticsData.period_label || 'Today'}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                {analyticsData.total_count} {analyticsData.module_label || 'Invoices'}
                              </span>
                            </div>

                            {/* Big Stat Box */}
                            <div className="bg-linear-to-br from-emerald-50 to-teal-50/50 p-3 rounded-xl border border-emerald-100 flex items-baseline justify-between">
                              <div>
                                <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                                  Total {analyticsData.module_label || 'Sales'} Value
                                </span>
                                <div className="text-xl font-extrabold text-emerald-900 font-mono mt-0.5">
                                  ₹{analyticsData.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                              <div className="text-[10px] text-emerald-700 font-medium text-right">
                                <span>{analyticsData.company_name}</span>
                              </div>
                            </div>

                            {/* Top Transactions List */}
                            {analyticsData.items && analyticsData.items.length > 0 && (
                              <div className="space-y-1.5 pt-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-0.5">
                                  Transactions ({analyticsData.items.length})
                                </span>
                                <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-1">
                                  {analyticsData.items.slice(0, 4).map((itm: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between py-1.5 px-2 text-[11px]">
                                      <div>
                                        <span className="font-semibold text-slate-800 block leading-tight">
                                          {itm.party_ledger}
                                        </span>
                                        <span className="text-[9.5px] text-slate-400 font-mono">
                                          #{itm.voucher_number} • {itm.date}
                                        </span>
                                      </div>
                                      <span className="font-bold text-slate-900 font-mono">
                                        ₹{itm.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* WhatsApp Share Button */}
                            <div className="pt-1 flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const mod = analyticsData.module_label || 'Sales'
                                  const per = analyticsData.period_label || 'Today'
                                  const tot = analyticsData.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0'
                                  const cnt = analyticsData.total_count || 0
                                  const comp = analyticsData.company_name || 'CtrlBooks'
                                  const text = `📊 *${comp} - ${per} ${mod} Report*\n• Total Amount: ₹${tot}\n• Total Entries: ${cnt}\n- Generated via CtrlBooks AI.`
                                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                                }}
                                className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center justify-center space-x-1 shadow-2xs transition cursor-pointer"
                              >
                                <Share2 className="w-3 h-3" />
                                <span>WhatsApp Summary</span>
                              </button>
                            </div>
                          </div>
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
                })}

                {isLoading && (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>CtrlBooks AI is processing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Input Form */}
              <div className="p-3 bg-white border-t border-slate-200">
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition"
                >
                  <VoiceRecorder
                    onAudioRecorded={handleSendVoice}
                    disabled={isLoading || isVoiceProcessing}
                    isProcessing={isVoiceProcessing}
                  />

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isLoading || isVoiceProcessing}
                    placeholder="Ask or create voucher in Tally..."
                    className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading || isVoiceProcessing}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="flex items-center justify-between text-[9.5px] text-slate-400 mt-2 px-1">
                  <span>{activePort ? `Synced with Tally Port ${activePort} & Queue` : '2-Way Tally Queue Active (Auto-Detect Port)'}</span>
                  <a
                    href="https://patwatoliai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                    title="Powered by patwatoliai.com"
                  >
                    <span>⚡ Powered by patwatoliai.com</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
