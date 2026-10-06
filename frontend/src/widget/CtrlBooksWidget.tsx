import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Sparkles, RefreshCw, Ticket } from 'lucide-react'
import type { ChatMessage, QueueItem, TallyStatus } from '../core/types'
import { api } from '../core/api'
import { TicketsListTab } from './components/TicketsListTab'
import { useWidgetAuth } from './hooks/useWidgetAuth'
import { useWidgetPosition } from './hooks/useWidgetPosition'
import { WidgetLauncher } from './components/WidgetLauncher'
import { WidgetHeader } from './components/WidgetHeader'
import { WidgetInputBar } from './components/WidgetInputBar'
import { WidgetMessageItem } from './components/WidgetMessageItem'
import {
  getConnectedCompanies,
  resolveCurrentActiveCompany,
} from './utils/companyResolver'

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
  forceShow?: boolean
  forceHide?: boolean
  onVoucherCreated?: (voucher: QueueItem) => void
}

export const CtrlBooksWidget = ({
  initialOpen = false,
  companyName = 'CtrlBooks',
  companyId,
  userName,
  userEmail,
  userPhone,
  tallyPort,
  authToken,
  apiUrl,
  positionClassName,
  forceShow,
  forceHide,
  onVoucherCreated,
}: CtrlBooksWidgetProps) => {
  // Sync apiUrl if passed as prop
  if (apiUrl && typeof window !== 'undefined') {
    if (!(window as any).CtrlBooksAI) (window as any).CtrlBooksAI = {}
    ;(window as any).CtrlBooksAI.apiUrl = apiUrl
  }

  // Auto-resolve logged-in user identity, CompanyId, & Connector Web Token
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

  const launcherPosition =
    positionClassName ||
    globalCfg.position ||
    (typeof document !== 'undefined' && document.querySelector('button[aria-label="Quick create"]')
      ? 'bottom-4 right-4 sm:bottom-5 sm:right-24'
      : 'bottom-4 right-4 sm:bottom-6 sm:right-6')

  const desktopPosition =
    positionClassName ||
    globalCfg.position ||
    (typeof document !== 'undefined' && document.querySelector('button[aria-label="Quick create"]')
      ? 'sm:bottom-5 sm:right-24'
      : 'sm:bottom-6 sm:right-6')

  // Dynamic host company discovery & synchronization state
  const [activeCompanyInfo, setActiveCompanyInfo] = useState<{ name: string; id?: string }>(() => {
    return resolveCurrentActiveCompany()
  })

  // Synchronize company changes dynamically across DOM, storage, and custom events
  useEffect(() => {
    let timer: number
    const syncCompany = async () => {
      try {
        const companies = await getConnectedCompanies()
        const detected = resolveCurrentActiveCompany(companies)
        if (detected.name && detected.name !== 'CtrlBooks') {
          setActiveCompanyInfo((prev) => {
            if (prev.name !== detected.name || prev.id !== detected.id) {
              return detected
            }
            return prev
          })
        }
      } catch (err) {}
    }

    syncCompany()
    timer = window.setInterval(syncCompany, 2500)

    const handleCustomChange = (e: any) => {
      if (e.detail?.companyName) {
        setActiveCompanyInfo({
          name: e.detail.companyName,
          id: e.detail.companyId,
        })
      } else {
        syncCompany()
      }
    }

    const handleUserInteraction = () => {
      setTimeout(syncCompany, 150)
      setTimeout(syncCompany, 500)
    }

    window.addEventListener('ctrlbooks:company-changed', handleCustomChange)
    window.addEventListener('storage', syncCompany)
    window.addEventListener('click', handleUserInteraction)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('ctrlbooks:company-changed', handleCustomChange)
      window.removeEventListener('storage', syncCompany)
      window.removeEventListener('click', handleUserInteraction)
    }
  }, [])

  const resolvedCompany =
    (activeCompanyInfo.name && activeCompanyInfo.name !== 'CtrlBooks')
      ? activeCompanyInfo.name
      : (companyName !== 'CtrlBooks' ? companyName : (globalCfg.companyName || 'CtrlBooks'))

  const resolvedCompanyId =
    activeCompanyInfo.id ||
    companyId ||
    globalCfg.companyId ||
    storedCompanyId ||
    undefined
  const resolvedConnectorToken = authToken || globalCfg.connectorToken || globalCfg.authToken || storedToken
  const resolvedUserName = userName || globalCfg.userName || 'Authorized User'
  const resolvedUserEmail = userEmail || globalCfg.userEmail || ''
  const resolvedUserPhone = userPhone || globalCfg.userPhone || 'Session Verified'
  const resolvedTallyPort: number | undefined = tallyPort || (globalCfg.tallyPort ? Number(globalCfg.tallyPort) : undefined)

  const WIDGET_STORAGE_CONV_KEY = 'ctrlbooks_widget_conversation_id'

  const getScopedUserPrefix = () => {
    const raw = resolvedUserEmail || (typeof window !== 'undefined' && (window as any).CtrlBooksAI?.userEmail) || 'guest'
    return String(raw).toLowerCase().replace(/[^a-z0-9_]/g, '_')
  }
  const getScopedConvKey = () => `ctrlbooks_widget_conv_${getScopedUserPrefix()}`
  const getScopedMsgsKey = () => `ctrlbooks_widget_msgs_${getScopedUserPrefix()}`

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
        const raw = userEmail || ((window as any).CtrlBooksAI?.userEmail) || 'guest'
        const safe = String(raw).toLowerCase().replace(/[^a-z0-9_]/g, '_')
        const cached = window.localStorage.getItem(`ctrlbooks_widget_msgs_${safe}`)
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
      const raw = userEmail || ((window as any).CtrlBooksAI?.userEmail) || 'guest'
      const safe = String(raw).toLowerCase().replace(/[^a-z0-9_]/g, '_')
      return window.localStorage.getItem(`ctrlbooks_widget_conv_${safe}`) || undefined
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

  // SaaS Auth Gate Hook
  const { isAllowed } = useWidgetAuth({
    authToken,
    resolvedUserEmail,
    forceShow,
    forceHide,
    defaultWelcomeMessage,
    setConversationId,
    setMessages,
    setTicketsList,
    WIDGET_STORAGE_CONV_KEY,
  })

  // Draggable window & launcher positions hook
  const {
    launcherPos,
    windowPos,
    launcherRef,
    windowRef,
    pillRef,
    handleLauncherPointerDown,
    handleMinimizedPointerDown,
    handleHeaderPointerDown,
    resetLauncherPos,
    resetWindowPos,
  } = useWidgetPosition(setIsOpen, setIsMinimized)

  const activePort: number | null = tallyStatus?.tally_port
    ? Number(tallyStatus.tally_port)
    : resolvedTallyPort
    ? Number(resolvedTallyPort)
    : null

  const loadCustomerTickets = async () => {
    setTicketsLoading(true)
    try {
      if (!resolvedUserEmail && !resolvedConnectorToken) {
        setTicketsList([])
        return
      }
      const list = await api.fetchCustomerTickets(resolvedUserEmail, resolvedCompany)
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
    { label: '📊 Aaj Ka Reports (Day Book)', prompt: 'Mere aaj ka reports do' },
    { label: '💼 Cash & Bank Balance', prompt: 'Cash aur bank dono balance dikhao' },
    { label: '👥 Party Balances', prompt: 'Meri parties ka balance dikhao' },
    { label: 'Create Sales Invoice', prompt: 'Naya sales voucher create karo' },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const syncToLocal = (newMsgs: ChatMessage[], newConvId?: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(getScopedMsgsKey(), JSON.stringify(newMsgs))
        if (newConvId) window.localStorage.setItem(getScopedConvKey(), newConvId)
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
      window.localStorage.removeItem(getScopedConvKey())
      window.localStorage.setItem(getScopedMsgsKey(), JSON.stringify(freshWelcome))
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
        const savedId = conversationId || (typeof window !== 'undefined' ? window.localStorage.getItem(getScopedConvKey()) : null)
        if (savedId) {
          const detail = await api.fetchConversation(savedId)
          if (!isCancelled && detail && detail.messages && detail.messages.length > 0) {
            setMessages(detail.messages)
            syncToLocal(detail.messages, savedId)
            return
          }
        }
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

    const latestCfg = typeof window !== 'undefined' ? (window as any).CtrlBooksAI || {} : {}
    let currentCompName = resolvedCompany
    let currentCompId = resolvedCompanyId
    try {
      const latestCompanies = await getConnectedCompanies()
      const detected = resolveCurrentActiveCompany(latestCompanies)
      if (detected.name && detected.name !== 'CtrlBooks') {
        currentCompName = detected.name
        if (detected.id) currentCompId = detected.id
      }
    } catch (e) {}

    const activeCompanyName = currentCompName || latestCfg.companyName || 'CtrlBooks'
    const activeCompanyId = currentCompId || latestCfg.companyId || undefined
    const activeToken =
      latestCfg.authToken ||
      latestCfg.connectorToken ||
      authToken ||
      resolvedConnectorToken
    const activeUserName = latestCfg.userName || resolvedUserName
    const activeUserEmail = latestCfg.userEmail || resolvedUserEmail
    const activeUserPhone = latestCfg.userPhone || resolvedUserPhone
    const activeTallyPort = latestCfg.tallyPort ? Number(latestCfg.tallyPort) : resolvedTallyPort

    try {
      const res = await api.sendChatMessage(text, conversationId, activeCompanyName, {
        userName: activeUserName,
        userEmail: activeUserEmail,
        userPhone: activeUserPhone,
        tallyPort: activeTallyPort,
        companyId: activeCompanyId,
        connectorToken: activeToken,
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

  if (!isAllowed) {
    return null
  }

  return (
    <>
      <WidgetLauncher
        isOpen={isOpen}
        isMinimized={isMinimized}
        launcherRef={launcherRef}
        pillRef={pillRef}
        launcherPos={launcherPos}
        launcherPosition={launcherPosition}
        tallyStatus={tallyStatus}
        activePort={activePort}
        handleLauncherPointerDown={handleLauncherPointerDown}
        handleMinimizedPointerDown={handleMinimizedPointerDown}
        resetLauncherPos={resetLauncherPos}
        setIsMinimized={setIsMinimized}
        setIsOpen={setIsOpen}
      />

      {/* Full Floating AI Assistant Window */}
      {isOpen && !isMinimized && (
        <div
          ref={windowRef}
          style={
            windowPos && typeof window !== 'undefined' && window.innerWidth >= 640
              ? {
                  position: 'fixed',
                  left: `${windowPos.x}px`,
                  top: `${windowPos.y}px`,
                  right: 'auto',
                  bottom: 'auto',
                }
              : undefined
          }
          className={`fixed inset-0 sm:inset-auto ${
            !windowPos ? desktopPosition : ''
          } z-99999 font-sans antialiased pointer-events-auto`}
        >
          <div className="flex flex-col bg-white overflow-hidden w-full h-[100dvh] max-h-[100dvh] rounded-none border-none sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-2xl sm:w-105 md:w-115 sm:h-160 sm:max-h-[calc(100vh-4rem)]">
            <WidgetHeader
              handleHeaderPointerDown={handleHeaderPointerDown}
              resetWindowPos={resetWindowPos}
              tallyStatus={tallyStatus}
              activePort={activePort}
              activeCompany={resolvedCompany}
              handleNewChat={handleNewChat}
              checkStatus={checkStatus}
              isRefreshing={isRefreshing}
              setIsMinimized={setIsMinimized}
              setIsOpen={setIsOpen}
            />

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
              <TicketsListTab
                ticketsList={ticketsList}
                filteredTickets={filteredTickets}
                ticketFilter={ticketFilter}
                setTicketFilter={setTicketFilter}
                ticketsLoading={ticketsLoading}
                loadCustomerTickets={loadCustomerTickets}
                setWidgetTab={setWidgetTab}
                handleSendMessage={handleSendMessage}
                resolvedCompany={resolvedCompany}
                activePort={activePort}
                tallyStatus={tallyStatus}
              />
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/70">
                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {messages.length <= 1 && (
                    <div className="space-y-2 pt-2 pb-1">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Quick Suggestions
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                        {quickPills.map((pill, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(pill.prompt)}
                            className="text-left p-2 sm:p-2.5 rounded-xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-[11px] text-slate-700 hover:text-emerald-800 transition font-medium shadow-2xs cursor-pointer active:scale-[0.99]"
                          >
                            {pill.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <WidgetMessageItem
                      key={msg.id}
                      msg={msg}
                      playingAudioId={playingAudioId}
                      playBase64Audio={playBase64Audio}
                      handleWhatsAppShare={handleWhatsAppShare}
                      resolvedCompany={resolvedCompany}
                      activePort={activePort}
                    />
                  ))}

                  {isLoading && (
                    <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>CtrlBooks AI is processing...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <WidgetInputBar
                  inputText={inputText}
                  setInputText={setInputText}
                  handleSubmit={handleSubmit}
                  handleSendVoice={handleSendVoice}
                  isLoading={isLoading}
                  isVoiceProcessing={isVoiceProcessing}
                  activePort={activePort}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
