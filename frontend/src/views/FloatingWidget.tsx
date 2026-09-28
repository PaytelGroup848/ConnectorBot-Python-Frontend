import { useState } from 'react'
import type { FormEvent } from 'react'
import { X, Send, FileText, Shield, BarChart3, Clock, Sparkles } from 'lucide-react'

interface FloatingWidgetProps {
  isOpen: boolean
  onClose: () => void
  onSendMessage: (text: string) => void
}

export const FloatingWidget = ({ isOpen, onClose, onSendMessage }: FloatingWidgetProps) => {
  const [input, setInput] = useState('')

  if (!isOpen) return null

  const suggestions = [
    { title: 'Create an invoice', icon: FileText, prompt: 'Naya sales invoice bana do' },
    { title: 'Ask about GST', icon: Shield, prompt: 'Mujhe GST return file karne ke liye kya documents chahiye?' },
    { title: 'Understand my reports', icon: BarChart3, prompt: 'Is month ki total sales aur pending receivables dikhao' },
    { title: 'Payment follow-up', icon: Clock, prompt: 'Kitne outstanding invoices pending hain?' },
  ]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    onSendMessage(input.trim())
    setInput('')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Widget Header matching Figma */}
      <div className="bg-linear-to-r from-emerald-700 to-teal-800 p-5 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">CtrlBooks AI</h4>
            <p className="text-xs text-emerald-100">How can I help you today?</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Options matching Figma */}
      <div className="p-4 space-y-2">
        {suggestions.map((sug, idx) => {
          const Icon = sug.icon
          return (
            <button
              key={idx}
              onClick={() => onSendMessage(sug.prompt)}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center space-x-3 text-left transition group"
            >
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 transition">
                {sug.title}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mini Bottom Input */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          <button type="submit" className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
