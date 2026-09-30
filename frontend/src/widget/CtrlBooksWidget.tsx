import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import {
  X,
  Send,
  Sparkles,
  Volume2,
  Minus,
  Maximize2,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Ticket,
  GripHorizontal,
} from 'lucide-react'
import type { ChatMessage, QueueItem, TallyStatus } from '../core/types'
import { api } from '../core/api'
import { renderFormattedMessage } from '../core/formatMessage'
import { VoiceRecorder } from '../views/VoiceRecorder'
import { InvoiceCard } from './components/InvoiceCard'
import { CorporateTicketCard } from './components/CorporateTicketCard'
import { SalesSummaryCard } from './components/SalesSummaryCard'
import { AccountingReportCard } from './components/AccountingReportCard'
import { CashBankCard } from './components/CashBankCard'
import { PartyCard } from './components/PartyCard'
import { ConnectorStatusCard } from './components/ConnectorStatusCard'
import { SubscriptionCard } from './components/SubscriptionCard'
import { TicketsListTab } from './components/TicketsListTab'

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
  onVoucherCreated,
}: CtrlBooksWidgetProps) => {
  // Sync apiUrl if passed as prop
  if (apiUrl && typeof window !== 'undefined') {
    if (!(window as any).CtrlBooksAI) (window as any).CtrlBooksAI = {}
    ;(window as any).CtrlBooksAI.apiUrl = apiUrl
  }

  // SaaS Gate: If user is not authenticated or on public landing/login route, return null (ZERO DOM, ZERO ICON)
  const checkIsAllowed = () => {
    if (typeof window === 'undefined') return false
    const globalCfgObj = (window as any).CtrlBooksAI || {}
    if (globalCfgObj.forceShow === true) return true
    if (globalCfgObj.forceHide === true) return false

    const token =
      authToken ||
      globalCfgObj.authToken ||
      globalCfgObj.connectorToken ||
      window.localStorage.getItem('accessToken') ||
      window.localStorage.getItem('token') ||
      window.localStorage.getItem('web_token') ||
      window.localStorage.getItem('jwt')

    const hasToken = Boolean(
      token &&
      typeof token === 'string' &&
      token.trim() !== '' &&
      token !== 'undefined' &&
      token !== 'null'
    )

    // SaaS Auth Gate: Hide widget completely from unauthenticated guest / landing page visitors
    if (!hasToken) {
      return false
    }

    return true
  }

  const [isAllowed, setIsAllowed] = useState(checkIsAllowed)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateAllowed = () => {
      setIsAllowed(checkIsAllowed())
    }

    window.addEventListener('popstate', updateAllowed)
    window.addEventListener('storage', updateAllowed)
    window.addEventListener('ctrlbooks:auth-changed', updateAllowed)
    window.addEventListener('ctrlbooks:route-changed', updateAllowed)

    const interval = window.setInterval(updateAllowed, 500)
    return () => {
      window.removeEventListener('popstate', updateAllowed)
      window.removeEventListener('storage', updateAllowed)
      window.removeEventListener('ctrlbooks:auth-changed', updateAllowed)
      window.removeEventListener('ctrlbooks:route-changed', updateAllowed)
      window.clearInterval(interval)
    }
  }, [authToken])

  if (!isAllowed) {
    return null
  }

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

  const resolvedCompany = companyName || globalCfg.companyName || 'CtrlBooks'
  const resolvedCompanyId = companyId || globalCfg.companyId || storedCompanyId || '6aa0f659f858467a84d08d57'
  const resolvedConnectorToken = authToken || globalCfg.connectorToken || globalCfg.authToken || storedToken
  const resolvedUserName = userName || globalCfg.userName || 'Authorized User'
  const resolvedUserEmail = userEmail || globalCfg.userEmail || 'user@ctrlbooks.com'
  const resolvedUserPhone = userPhone || globalCfg.userPhone || 'Session Verified'
  const resolvedTallyPort: number | undefined = tallyPort || (globalCfg.tallyPort ? Number(globalCfg.tallyPort) : undefined)

  const WIDGET_STORAGE_CONV_KEY = 'ctrlbooks_widget_conversation_id'
  const WIDGET_STORAGE_MSGS_KEY = 'ctrlbooks_widget_cached_messages'
  const STORAGE_LAUNCHER_POS_KEY = 'ctrlbooks_widget_launcher_pos'
  const STORAGE_WINDOW_POS_KEY = 'ctrlbooks_widget_window_pos'

  interface WidgetPosition {
    x: number
    y: number
  }

  // Persistent user-defined placement (Saved in localStorage)
  const [launcherPos, setLauncherPos] = useState<WidgetPosition | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_LAUNCHER_POS_KEY)
        if (saved) return JSON.parse(saved)
      } catch (e) {}
    }
    return null
  })

  const [windowPos, setWindowPos] = useState<WidgetPosition | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_WINDOW_POS_KEY)
        if (saved) return JSON.parse(saved)
      } catch (e) {}
    }
    return null
  })

  const clampPosition = (pos: WidgetPosition, width: number, height: number): WidgetPosition => {
    if (typeof window === 'undefined') return pos
    const margin = 12
    const maxX = Math.max(margin, window.innerWidth - width - margin)
    const maxY = Math.max(margin, window.innerHeight - height - margin)
    return {
      x: Math.max(margin, Math.min(pos.x, maxX)),
      y: Math.max(margin, Math.min(pos.y, maxY)),
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => {
      if (launcherPos) {
        setLauncherPos((prev) => (prev ? clampPosition(prev, 64, 64) : null))
      }
      if (windowPos) {
        setWindowPos((prev) => (prev ? clampPosition(prev, 440, 640) : null))
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [launcherPos, windowPos])

  const launcherRef = useRef<HTMLDivElement | null>(null)
  const windowRef = useRef<HTMLDivElement | null>(null)
  const pillRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const dragStartPosRef = useRef({ x: 0, y: 0 })
  const elementStartPosRef = useRef({ x: 0, y: 0 })

  const handleLauncherPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const el = launcherRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
    elementStartPosRef.current = { x: rect.left, y: rect.top }
    isDraggingRef.current = false

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - dragStartPosRef.current.x
      const dy = moveEvent.clientY - dragStartPosRef.current.y

      if (!isDraggingRef.current && Math.hypot(dx, dy) > 5) {
        isDraggingRef.current = true
      }

      if (isDraggingRef.current) {
        const nextX = elementStartPosRef.current.x + dx
        const nextY = elementStartPosRef.current.y + dy
        const clamped = clampPosition({ x: nextX, y: nextY }, rect.width, rect.height)
        setLauncherPos(clamped)
      }
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)

      if (isDraggingRef.current) {
        const dx = upEvent.clientX - dragStartPosRef.current.x
        const dy = upEvent.clientY - dragStartPosRef.current.y
        const nextX = elementStartPosRef.current.x + dx
        const nextY = elementStartPosRef.current.y + dy
        const clamped = clampPosition({ x: nextX, y: nextY }, rect.width, rect.height)
        setLauncherPos(clamped)
        try {
          window.localStorage.setItem(STORAGE_LAUNCHER_POS_KEY, JSON.stringify(clamped))
        } catch (err) {}
      } else {
        setIsOpen(true)
        setIsMinimized(false)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  const handleMinimizedPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) return

    const pill = pillRef.current
    if (!pill) return

    const rect = pill.getBoundingClientRect()
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
    elementStartPosRef.current = { x: rect.left, y: rect.top }
    isDraggingRef.current = false

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - dragStartPosRef.current.x
      const dy = moveEvent.clientY - dragStartPosRef.current.y

      if (!isDraggingRef.current && Math.hypot(dx, dy) > 5) {
        isDraggingRef.current = true
      }

      if (isDraggingRef.current) {
        const nextX = elementStartPosRef.current.x + dx
        const nextY = elementStartPosRef.current.y + dy
        const clamped = clampPosition({ x: nextX, y: nextY }, rect.width, rect.height)
        setLauncherPos(clamped)
      }
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)

      if (isDraggingRef.current) {
        const dx = upEvent.clientX - dragStartPosRef.current.x
        const dy = upEvent.clientY - dragStartPosRef.current.y
        const nextX = elementStartPosRef.current.x + dx
        const nextY = elementStartPosRef.current.y + dy
        const clamped = clampPosition({ x: nextX, y: nextY }, rect.width, rect.height)
        setLauncherPos(clamped)
        try {
          window.localStorage.setItem(STORAGE_LAUNCHER_POS_KEY, JSON.stringify(clamped))
        } catch (err) {}
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) return
    if (typeof window !== 'undefined' && window.innerWidth < 640) return

    const win = windowRef.current
    if (!win) return

    const rect = win.getBoundingClientRect()
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
    elementStartPosRef.current = { x: rect.left, y: rect.top }
    isDraggingRef.current = false

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - dragStartPosRef.current.x
      const dy = moveEvent.clientY - dragStartPosRef.current.y

      if (!isDraggingRef.current && Math.hypot(dx, dy) > 4) {
        isDraggingRef.current = true
      }

      if (isDraggingRef.current) {
        const nextX = elementStartPosRef.current.x + dx
        const nextY = elementStartPosRef.current.y + dy
        const clamped = clampPosition({ x: nextX, y: nextY }, rect.width, rect.height)
        setWindowPos(clamped)
      }
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)

      if (isDraggingRef.current) {
        const dx = upEvent.clientX - dragStartPosRef.current.x
        const dy = upEvent.clientY - dragStartPosRef.current.y
        const nextX = elementStartPosRef.current.x + dx
        const nextY = elementStartPosRef.current.y + dy
        const clamped = clampPosition({ x: nextX, y: nextY }, rect.width, rect.height)
        setWindowPos(clamped)
        try {
          window.localStorage.setItem(STORAGE_WINDOW_POS_KEY, JSON.stringify(clamped))
        } catch (err) {}
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

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
    <>
      {/* 1. Closed State: Floating Action Launcher Button (Draggable) */}
      {!isOpen && (
        <div
          ref={launcherRef}
          onPointerDown={handleLauncherPointerDown}
          onDoubleClick={() => {
            setLauncherPos(null)
            try {
              window.localStorage.removeItem(STORAGE_LAUNCHER_POS_KEY)
            } catch (e) {}
          }}
          style={
            launcherPos
              ? {
                  position: 'fixed',
                  left: `${launcherPos.x}px`,
                  top: `${launcherPos.y}px`,
                  right: 'auto',
                  bottom: 'auto',
                  touchAction: 'none',
                }
              : { touchAction: 'none' }
          }
          className={`fixed ${!launcherPos ? launcherPosition : ''} z-99999 font-sans antialiased pointer-events-auto select-none`}
        >
          <button
            type="button"
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xl hover:shadow-emerald-700/50 transition-transform duration-150 hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing select-none"
            title="Drag to reposition / Click to open CtrlBooks AI (Double-click to reset)"
          >
            {/* Pulsing ring */}
            <span className="absolute -inset-1 rounded-full bg-emerald-500 opacity-40 animate-ping"></span>
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            {/* Tooltip badge */}
            <div className="absolute right-16 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none hidden sm:block">
              CtrlBooks AI Assistant
            </div>
          </button>
        </div>
      )}

      {/* 2. Minimized State: Sleek Floating Pill Bar (Draggable) */}
      {isOpen && isMinimized && (
        <div
          ref={pillRef}
          onPointerDown={handleMinimizedPointerDown}
          style={
            launcherPos
              ? {
                  position: 'fixed',
                  left: `${launcherPos.x}px`,
                  top: `${launcherPos.y}px`,
                  right: 'auto',
                  bottom: 'auto',
                  touchAction: 'none',
                }
              : { touchAction: 'none' }
          }
          className={`fixed ${!launcherPos ? launcherPosition : ''} z-99999 font-sans antialiased pointer-events-auto select-none`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2.5 bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white pl-3 pr-2 py-1.5 sm:py-2 rounded-full shadow-2xl border border-white/20 select-none whitespace-nowrap max-w-[calc(100vw-2rem)] cursor-grab active:cursor-grabbing">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="flex items-center gap-1.5 sm:gap-2 hover:opacity-90 transition text-left cursor-pointer"
              title="Click to expand CtrlBooks AI"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-300" />
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-bold text-xs tracking-tight">CtrlBooks AI</span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 hidden xs:inline">
                  Assistant
                </span>
              </div>
            </button>

            <a
              href="https://patwatoliai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-200/90 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full border border-white/20 transition-colors"
              title="Visit patwatoliai.com"
            >
              <span>by patwatoliai.com</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-80" />
            </a>

            {/* Port Status */}
            <div className="hidden sm:flex items-center space-x-1 text-[10.5px] text-emerald-100 pl-1 border-l border-white/20">
              {tallyStatus?.is_online && activePort ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>Port {activePort} Online</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>{activePort ? `Port ${activePort} Standby` : 'Tally: Auto'}</span>
                </>
              )}
            </div>

            {/* Window Action Buttons */}
            <div className="flex items-center space-x-0.5 pl-1 border-l border-white/20">
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                title="Maximize"
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 transition cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Open State: Full Floating AI Assistant Window (Draggable by Header) */}
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
            {/* Header with Drag Handle */}
            <div
              onPointerDown={handleHeaderPointerDown}
              onDoubleClick={() => {
                setWindowPos(null)
                try {
                  window.localStorage.removeItem(STORAGE_WINDOW_POS_KEY)
                } catch (e) {}
              }}
              className="bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 px-3.5 sm:px-4 py-2.5 sm:py-3 text-white flex items-center justify-between shrink-0 shadow-xs select-none sm:cursor-grab sm:active:cursor-grabbing"
              title="Click & drag header to reposition anywhere (Double-click to reset)"
            >
              <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-bold text-xs sm:text-sm tracking-tight leading-none whitespace-nowrap">CtrlBooks AI</h3>
                    <span className="text-[8.5px] sm:text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 whitespace-nowrap">
                      Assistant
                    </span>
                    <a
                      href="https://patwatoliai.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden md:inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-200/90 hover:text-white bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded border border-white/20 transition-colors ml-1 whitespace-nowrap"
                      title="Visit patwatoliai.com"
                    >
                      <span>by patwatoliai.com</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                    </a>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] sm:text-[11px] text-emerald-100 mt-0.5 whitespace-nowrap truncate">
                    {tallyStatus?.is_online && activePort ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shrink-0"></span>
                        <span>Port {activePort} Online</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                        <span>{activePort ? `Port ${activePort} Standby` : 'Tally Port: Auto-Detect'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center space-x-0.5 sm:space-x-1 shrink-0">
                <div className="hidden sm:flex items-center px-1 text-emerald-300/60" title="Drag to move">
                  <GripHorizontal className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={handleNewChat}
                  title="Start New Chat (Nayi Chat)"
                  className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={isRefreshing}
                  title="Refresh Tally Status"
                  className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer hidden xs:inline-flex"
                >
                  <RefreshCw className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  title="Minimize"
                  className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer hidden sm:inline-flex"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
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
            /* Live Assistant Chat View */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/70">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Quick Suggestion Pills if fresh */}
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
              <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-2xl p-1 sm:p-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition"
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
                    className="flex-1 bg-transparent px-2 sm:px-2.5 py-1.5 text-base sm:text-xs text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading || isVoiceProcessing}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-40 cursor-pointer active:scale-95 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="flex items-center justify-between text-[9px] sm:text-[9.5px] text-slate-400 mt-1.5 sm:mt-2 px-1">
                  <span className="truncate pr-1">
                    {activePort ? `Synced with Tally Port ${activePort}` : '2-Way Tally Queue Active'}
                  </span>
                  <a
                    href="https://patwatoliai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors shrink-0"
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
      </div>
    )}
  </>
  )
}
