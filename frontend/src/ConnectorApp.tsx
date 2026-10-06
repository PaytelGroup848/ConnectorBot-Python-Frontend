import { useState, useEffect, useCallback } from 'react'
import { MockCtrlBooksPortal } from './views/MockCtrlBooksPortal'
import { Sidebar, type AdminTabId } from './views/Sidebar'
import { Header } from './views/Header'
import { AssistantView } from './views/AssistantView'
import { QueueView } from './views/QueueView'
import { TicketsView } from './views/TicketsView'
import { AdminLoginView } from './views/AdminLoginView'
import { Globe, ShieldAlert } from 'lucide-react'
import type { ChatMessage, QueueItem, TallyStatus, TallyCompany } from './core/types'
import { api } from './core/api'

export function ConnectorApp() {
  const [viewMode, setViewMode] = useState<'customer_portal' | 'admin_console'>('customer_portal')
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(window.localStorage.getItem('ctrlbooks_admin_token'))
    }
    return false
  })
  const [currentTab, setCurrentTab] = useState<AdminTabId>('tickets')
  const APP_STORAGE_CONV_KEY = 'ctrlbooks_app_conversation_id'
  const APP_STORAGE_MSGS_KEY = 'ctrlbooks_app_cached_messages'

  const defaultAppWelcomeMessage: ChatMessage = {
    id: 'welcome-msg',
    role: 'assistant',
    content:
      'Namaste! Main CtrlBooks AI Diagnostic Assistant hoon. Tally Prime ke sales invoices banane, GST queries, ya Support Ticket workflows test karne ke liye boliye ya type kijiye.',
    created_at: new Date().toISOString(),
  }

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem(APP_STORAGE_MSGS_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch (e) {
        console.warn('Failed to parse cached app messages', e)
      }
    }
    return [defaultAppWelcomeMessage]
  })
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [openTicketCount, setOpenTicketCount] = useState<number>(0)
  const [tallyStatus, setTallyStatus] = useState<TallyStatus | null>(null)
  const [companies, setCompanies] = useState<TallyCompany[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [conversationId, setConversationId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(APP_STORAGE_CONV_KEY) || undefined
    }
    return undefined
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const syncAppLocal = (newMsgs: ChatMessage[], newConvId?: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(APP_STORAGE_MSGS_KEY, JSON.stringify(newMsgs))
        if (newConvId) window.localStorage.setItem(APP_STORAGE_CONV_KEY, newConvId)
      } catch (e) {
        console.warn('Failed to sync app state locally', e)
      }
    }
  }

  const refreshOperationsData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [queueData, statusData, companiesData, ticketsData] = await Promise.allSettled([
        api.fetchQueue(),
        api.fetchTallyStatus(),
        api.fetchCompanies(),
        api.fetchAdminTickets(),
      ])

      if (queueData.status === 'fulfilled') setQueueItems(queueData.value)
      if (statusData.status === 'fulfilled') setTallyStatus(statusData.value)
      if (companiesData.status === 'fulfilled') {
        const comps = companiesData.value || []
        setCompanies(comps)
        if (comps.length > 0 && !selectedCompany) {
          const firstCompName = comps[0]?.name || (comps[0] as any)?.company_name
          if (firstCompName) setSelectedCompany(firstCompName)
        }
      }
      if (ticketsData.status === 'fulfilled') {
        const activeTickets = (ticketsData.value || []).filter(
          (t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
        )
        setOpenTicketCount(activeTickets.length)
      }
    } catch (err) {
      console.error('Operations refresh error:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [selectedCompany])

  useEffect(() => {
    refreshOperationsData()
  }, [refreshOperationsData])

  // Restore chat from database on mount
  useEffect(() => {
    let isCancelled = false
    const restoreAppConversation = async () => {
      try {
        const savedId = conversationId || (typeof window !== 'undefined' ? window.localStorage.getItem(APP_STORAGE_CONV_KEY) : null)
        if (savedId) {
          const detail = await api.fetchConversation(savedId)
          if (!isCancelled && detail && detail.messages && detail.messages.length > 0) {
            setMessages(detail.messages)
            syncAppLocal(detail.messages, savedId)
            return
          }
        }
        const latest = await api.fetchLatestConversation()
        if (!isCancelled && latest && latest.messages && latest.messages.length > 0) {
          setConversationId(latest.id)
          setMessages(latest.messages)
          syncAppLocal(latest.messages, latest.id)
        }
      } catch (err) {
        console.warn('Could not restore app chat from database:', err)
      }
    }
    restoreAppConversation()
    return () => {
      isCancelled = true
    }
  }, [])

  const handleSendMessage = async (text: string) => {
    if (currentTab !== 'assistant') setCurrentTab('assistant')

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    const withUser = [...messages, userMsg]
    setMessages(withUser)
    syncAppLocal(withUser, conversationId)
    setIsLoading(true)

    try {
      const res = await api.sendChatMessage(text, conversationId, selectedCompany)
      const nextConvId = res.conversation_id || conversationId
      if (res.conversation_id) setConversationId(res.conversation_id)
      const withAssistant = [...withUser, res.message]
      setMessages(withAssistant)
      syncAppLocal(withAssistant, nextConvId)
      if (res.tool_calls && res.tool_calls.length > 0) await refreshOperationsData()
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
      syncAppLocal(withErr, conversationId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendVoice = async (audioBlob: Blob, transcript?: string) => {
    if (currentTab !== 'assistant') setCurrentTab('assistant')
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
      syncAppLocal(withVoice, nextConvId)
      if (res.tool_calls && res.tool_calls.length > 0) await refreshOperationsData()
    } catch (err: any) {
      console.error('Voice chat error:', err)
      alert(`Voice error: ${err.message || 'Processing failed'}`)
    } finally {
      setIsVoiceProcessing(false)
    }
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans select-none overflow-hidden">
      {/* Environment Role Switcher Bar: Customer Portal vs Internal Staff Admin Console */}
      <div className="bg-slate-950 text-white px-6 py-2 flex items-center justify-between text-xs border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-2.5">
          <span className="px-2.5 py-0.5 rounded-md bg-[#00A3E0]/15 text-[#00A3E0] border border-[#00A3E0]/30 font-bold text-[10px] uppercase tracking-wider">
            Architecture Mode
          </span>
          <span className="text-slate-300 font-medium">
            {viewMode === 'customer_portal'
              ? 'Customer View: ctrlbooks.com with embedded Floating AI Assistant Widget'
              : 'Internal Staff View: Support Engineers & Admin SLA Operations Console'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('customer_portal')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'customer_portal'
                ? 'bg-[#00A3E0] text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Customer View (ctrlbooks.com + AI Widget)</span>
          </button>

          <button
            onClick={() => {
              setViewMode('admin_console')
              refreshOperationsData()
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'admin_console'
                ? 'bg-gradient-to-r from-[#00A3E0] to-[#5CBA46] text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Support & Admin Console (Staff Only)</span>
            {openTicketCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white text-slate-900 font-extrabold text-[10px]">
                {openTicketCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mode 1: Customer Experience on ctrlbooks.com (ONLY Floating AI Widget) */}
      {viewMode === 'customer_portal' ? (
        <div className="flex-1 overflow-y-auto min-h-0">
          <MockCtrlBooksPortal />
        </div>
      ) : !isAdminAuth ? (
        /* Mode 2 Auth Gate: Protected Staff Login */
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          <AdminLoginView
            onLoginSuccess={(adminData) => {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('ctrlbooks_admin_token', adminData.token)
              }
              setIsAdminAuth(true)
              refreshOperationsData()
            }}
            onCancel={() => setViewMode('customer_portal')}
          />
        </div>
      ) : (
        /* Mode 2: Internal Staff Support & Admin Operations Console */
        <div className="flex flex-1 overflow-hidden min-h-0">
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            ticketCount={openTicketCount}
            queueCount={queueItems.length}
          />

          <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 min-h-0">
            <Header
              tallyStatus={tallyStatus}
              companies={companies}
              selectedCompany={selectedCompany}
              onSelectCompany={setSelectedCompany}
              onToggleWidgetMode={() => setViewMode('customer_portal')}
              onRefresh={refreshOperationsData}
              isRefreshing={isRefreshing}
              userName="CtrlBooks Admin"
              userRole="Administrator"
              onLogout={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('ctrlbooks_admin_token')
                }
                setIsAdminAuth(false)
                setViewMode('customer_portal')
              }}
            />

            <main className="flex-1 overflow-y-auto min-h-0 bg-slate-50">
              {currentTab === 'tickets' && <TicketsView />}

              {currentTab === 'queue' && (
                <QueueView
                  queueItems={queueItems}
                  selectedCompany={selectedCompany}
                  onRefresh={refreshOperationsData}
                  isRefreshing={isRefreshing}
                />
              )}

              {currentTab === 'assistant' && (
                <AssistantView
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onSendVoice={handleSendVoice}
                  isLoading={isLoading}
                  isVoiceProcessing={isVoiceProcessing}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectorApp
