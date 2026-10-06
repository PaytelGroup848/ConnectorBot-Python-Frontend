import { useState, useRef, useEffect } from 'react'

export interface WidgetPosition {
  x: number
  y: number
}

const STORAGE_LAUNCHER_POS_KEY = 'ctrlbooks_widget_launcher_pos'
const STORAGE_WINDOW_POS_KEY = 'ctrlbooks_widget_window_pos'

export const useWidgetPosition = (
  setIsOpen: (open: boolean) => void,
  setIsMinimized: (min: boolean) => void
) => {
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

  const resetLauncherPos = () => {
    setLauncherPos(null)
    try {
      window.localStorage.removeItem(STORAGE_LAUNCHER_POS_KEY)
    } catch (e) {}
  }

  const resetWindowPos = () => {
    setWindowPos(null)
    try {
      window.localStorage.removeItem(STORAGE_WINDOW_POS_KEY)
    } catch (e) {}
  }

  return {
    launcherPos,
    setLauncherPos,
    windowPos,
    setWindowPos,
    launcherRef,
    windowRef,
    pillRef,
    handleLauncherPointerDown,
    handleMinimizedPointerDown,
    handleHeaderPointerDown,
    resetLauncherPos,
    resetWindowPos,
  }
}
