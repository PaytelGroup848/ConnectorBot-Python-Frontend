import React from 'react'
import { Sparkles, ExternalLink, GripHorizontal, PlusCircle, RefreshCw, Minus, X } from 'lucide-react'
import type { TallyStatus } from '../../core/types'

interface WidgetHeaderProps {
  handleHeaderPointerDown: (e: React.PointerEvent) => void
  resetWindowPos: () => void
  tallyStatus: TallyStatus | null
  activePort: number | null
  handleNewChat: () => void
  checkStatus: () => Promise<void>
  isRefreshing: boolean
  setIsMinimized: (min: boolean) => void
  setIsOpen: (open: boolean) => void
}

export const WidgetHeader: React.FC<WidgetHeaderProps> = ({
  handleHeaderPointerDown,
  resetWindowPos,
  tallyStatus,
  activePort,
  handleNewChat,
  checkStatus,
  isRefreshing,
  setIsMinimized,
  setIsOpen,
}) => {
  return (
    <div
      onPointerDown={handleHeaderPointerDown}
      onDoubleClick={resetWindowPos}
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
  )
}
