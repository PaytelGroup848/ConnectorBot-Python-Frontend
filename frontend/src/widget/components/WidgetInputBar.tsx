import React from 'react'
import type { FormEvent } from 'react'
import { Send, ExternalLink } from 'lucide-react'
import { VoiceRecorder } from '../../views/VoiceRecorder'

interface WidgetInputBarProps {
  inputText: string
  setInputText: (text: string) => void
  handleSubmit: (e: FormEvent) => Promise<void>
  handleSendVoice: (audioBlob: Blob, transcript?: string) => Promise<void>
  isLoading: boolean
  isVoiceProcessing: boolean
  activePort: number | null
}

export const WidgetInputBar: React.FC<WidgetInputBarProps> = ({
  inputText,
  setInputText,
  handleSubmit,
  handleSendVoice,
  isLoading,
  isVoiceProcessing,
  activePort,
}) => {
  return (
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
  )
}
