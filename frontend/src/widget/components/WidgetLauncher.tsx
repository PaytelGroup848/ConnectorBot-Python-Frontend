import React from 'react'
import { Sparkles, Maximize2, X, ExternalLink } from 'lucide-react'
import type { TallyStatus } from '../../core/types'
import type { WidgetPosition } from '../hooks/useWidgetPosition'

interface WidgetLauncherProps {
  isOpen: boolean
  isMinimized: boolean
  launcherRef: React.RefObject<HTMLDivElement | null>
  pillRef: React.RefObject<HTMLDivElement | null>
  launcherPos: WidgetPosition | null
  launcherPosition: string
  tallyStatus: TallyStatus | null
  activePort: number | null
  handleLauncherPointerDown: (e: React.PointerEvent) => void
  handleMinimizedPointerDown: (e: React.PointerEvent) => void
  resetLauncherPos: () => void
  setIsMinimized: (min: boolean) => void
  setIsOpen: (open: boolean) => void
}

export const WidgetLauncher: React.FC<WidgetLauncherProps> = ({
  isOpen,
  isMinimized,
  launcherRef,
  pillRef,
  launcherPos,
  launcherPosition,
  tallyStatus,
  activePort,
  handleLauncherPointerDown,
  handleMinimizedPointerDown,
  resetLauncherPos,
  setIsMinimized,
  setIsOpen,
}) => {
  return (
    <>
      {/* 1. Closed State: Floating Action Launcher Button (Draggable) */}
      {!isOpen && (
        <div
          ref={launcherRef}
          onPointerDown={handleLauncherPointerDown}
          onDoubleClick={resetLauncherPos}
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
    </>
  )
}
