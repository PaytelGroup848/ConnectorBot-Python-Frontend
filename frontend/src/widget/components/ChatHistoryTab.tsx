import React, { useState } from 'react'
import { History, PlusCircle, Trash2, ArrowLeft, Search, MessageSquare, Clock, CheckCircle2, RefreshCw } from 'lucide-react'

export interface HistorySessionItem {
  id: string
  title: string
  updatedAt: string
  messageCount?: number
  firstMessage?: string
}

interface ChatHistoryTabProps {
  sessions: HistorySessionItem[]
  activeConversationId?: string
  loading: boolean
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
  onNewChat: () => void
  onBackToChat: () => void
  onRefresh: () => void
}

export const ChatHistoryTab: React.FC<ChatHistoryTabProps> = ({
  sessions,
  activeConversationId,
  loading,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  onBackToChat,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes}m ago`
      if (diffHours < 24) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays}d ago`
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return s.title.toLowerCase().includes(q) || (s.firstMessage && s.firstMessage.toLowerCase().includes(q))
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/70 select-none">
      {/* Top Controls Bar */}
      <div className="p-2.5 sm:p-3 bg-white border-b border-slate-200 flex flex-col gap-2 shrink-0 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <History className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Recent Sessions</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
              {sessions.length}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh sessions"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onNewChat}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {sessions.length > 2 && (
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past conversations..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-800 placeholder-slate-400 transition"
            />
          </div>
        )}
      </div>

      {/* Session Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2">
        {loading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
            <span className="text-xs font-medium">Loading chat history...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-2xs">
              <MessageSquare className="w-6 h-6 opacity-70" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              {searchQuery ? 'Koi matching chat nahi mili' : 'No Past Conversations Yet'}
            </h4>
            <p className="text-xs text-slate-500 max-w-[260px] mb-4">
              {searchQuery
                ? 'Search query badal kar dekhein ya nayi chat shuru karein.'
                : 'Aapki chats yahan auto-save hoti hain. Nayi chat shuru karke Tally Prime reports ya voucher create karein.'}
            </p>
            <button
              type="button"
              onClick={onNewChat}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Start New Chat</span>
            </button>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = activeConversationId === session.id
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-start justify-between p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50/90 border-emerald-300 shadow-xs'
                    : 'bg-white hover:bg-emerald-50/40 border-slate-200/80 hover:border-emerald-200 shadow-2xs'
                }`}
              >
                <div className="flex items-start space-x-2.5 min-w-0 flex-1 pr-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 border-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      <h4
                        className={`text-xs font-bold truncate leading-snug ${
                          isActive ? 'text-emerald-950 font-extrabold' : 'text-slate-800 group-hover:text-emerald-900'
                        }`}
                        title={session.title}
                      >
                        {session.title || 'Untitled Conversation'}
                      </h4>
                      {isActive && (
                        <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300 shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    {session.firstMessage && (
                      <p className="text-[11px] text-slate-500 truncate max-w-[220px] mb-1">
                        {session.firstMessage}
                      </p>
                    )}

                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <span className="flex items-center space-x-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatTimestamp(session.updatedAt)}</span>
                      </span>
                      {Boolean(session.messageCount && session.messageCount > 0) && (
                        <>
                          <span>•</span>
                          <span>{session.messageCount} msg{session.messageCount! > 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => onDeleteSession(session.id, e)}
                    title="Delete this session from history"
                    className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom Sticky Action Footer */}
      <div className="p-2 sm:p-2.5 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToChat}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Live Assistant</span>
        </button>

        <span className="text-[10px] text-slate-400 italic">
          Sessions auto-saved locally & in cloud
        </span>
      </div>
    </div>
  )
}
