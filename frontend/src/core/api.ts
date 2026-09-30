import type { ChatMessage, QueueItem, TallyStatus, DashboardMetrics, TallyCompany } from './types'

export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // 1. Global window configuration (highest priority for embedders)
    const globalCfg = (window as any).CtrlBooksAI || {}
    if (globalCfg.apiUrl) return globalCfg.apiUrl.replace(/\/+$/, '')

    // 2. Embedded Script Tag Detection (currentScript, data-api-url, or widget script patterns)
    const script = (
      document.currentScript ||
      document.querySelector('script[data-api-url]') ||
      document.querySelector('script[src*="widget"]') ||
      document.querySelector('script[src*="ctrlbooks"]')
    ) as HTMLScriptElement | null

    if (script) {
      if (script.dataset && script.dataset.apiUrl) {
        return script.dataset.apiUrl.replace(/\/+$/, '')
      }
      if (script.src) {
        try {
          const u = new URL(script.src, window.location.href)
          if (u.origin && u.origin !== window.location.origin) {
            return `${u.origin}/api/v1`
          }
        } catch (e) {}
      }
    }

    // 3. Check Vite Environment Variable (.env)
    const envUrl = (import.meta as any).env?.VITE_API_URL
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      if (window.location.port === '5173' && envUrl.includes('localhost:8001')) {
        return '/api/v1'
      }
      return envUrl.replace(/\/+$/, '')
    }

    // 4. In local development with Vite proxy (only for internal admin dashboard itself)
    const isEmbeddedWidget = Boolean(
      document.getElementById('ctrlbooks-ai-widget-host') ||
      document.getElementById('ctrlbooks-ai-widget-root') ||
      script
    )

    if (window.location.port === '5173' && !isEmbeddedWidget) {
      return '/api/v1'
    }

    // 5. Automatic resolution for aiassistant.ctrlbooks.com
    if (window.location.hostname === 'aiassistant.ctrlbooks.com') {
      return '/api/v1'
    }

    if (window.location.port === '3000') {
      return `${window.location.protocol}//${window.location.hostname}:8001/api/v1`
    }

    // 6. External Host Fallback: default to official cloud backend if embedded on customer/host site
    if (isEmbeddedWidget) {
      return 'https://aiassistant.ctrlbooks.com/api/v1'
    }
  }
  return '/api/v1'
}

const BASE_URL = {
  toString: () => getBaseUrl(),
}

export const api = {
  // 1. Text Chat Endpoint
  async sendChatMessage(
    message: string,
    conversationId?: string,
    companyName?: string,
    userMeta?: {
      userName?: string
      userEmail?: string
      userPhone?: string
      tallyPort?: number
      companyId?: string
      connectorToken?: string
    }
  ): Promise<{
    message: ChatMessage
    conversation_id: string
    tool_calls?: any[]
  }> {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        company_name: companyName || undefined,
        company_id: userMeta?.companyId || undefined,
        connector_token: userMeta?.connectorToken || undefined,
        user_name: userMeta?.userName || undefined,
        user_email: userMeta?.userEmail || undefined,
        user_phone: userMeta?.userPhone || undefined,
        tally_port: userMeta?.tallyPort || undefined,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || err.error?.message || `HTTP ${res.status}`)
    }

    const json = await res.json()
    const data = json.data

    // Detect card type for rich visualization
    let cardType: 'invoice' | 'receivables' | 'gst' | 'none' = 'none'
    let cardData: any = null

    if (data.tool_calls && data.tool_calls.length > 0) {
      const vTool = data.tool_calls.find(
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

    return {
      message: {
        id: data.message_id || `msg_${Date.now()}`,
        role: data.role || 'assistant',
        content: data.content,
        created_at: new Date().toISOString(),
        tool_calls: data.tool_calls,
        cached: data.cached,
        detected_language: data.detected_language || 'English',
        voice_used: data.recommended_voice,
        card_type: cardType,
        card_data: cardData,
      },
      conversation_id: data.conversation_id,
      tool_calls: data.tool_calls,
    }
  },

  // 2. End-to-End Voice Chat (Audio In -> Auto-LID & Reason -> Native Neural TTS Audio Out)
  async sendVoiceChat(
    audioBlob: Blob,
    conversationId?: string,
    voice: string = 'auto',
    transcript?: string
  ): Promise<{
    transcription: string
    response_text: string
    audio_base64: string
    conversation_id: string
    detected_language?: string
    voice_used?: string
    tool_calls?: any[]
  }> {
    const formData = new FormData()
    formData.append('file', audioBlob, 'speech.webm')
    if (conversationId) formData.append('conversation_id', conversationId)
    formData.append('voice', voice)
    if (transcript && transcript.trim()) {
      formData.append('text_prompt', transcript.trim())
    }

    const res = await fetch(`${BASE_URL}/voice/chat`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || err.error?.message || `HTTP ${res.status}`)
    }

    const json = await res.json()
    const d = json.data || {}
    return {
      transcription: d.transcription || d.user_text || transcript || '(Audio Speech)',
      response_text: d.response_text || d.assistant_text || '',
      audio_base64: d.audio_base64 || '',
      conversation_id: d.conversation_id,
      detected_language: d.detected_language || 'English',
      voice_used: d.voice_used || 'en-IN-PrabhatNeural',
      tool_calls: d.tool_calls || [],
    }
  },

  // 3. CtrlBooks 2-Way Queue
  async fetchQueue(): Promise<QueueItem[]> {
    const res = await fetch(`${BASE_URL}/connector/queue`)
    if (!res.ok) throw new Error('Failed to load queue')
    const json = await res.json()
    return json.data?.items || []
  },

  // 4. Live Tally Connection Status (Dynamic Port Discovery)
  async fetchTallyStatus(
    companyName?: string,
    userEmail?: string,
    tallyPort?: number
  ): Promise<TallyStatus> {
    const params = new URLSearchParams()
    if (companyName) params.set('company_name', companyName)
    if (userEmail) params.set('user_email', userEmail)
    if (tallyPort && tallyPort > 0) params.set('tally_port', String(tallyPort))
    const qs = params.toString() ? `?${params.toString()}` : ''

    const res = await fetch(`${BASE_URL}/connector/status${qs}`)
    if (!res.ok) {
      return {
        is_online: false,
        tally_port: tallyPort || null,
        agent_version: '1.0.1',
        last_ping: new Date().toISOString(),
      }
    }
    const json = await res.json()
    return json.data
  },

  // 5. Dashboard Metrics & KPIs
  async fetchDashboardMetrics(companyName: string = ''): Promise<DashboardMetrics> {
    const res = await fetch(`${BASE_URL}/connector/dashboard/metrics?company_name=${encodeURIComponent(companyName)}`)
    if (!res.ok) throw new Error('Failed to load dashboard metrics')
    const json = await res.json()
    return json.data
  },

  // 6. Connected Tally Companies
  async fetchCompanies(): Promise<TallyCompany[]> {
    const res = await fetch(`${BASE_URL}/connector/companies`)
    if (!res.ok) throw new Error('Failed to load companies')
    const json = await res.json()
    return json.data || []
  },

  // 7. Direct Sales Voucher Creation
  async createSalesVoucher(payload: {
    company_name?: string
    party_ledger: string
    date: string
    total_amount: number
    narration?: string
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/connector/vouchers/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to create voucher')
    const json = await res.json()
    return json.data
  },

  // 8. Enterprise Support Tickets Queue & Engineer Actions
  async fetchTickets(): Promise<any[]> {
    const headers: Record<string, string> = {}
    if (typeof window !== 'undefined') {
      const token =
        window.localStorage.getItem('token') ||
        window.localStorage.getItem('accessToken') ||
        window.localStorage.getItem('web_token') ||
        window.localStorage.getItem('jwt')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    const res = await fetch(`${BASE_URL}/tickets`, { headers })
    if (!res.ok) return []
    const json = await res.json()
    return json.data?.items || []
  },

  async closeTicket(ticketId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/close`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error('Failed to close ticket')
    const json = await res.json()
    return json.data
  },

  async updateTicketAction(ticketId: string, status: string, reply?: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reply }),
    })
    if (!res.ok) throw new Error('Failed to update ticket')
    const json = await res.json()
    return json.data
  },

  // 9. Database-Backed Chat Persistence & Conversations
  async fetchConversation(conversationId: string): Promise<{
    id: string
    title: string
    messages: ChatMessage[]
  }> {
    const res = await fetch(`${BASE_URL}/conversations/${conversationId}`)
    if (!res.ok) throw new Error('Failed to load conversation')
    const json = await res.json()
    const d = json.data || {}
    const rawMessages = d.messages || []

    const formattedMessages: ChatMessage[] = rawMessages.map((m: any) => {
      let cardType: 'invoice' | 'receivables' | 'gst' | 'none' = 'none'
      let cardData: any = null
      const tools = Array.isArray(m.tool_metadata)
        ? m.tool_metadata
        : m.tool_metadata
        ? [m.tool_metadata]
        : []

      const vTool = tools.find(
        (t: any) =>
          t.tool === 'create_sales_invoice_command' ||
          t.tool === 'create_receipt_voucher_command' ||
          t.tool === 'get_company_vouchers_command'
      )
      if (vTool) {
        cardType = 'invoice'
        cardData = vTool.result
      }

      return {
        id: m.id || `msg_${Date.now()}_${Math.random()}`,
        role: m.role || 'assistant',
        content: m.content || '',
        created_at: m.created_at || new Date().toISOString(),
        tool_calls: tools.length > 0 ? tools : undefined,
        card_type: cardType,
        card_data: cardData,
      }
    })

    return {
      id: d.id,
      title: d.title,
      messages: formattedMessages,
    }
  },

  async fetchRecentConversations(limit: number = 10): Promise<Array<{ id: string; title: string; created_at: string }>> {
    const res = await fetch(`${BASE_URL}/conversations?page=1&page_size=${limit}`)
    if (!res.ok) return []
    const json = await res.json()
    return json.data?.items || []
  },

  async fetchLatestConversation(): Promise<{ id: string; title: string; messages: ChatMessage[] } | null> {
    const recents = await this.fetchRecentConversations(1)
    if (!recents || recents.length === 0) return null
    return this.fetchConversation(recents[0].id)
  },

  // 10. Administrator Console Authentication
  async adminLogin(email: string, password: string): Promise<{ token: string; user: any }> {
    const res = await fetch(`${BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || json.detail || 'Invalid administrator credentials')
    }
    return json.data
  },
}
