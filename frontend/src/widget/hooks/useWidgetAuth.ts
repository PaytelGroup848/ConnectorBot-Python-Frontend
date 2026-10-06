import { useState, useEffect } from 'react'
import type { ChatMessage } from '../../core/types'

interface UseWidgetAuthProps {
  authToken?: string
  resolvedUserEmail?: string
  forceShow?: boolean
  forceHide?: boolean
  defaultWelcomeMessage: ChatMessage
  setConversationId: (id: string | undefined) => void
  setMessages: (msgs: ChatMessage[]) => void
  setTicketsList: (tickets: any[]) => void
  WIDGET_STORAGE_CONV_KEY: string
}

export const useWidgetAuth = ({
  authToken,
  resolvedUserEmail,
  forceShow,
  forceHide,
  defaultWelcomeMessage,
  setConversationId,
  setMessages,
  setTicketsList,
  WIDGET_STORAGE_CONV_KEY,
}: UseWidgetAuthProps) => {
  const checkIsAllowed = () => {
    if (typeof window === 'undefined') return false
    if (forceShow === true) return true
    if (forceHide === true) return false
    const globalCfgObj = (window as any).CtrlBooksAI || {}
    if (globalCfgObj.forceShow === true) return true
    if (globalCfgObj.forceHide === true) return false
    if (globalCfgObj.requireAuth === false) return true

    const host = window.location.hostname || ''
    if (host === 'localhost' || host === '127.0.0.1' || host === 'aiassistant.ctrlbooks.com') {
      return true
    }

    const token =
      authToken ||
      globalCfgObj.authToken ||
      globalCfgObj.connectorToken ||
      window.localStorage.getItem('accessToken') ||
      window.localStorage.getItem('token') ||
      window.localStorage.getItem('web_token') ||
      window.localStorage.getItem('jwt')

    const hasToken = Boolean(
      token &&
      typeof token === 'string' &&
      token.trim() !== '' &&
      token !== 'undefined' &&
      token !== 'null'
    )

    // SaaS Auth Gate: Hide widget completely from unauthenticated guest / landing page visitors
    if (!hasToken) {
      return false
    }

    return true
  }

  const [isAllowed, setIsAllowed] = useState(checkIsAllowed)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateAllowed = () => {
      setIsAllowed(checkIsAllowed())
    }

    const handleAuthChange = (e: any) => {
      updateAllowed()
      if (!e.detail?.isAuthenticated) {
        setConversationId(undefined)
        setMessages([defaultWelcomeMessage])
        setTicketsList([])
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.removeItem('ctrlbooks_ai_session_token')
          } catch (err) {}
        }
      }
    }

    const handleCompanyChange = (e: any) => {
      const newComp = e.detail?.companyName || (window as any).CtrlBooksAI?.companyName
      if (newComp) {
        if (typeof window !== 'undefined') {
          const raw = resolvedUserEmail || (window as any).CtrlBooksAI?.userEmail || 'guest'
          const safe = String(raw).toLowerCase().replace(/[^a-z0-9_]/g, '_')
          window.localStorage.removeItem(`ctrlbooks_widget_conv_${safe}`)
          window.localStorage.removeItem(WIDGET_STORAGE_CONV_KEY)
        }
        setConversationId(undefined)
      }
    }

    window.addEventListener('popstate', updateAllowed)
    window.addEventListener('storage', updateAllowed)
    window.addEventListener('ctrlbooks:auth-changed', handleAuthChange)
    window.addEventListener('ctrlbooks:route-changed', updateAllowed)
    window.addEventListener('ctrlbooks:company-changed', handleCompanyChange)

    const interval = window.setInterval(updateAllowed, 500)
    return () => {
      window.removeEventListener('popstate', updateAllowed)
      window.removeEventListener('storage', updateAllowed)
      window.removeEventListener('ctrlbooks:auth-changed', handleAuthChange)
      window.removeEventListener('ctrlbooks:route-changed', updateAllowed)
      window.removeEventListener('ctrlbooks:company-changed', handleCompanyChange)
      window.clearInterval(interval)
    }
  }, [authToken, resolvedUserEmail])

  return { isAllowed }
}
