export interface ToolCall {
  tool: string
  result: any
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  tool_calls?: ToolCall[]
  cached?: boolean
  audio_base64?: string
  transcription?: string
  detected_language?: string
  voice_used?: string
  card_type?: 'invoice' | 'receivables' | 'gst' | 'none'
  card_data?: any
}

export interface QueueItem {
  status: string
  command_type: string
  command_hash: string
  voucher_number?: string
  party_name?: string
  company: string
  payload: {
    type: string
    companyName: string
    payload: {
      voucher_type: string
      party_ledger: string
      date: string
      amount: number
      narration?: string
      items?: Array<{ name: string; quantity: number; rate: number; amount: number }>
      ledger_entries?: Array<{ ledger: string; amount: number }>
    }
  }
}

export interface TallyStatus {
  is_online: boolean
  tally_port: number | string | null
  agent_version: string
  last_ping?: string
  active_companies?: string[]
}

export interface TallyCompany {
  id: string
  name: string
  tally_guid: string
  is_active: boolean
}

export interface ActivityItem {
  id: string
  type: string
  title: string
  subtitle: string
  time: string
  badge: string
}

export interface ReceivableInvoice {
  number: string
  party: string
  amount: number
  due_date: string
}

export interface DashboardMetrics {
  company_name: string
  sales: {
    total: number
    change_pct: number
    period: string
    trend: number[]
  }
  receivables: {
    total: number
    count: number
    oldest_days: number
    invoices: ReceivableInvoice[]
  }
  payables: {
    total: number
    count: number
    period: string
  }
  gst_due: {
    total: number
    period: string
    gstr1_status: string
    gstr3b_status: string
  }
  recent_activity: ActivityItem[]
}
