import type { AppWindow } from '../data/types'
import { useInteraction } from '../windows/interactionContext'
import { GenerationPlaceholder } from './GenerationPlaceholder'
import { StreamingOverlay } from './StreamingOverlay'

type AppFrameProps = {
  win: AppWindow
}

/**
 * Sandboxed runtime for generated apps. Generated HTML/CSS/JS is loaded into
 * an iframe via `srcdoc`, never injected into the shell DOM.
 *
 * While any window is being dragged or resized, pointer events on ALL app
 * iframes are disabled so the iframe cannot swallow the drag/resize pointer
 * sequence. They are restored automatically when the interaction ends.
 */
export function AppFrame({ win }: AppFrameProps) {
  const { interacting } = useInteraction()
  const building =
    win.status === 'building' || win.status === 'interpreting' || win.status === 'fixing'
  const verifying = win.status === 'verifying'
  const showPlaceholder =
    (building && !win.html) || (verifying && !win.html) || win.status === 'interpreting'

  if (showPlaceholder) {
    return <GenerationPlaceholder status={verifying ? 'verifying' : win.status} />
  }

  const iframeKey =
    win.status === 'ready' || win.status === 'error' || verifying
      ? `${win.id}-final-${win.html.length}`
      : `${win.id}-streaming`

  return (
    <div className={`absolute inset-0 bg-praxis-navy2/50 ${win.fullscreen ? 'overflow-auto' : 'overflow-hidden'}`}>
      <iframe
        key={iframeKey}
        title={win.title}
        className={`w-full border-0 bg-praxis-navy ${win.fullscreen ? 'min-h-full' : 'h-full'}`}
        srcDoc={win.html}
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
        scrolling={win.fullscreen ? 'yes' : 'no'}
        style={{ pointerEvents: interacting ? 'none' : 'auto' }}
      />
      {building && win.html && <StreamingOverlay status={win.status} />}
      {verifying && (
        <div
          className="pointer-events-none absolute inset-0 bg-praxis-navy/10 ring-1 ring-inset ring-praxis-violet/20"
          aria-hidden="true"
        />
      )}
    </div>
  )
}
