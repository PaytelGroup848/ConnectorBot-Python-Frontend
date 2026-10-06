import type { ChatMessage, QueueItem, TallyStatus, DashboardMetrics, TallyCompany } from './types'

export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // 1. Check Vite Environment Variable (.env)
    const envUrl = (import.meta as any).env?.VITE_API_URL
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      if (window.location.port === '5173' && envUrl.includes('localhost:8001')) {
        return '/api/v1'
      }
      return envUrl.replace(/\/+$/, '')
    }

    // 2. Global window configuration
    const globalCfg = (window as any).CtrlBooksAI || {}
    if (globalCfg.apiUrl) return globalCfg.apiUrl.replace(/\/+$/, '')

    // 3. Embedded Script Tag Detection (widget.js)
    const script = document.querySelector('script[src*="widget.js"]') as HTMLScriptElement
    if (script) {
      if (script.dataset && script.dataset.apiUrl) {
        return script.dataset.apiUrl.replace(/\/+$/, '')
      }
      if (script.src) {
        try {
          const u = new URL(script.src)
          return `${u.origin}/api/v1`
        } catch (e) {}
      }
    }

    // 4. In local development with Vite proxy
    if (window.location.port === '5173') {
      return '/api/v1'
    }

    // 5. Automatic resolution for Port 3000 -> Port 8001 on same host
    if (window.location.port === '3000') {
      return `${window.location.protocol}//${window.location.hostname}:8001/api/v1`
    }
  }
  return '/api/v1'
}

const BASE_URL = {
  toString: () => getBaseUrl(),
}

let cachedAiSessionToken: string | null = null
let cachedForUserEmail: string | null = null
let cachedForConnectorToken: string | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('ctrlbooks:auth-changed', (e: any) => {
    if (!e.detail?.isAuthenticated) {
      cachedAiSessionToken = null
      cachedForUserEmail = null
      cachedForConnectorToken = null
      try {
        window.sessionStorage.removeItem('ctrlbooks_ai_session_token')
        window.localStorage.removeItem('ctrlbooks_admin_token')
      } catch (err) {}
    }
  })
}

export const api = {
  // Clear session token explicitly
  clearSession() {
    cachedAiSessionToken = null
    cachedForUserEmail = null
    cachedForConnectorToken = null
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem('ctrlbooks_ai_session_token')
        window.localStorage.removeItem('ctrlbooks_admin_token')
      } catch (err) {}
    }
  },

  // Resolve or exchange active authentication token for AI session
  async getAuthHeaders(options?: { isAdmin?: boolean }): Promise<Record<string, string>> {
    const headers: Record<string, string> = {}
    if (typeof window === 'undefined') return headers

    // 1. Only use Admin Console session token if explicitly requested by Admin operations
    if (options?.isAdmin) {
      const adminToken = window.localStorage.getItem('ctrlbooks_admin_token')
      if (adminToken && adminToken !== 'undefined' && adminToken !== 'null' && adminToken.trim() !== '') {
        headers['Authorization'] = `Bearer ${adminToken.trim()}`
        return headers
      }
    }

    const globalCfg = (window as any).CtrlBooksAI || {}
    const currentEmail = globalCfg.userEmail || ''
    const connectorToken =
      globalCfg.authToken ||
      globalCfg.connectorToken ||
      window.localStorage.getItem('accessToken') ||
      window.localStorage.getItem('token') ||
      window.localStorage.getItem('web_token') ||
      window.localStorage.getItem('jwt') ||
      ''

    // If active user or token changed, invalidate cached session immediately
    if (
      cachedAiSessionToken &&
      ((cachedForUserEmail && currentEmail && cachedForUserEmail !== currentEmail) ||
        (cachedForConnectorToken && connectorToken && cachedForConnectorToken !== connectorToken))
    ) {
      cachedAiSessionToken = null
      cachedForUserEmail = null
      cachedForConnectorToken = null
      try {
        window.sessionStorage.removeItem('ctrlbooks_ai_session_token')
      } catch (e) {}
    }

    if (!cachedAiSessionToken) {
      try {
        cachedAiSessionToken = window.sessionStorage.getItem('ctrlbooks_ai_session_token')
      } catch (e) {}
    }

    if (cachedAiSessionToken) {
      headers['Authorization'] = `Bearer ${cachedAiSessionToken}`
      return headers
    }

    if (connectorToken && connectorToken !== 'undefined' && connectorToken !== 'null' && connectorToken.trim() !== '') {
      try {
        const exchangeRes = await fetch(`${BASE_URL}/session/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connector_token: connectorToken.trim(),
            email: globalCfg.userEmail || undefined,
            name: globalCfg.userName || undefined,
          }),
        })
        if (exchangeRes.ok) {
          const exJson = await exchangeRes.json()
          if (exJson.data?.access_token) {
            cachedAiSessionToken = exJson.data.access_token
            cachedForUserEmail = currentEmail
            cachedForConnectorToken = connectorToken.trim()
            try {
              window.sessionStorage.setItem('ctrlbooks_ai_session_token', cachedAiSessionToken!)
            } catch (e) {}
            headers['Authorization'] = `Bearer ${cachedAiSessionToken}`
            return headers
          }
        }
      } catch (e) {}

      // Fallback: send connector token directly in headers
      headers['Authorization'] = `Bearer ${connectorToken.trim()}`
      headers['X-Connector-Token'] = connectorToken.trim()
    }

    return headers
  },

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
    const authHeaders = await this.getAuthHeaders()
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
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

    const authHeaders = await this.getAuthHeaders()
    const res = await fetch(`${BASE_URL}/voice/chat`, {
      method: 'POST',
      headers: { ...authHeaders },
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
    const authHeaders = await this.getAuthHeaders()
    const res = await fetch(`${BASE_URL}/connector/queue`, {
      headers: { ...authHeaders },
    })
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
    const authHeaders = await this.getAuthHeaders()
    const params = new URLSearchParams()
    if (companyName) params.set('company_name', companyName)
    if (userEmail) params.set('user_email', userEmail)
    if (tallyPort && tallyPort > 0) params.set('tally_port', String(tallyPort))
    const qs = params.toString() ? `?${params.toString()}` : ''

    const res = await fetch(`${BASE_URL}/connector/status${qs}`, {
      headers: { ...authHeaders },
    })
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
    const authHeaders = await this.getAuthHeaders()
    const res = await fetch(`${BASE_URL}/connector/dashboard/metrics?company_name=${encodeURIComponent(companyName)}`, {
      headers: { ...authHeaders },
    })
    if (!res.ok) throw new Error('Failed to load dashboard metrics')
    const json = await res.json()
    return json.data
  },

  // 6. Connected Tally Companies
  async fetchCompanies(): Promise<TallyCompany[]> {
    try {
      const authHeaders = await this.getAuthHeaders()
      const res = await fetch(`${BASE_URL}/connector/companies`, {
        headers: { ...authHeaders },
      })
      if (!res.ok) return []
      const json = await res.json()
      return json.data || []
    } catch (e) {
      return []
    }
  },

  // 7. Direct Sales Voucher Creation
  async createSalesVoucher(payload: {
    company_name?: string
    party_ledger: string
    date: string
    total_amount: number
    narration?: string
  }): Promise<any> {
    const authHeaders = await this.getAuthHeaders()
    const res = await fetch(`${BASE_URL}/connector/vouchers/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to create voucher')
    const json = await res.json()
    return json.data
  },

  // 8. Enterprise Support Tickets Queue & Engineer Actions
  async fetchAdminTickets(): Promise<any[]> {
    const authHeaders = await this.getAuthHeaders({ isAdmin: true })
    const res = await fetch(`${BASE_URL}/tickets`, {
      headers: { ...authHeaders },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data?.items || []
  },

  async fetchCustomerTickets(userEmail?: string, companyName?: string, conversationId?: string): Promise<any[]> {
    const authHeaders = await this.getAuthHeaders({ isAdmin: false })
    const sp = new URLSearchParams()
    if (userEmail && userEmail.trim()) sp.append('user_email', userEmail.trim())
    if (companyName && companyName.trim()) sp.append('company_name', companyName.trim())
    if (conversationId && conversationId.trim()) sp.append('conversation_id', conversationId.trim())
    const qs = sp.toString() ? `?${sp.toString()}` : ''
    const res = await fetch(`${BASE_URL}/tickets${qs}`, {
      headers: { ...authHeaders },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data?.items || []
  },

  async fetchTickets(userEmail?: string, companyName?: string): Promise<any[]> {
    return this.fetchCustomerTickets(userEmail, companyName)
  },

  async closeTicket(ticketId: string): Promise<any> {
    const authHeaders = await this.getAuthHeaders({ isAdmin: true })
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/close`, {
      method: 'POST',
      headers: { ...authHeaders },
    })
    if (!res.ok) throw new Error('Failed to close ticket')
    const json = await res.json()
    return json.data
  },

  async updateTicketAction(ticketId: string, status: string, reply?: string): Promise<any> {
    const authHeaders = await this.getAuthHeaders({ isAdmin: true })
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
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
  } | null> {
    const authHeaders = await this.getAuthHeaders()
    if (!authHeaders['Authorization']) return null
    const res = await fetch(`${BASE_URL}/conversations/${conversationId}`, {
      headers: { ...authHeaders },
    })
    if (!res.ok) return null
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
    const authHeaders = await this.getAuthHeaders()
    if (!authHeaders['Authorization']) return []
    const res = await fetch(`${BASE_URL}/conversations?page=1&page_size=${limit}`, {
      headers: { ...authHeaders },
    })
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

  // 11. My Entry Command Queue & Tally GST Verification
  async fetchMyEntries(
    companyId: string,
    params?: {
      type?: string
      voucherType?: string
      status?: string
      q?: string
      page?: number
      limit?: number
    }
  ): Promise<any> {
    const authHeaders = await this.getAuthHeaders()
    const sp = new URLSearchParams()
    if (params?.type) sp.append('type', params.type)
    if (params?.voucherType) sp.append('voucherType', params.voucherType)
    if (params?.status) sp.append('status', params.status)
    if (params?.q) sp.append('q', params.q)
    if (params?.page) sp.append('page', String(params.page))
    if (params?.limit) sp.append('limit', String(params.limit))
    const qs = sp.toString() ? `?${sp.toString()}` : ''

    const res = await fetch(`${BASE_URL}/connector/companies/${companyId}/commands${qs}`, {
      headers: { ...authHeaders },
    })
    if (!res.ok) return { success: false, items: [], total: 0 }
    const json = await res.json()
    return json.data || { success: false, items: [], total: 0 }
  },

  async deleteMyEntry(companyId: string, commandId: string): Promise<any> {
    const authHeaders = await this.getAuthHeaders()
    const res = await fetch(`${BASE_URL}/connector/companies/${companyId}/commands/${commandId}`, {
      method: 'DELETE',
      headers: { ...authHeaders },
    })
    if (!res.ok) return { success: false, message: 'Delete failed' }
    const json = await res.json()
    return json.data || { success: true }
  },

  async verifyGstin(gstin: string): Promise<any> {
    const authHeaders = await this.getAuthHeaders()
    const res = await fetch(`${BASE_URL}/connector/gstin/verify`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ gstin }),
    })
    if (!res.ok) return { success: false, is_valid: false }
    const json = await res.json()
    return json.data || { success: false, is_valid: false }
  },

  // 12. Parties & Customer/Supplier Module (GET /companies/:id/parties)
  async fetchParties(
    companyId: string,
    params?: {
      page?: number
      limit?: number
      q?: string
    }
  ): Promise<any> {
    const authHeaders = await this.getAuthHeaders()
    const sp = new URLSearchParams()
    if (params?.page) sp.append('page', String(params.page))
    if (params?.limit) sp.append('limit', String(params.limit))
    if (params?.q) sp.append('q', params.q)
    const qs = sp.toString() ? `?${sp.toString()}` : ''

    const res = await fetch(`${BASE_URL}/connector/companies/${companyId}/parties${qs}`, {
      headers: { ...authHeaders },
    })
    if (!res.ok) return { success: false, items: [], total: 0 }
    const json = await res.json()
    return json.data || { success: false, items: [], total: 0 }
  },
}

