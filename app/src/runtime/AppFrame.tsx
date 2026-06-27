import type { AppWindow } from '../data/types'

type AppFrameProps = {
  win: AppWindow
}

/**
 * Sandboxed runtime for generated apps. Generated HTML/CSS/JS is loaded into
 * an iframe via `srcdoc`, never injected into the shell DOM.
 */
export function AppFrame({ win }: AppFrameProps) {
  const building = win.status === 'building' || win.status === 'interpreting' || win.status === 'fixing'

  if (building && !win.html) {
    return <GenerationPlaceholder />
  }

  return (
    <div className="absolute inset-0">
      <iframe
        title={win.title}
        className="h-full w-full border-0 bg-white"
        srcDoc={win.html}
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
      />
      {building && (
        <div className="pointer-events-none absolute inset-0 praxis-streaming" aria-hidden="true" />
      )}
    </div>
  )
}

function GenerationPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-praxis-muted">
      <div className="h-2 w-2/3 overflow-hidden rounded-full bg-praxis-surface2">
        <div className="h-full w-1/3 praxis-streaming" />
      </div>
      <p className="text-xs">Writing your app…</p>
    </div>
  )
}
