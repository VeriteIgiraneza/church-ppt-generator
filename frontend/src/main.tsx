import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ControlView } from './presenter/ControlView'
import { DeckPreview } from './presenter/DeckPreview'
import { PlanEditor } from './presenter/PlanEditor'
import { RemoteView } from './presenter/RemoteView'
import { ScreenView } from './presenter/ScreenView'

/**
 * The ?view= parameter picks which window this is. Electron will open the
 * projector and control windows with these URLs, and the phone loads
 * ?view=remote. Anything else is the existing app.
 */
function Root() {
  const view = new URLSearchParams(window.location.search).get('view')
  if (view === 'preview') return <DeckPreview />
  if (view === 'plan') return <PlanEditor />
  if (view === 'control') return <ControlView />
  if (view === 'screen') return <ScreenView />
  if (view === 'remote') return <RemoteView />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)