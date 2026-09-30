import { createRoot } from 'react-dom/client'
import { CtrlBooksWidget } from './CtrlBooksWidget'
import rawStyles from '../index.css?inline'

function getScopedStyles(rawCss: string): string {
  // 1. Remove @property rules that are not allowed or cause warnings inside shadow roots
  let css = rawCss
    .replace(/@property\s+--[\w-]+\s*\{[^}]*\}/g, '')
    .replace(/@layer properties\{@supports[^{]*\{/g, '@layer properties{@media all{')
    // 2. Map all :root variable declarations to :host so custom properties are active inside Shadow DOM
    .replace(/:root\b/g, ':host')
    // 3. Remove global body declarations from Tailwind / platform.css so they never affect host document
    .replace(/body\s*\{[^}]*\}/g, '')

  // 4. Bulletproof Shadow DOM Reset & Isolation Boundary:
  // - :host has all: initial to block styles leaking in from host site
  // - :host occupies zero layout space (fixed, 0x0) so it doesn't shift host layout
  // - pointer-events: none on host container allows clicking behind transparent areas
  // - #ctrlbooks-ai-widget-mount re-enables pointer-events for the widget UI
  const hostIsolationStyles = `
:host {
  all: initial;
  display: block !important;
  position: fixed !important;
  bottom: 0 !important;
  right: 0 !important;
  width: 0 !important;
  height: 0 !important;
  overflow: visible !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:host *, :host *::before, :host *::after {
  box-sizing: border-box;
}

#ctrlbooks-ai-widget-mount {
  pointer-events: auto !important;
}
`

  return hostIsolationStyles + '\n' + css
}

function initCtrlBooksWidget() {
  if (typeof document === 'undefined') return

  const HOST_ID = 'ctrlbooks-ai-widget-host'
  if (document.getElementById(HOST_ID)) return

  // 1. Detect the script tag that loaded this widget
  const script = (
    document.currentScript ||
    document.querySelector('script[data-api-url]') ||
    document.querySelector('script[src*="widget"]') ||
    document.querySelector('script[src*="ctrlbooks"]')
  ) as HTMLScriptElement | null

  // 2. Resolve Configuration from data-* attributes, window.CtrlBooksAI, or script origin
  const globalCfg = (window as any).CtrlBooksAI || {}
  const dataset = script?.dataset || {}

  let resolvedApiUrl = dataset.apiUrl || globalCfg.apiUrl
  if (!resolvedApiUrl && script?.src) {
    try {
      const u = new URL(script.src, window.location.href)
      if (u.origin && u.origin !== window.location.origin) {
        resolvedApiUrl = `${u.origin}/api/v1`
      }
    } catch (e) {}
  }
  if (!resolvedApiUrl) {
    resolvedApiUrl = 'http://210.56.147.234:8001/api/v1'
  }

  // Sync to window.CtrlBooksAI for API client and child components
  (window as any).CtrlBooksAI = {
    ...globalCfg,
    apiUrl: resolvedApiUrl,
    companyId: dataset.companyId || globalCfg.companyId,
    companyName: dataset.companyName || globalCfg.companyName,
    userName: dataset.userName || globalCfg.userName,
    userEmail: dataset.userEmail || globalCfg.userEmail,
    userPhone: dataset.userPhone || globalCfg.userPhone,
    tallyPort: dataset.tallyPort || globalCfg.tallyPort,
    authToken: dataset.authToken || dataset.token || globalCfg.authToken || globalCfg.connectorToken,
    position: dataset.position || globalCfg.position,
  }

  // 3. Create Host Element in DOM (Isolated from host website flow)
  const host = document.createElement('div')
  host.id = HOST_ID
  host.style.position = 'fixed'
  host.style.bottom = '0'
  host.style.right = '0'
  host.style.width = '0'
  host.style.height = '0'
  host.style.overflow = 'visible'
  host.style.zIndex = '2147483647'
  host.style.pointerEvents = 'none'

  // 4. Attach Shadow DOM (Open mode)
  const shadowRoot = host.attachShadow({ mode: 'open' })

  // 5. Inject Scoped Styles exclusively inside the Shadow DOM (Zero leak to host website)
  const styleTag = document.createElement('style')
  styleTag.id = 'ctrlbooks-ai-widget-styles'
  styleTag.textContent = getScopedStyles(rawStyles)
  shadowRoot.appendChild(styleTag)

  // 6. Create React Mount Container inside Shadow DOM
  const mount = document.createElement('div')
  mount.id = 'ctrlbooks-ai-widget-mount'
  mount.style.pointerEvents = 'auto'
  shadowRoot.appendChild(mount)

  // 7. Append host to document body
  document.body.appendChild(host)

  // 8. Mount React app inside Shadow DOM
  const root = createRoot(mount)
  root.render(
    <CtrlBooksWidget
      apiUrl={resolvedApiUrl}
      companyId={dataset.companyId || globalCfg.companyId}
      companyName={dataset.companyName || globalCfg.companyName}
      userName={dataset.userName || globalCfg.userName}
      userEmail={dataset.userEmail || globalCfg.userEmail}
      userPhone={dataset.userPhone || globalCfg.userPhone}
      tallyPort={dataset.tallyPort ? Number(dataset.tallyPort) : (globalCfg.tallyPort ? Number(globalCfg.tallyPort) : undefined)}
      authToken={dataset.authToken || dataset.token || globalCfg.authToken || globalCfg.connectorToken}
      positionClassName={dataset.position || globalCfg.position}
      initialOpen={dataset.initialOpen !== undefined ? dataset.initialOpen === 'true' : globalCfg.initialOpen}
    />
  )
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCtrlBooksWidget)
  } else {
    initCtrlBooksWidget()
  }
}
