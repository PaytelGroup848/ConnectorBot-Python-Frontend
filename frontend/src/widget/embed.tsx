import { createRoot } from 'react-dom/client'
import { CtrlBooksWidget } from './CtrlBooksWidget'
import styles from '../index.css?inline'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('ctrlbooks-ai-widget-styles')) return

  const styleTag = document.createElement('style')
  styleTag.id = 'ctrlbooks-ai-widget-styles'
  styleTag.textContent = styles
  document.head.appendChild(styleTag)
}

function initCtrlBooksWidget() {
  if (typeof document === 'undefined') return

  injectStyles()

  const CONTAINER_ID = 'ctrlbooks-ai-widget-root'
  let container = document.getElementById(CONTAINER_ID)
  if (!container) {
    container = document.createElement('div')
    container.id = CONTAINER_ID
    document.body.appendChild(container)
  }

  const root = createRoot(container)
  root.render(<CtrlBooksWidget />)
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCtrlBooksWidget)
  } else {
    initCtrlBooksWidget()
  }
}
