import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './platform.css'
import { ConnectorApp } from './ConnectorApp'
import { ErrorBoundary } from './core/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConnectorApp />
    </ErrorBoundary>
  </StrictMode>,
)

