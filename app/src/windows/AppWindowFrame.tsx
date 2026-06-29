import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { AppWindow, WindowBounds } from '../data/types'
import { useInteraction } from './interactionContext'
import { WindowRefineBar } from './WindowRefineBar'

const MIN_DRAG_Y = 0
const CORNER_GRAB = 18

type AppWindowFrameProps = {
  win: AppWindow
  onFocus: (id: string) => void
  onMinimize: (id: string) => void
  onToggleFullscreen: (id: string) => void
  onClose: (id: string) => void
  onRefine?: (id: string, changeRequest: string) => void
  onBoundsChange: (id: string, bounds: WindowBounds) => void
  children?: React.ReactNode
}

export function AppWindowFrame({
  win,
  onFocus,
  onMinimize,
  onToggleFullscreen,
  onClose,
  onRefine,
  onBoundsChange,
  children,
}: AppWindowFrameProps) {
  const interaction = useInteraction()
  const dragging = useRef(false)
  const [refineOpen, setRefineOpen] = useState(false)
  const start = useRef<{ x: number; y: number; bounds: WindowBounds }>({
    x: 0,
    y: 0,
    bounds: win.bounds,
  })

  const move = (clientX: number, clientY: number) => {
    if (!dragging.current) return
    const { x, y, bounds } = start.current
    const dx = clientX - x
    const dy = clientY - y
    const maxX = Math.max(0, window.innerWidth - bounds.width)
    const maxY = Math.max(MIN_DRAG_Y, window.innerHeight - bounds.height)
    onBoundsChange(win.id, {
      ...bounds,
      x: Math.min(Math.max(0, bounds.x + dx), maxX),
      y: Math.min(Math.max(MIN_DRAG_Y, bounds.y + dy), maxY),
    })
  }

  const end = () => {
    if (!dragging.current) return
    dragging.current = false
    interaction.end()
  }

  const beginDrag = (e: ReactPointerEvent) => {
    if (win.fullscreen) return
    e.stopPropagation()
    e.preventDefault()
    onFocus(win.id)
    dragging.current = true
    start.current = { x: e.clientX, y: e.clientY, bounds: { ...win.bounds } }
    interaction.begin()

    const onMove = (ev: PointerEvent) => move(ev.clientX, ev.clientY)
    const onEnd = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
      end()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
  }

  useEffect(() => {
    if (!win.fullscreen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggleFullscreen(win.id)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [win.fullscreen, win.id, onToggleFullscreen])

  if (win.minimized) return null

  const isCreating =
    win.status === 'building' ||
    win.status === 'interpreting' ||
    win.status === 'verifying' ||
    win.status === 'fixing'
  const canRefine = win.status === 'ready' && Boolean(win.spec) && Boolean(onRefine)
  const canFullscreen = win.status === 'ready' || win.status === 'error'

  const handleRefineSubmit = (changeRequest: string) => {
    onRefine?.(win.id, changeRequest)
    setRefineOpen(false)
  }

  const cornerGrab = (position: string) =>
    `absolute z-20 cursor-grab touch-none opacity-0 active:cursor-grabbing ${position}`

  return (
    <div
      className={`praxis-card absolute flex flex-col animate-window-spawn ${
        win.fullscreen ? 'rounded-none shadow-2xl ring-1 ring-praxis-cyan/20' : ''
      } ${
        isCreating ? 'ring-1 ring-praxis-cyan/30 shadow-active' : ''
      }`}
      style={{ left: win.bounds.x, top: win.bounds.y, width: win.bounds.width, height: win.bounds.height, zIndex: win.zIndex }}
      onPointerDown={() => onFocus(win.id)}
    >
      <div
        className={`flex h-9 shrink-0 items-center justify-between border-b border-praxis-hairline bg-praxis-navy2/30 px-3 ${
          win.fullscreen ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        }`}
        onPointerDown={beginDrag}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-xs font-medium tracking-tight text-praxis-text">{win.title}</span>
          {win.status === 'ready' && win.buildMetrics && (
            <span className="hidden shrink-0 rounded-full border border-praxis-cyan/25 bg-praxis-cyan/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-praxis-cyan sm:inline">
              {formatWindowBuildTime(win.buildMetrics.durationMs)}
            </span>
          )}
          <StatusDot status={win.status} />
        </div>
        <div className="flex items-center gap-1.5">
          {canRefine && (
            <button
              type="button"
              className={`grid h-5 w-5 place-items-center rounded-md border border-praxis-hairline bg-praxis-panel/60 transition ${
                refineOpen
                  ? 'text-praxis-cyan ring-1 ring-praxis-cyan/30'
                  : 'text-praxis-muted hover:text-praxis-cyan'
              }`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                onFocus(win.id)
                setRefineOpen((open) => !open)
              }}
              aria-label="Edit interface"
              aria-expanded={refineOpen}
              title="Edit interface"
            >
              <EditIcon />
            </button>
          )}
          {canFullscreen && (
            <button
              type="button"
              className={`grid h-5 w-5 place-items-center rounded-md border border-praxis-hairline bg-praxis-panel/60 transition ${
                win.fullscreen
                  ? 'text-praxis-cyan ring-1 ring-praxis-cyan/30'
                  : 'text-praxis-muted hover:text-praxis-cyan'
              }`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                onFocus(win.id)
                onToggleFullscreen(win.id)
              }}
              aria-label={win.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              aria-pressed={win.fullscreen}
              title={win.fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
            >
              <FullscreenIcon expanded={win.fullscreen} />
            </button>
          )}
          <button
            className="grid h-5 w-5 place-items-center rounded-md border border-praxis-hairline bg-praxis-panel/60 text-praxis-muted transition hover:text-praxis-cyan"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onMinimize(win.id)}
            aria-label="Minimize"
          >
            <span className="block h-px w-2.5 bg-current" />
          </button>
          <button
            className="grid h-5 w-5 place-items-center rounded-md border border-praxis-hairline bg-praxis-panel/60 text-praxis-muted transition hover:text-red-400"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onClose(win.id)}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <WindowRefineBar
        open={refineOpen && canRefine}
        busy={isCreating}
        onClose={() => setRefineOpen(false)}
        onSubmit={handleRefineSubmit}
      />

      <div
        className={`relative flex-1 overflow-hidden bg-praxis-navy2/50 ${
          win.fullscreen ? 'rounded-none' : 'rounded-b-2xl'
        }`}
        style={{ boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.35)' }}
      >
        {children}
      </div>

      {!win.fullscreen &&
        (
          [
            { className: cornerGrab('left-0 top-0'), label: 'Drag window from top-left' },
            { className: cornerGrab('right-0 top-0'), label: 'Drag window from top-right' },
            { className: cornerGrab('left-0 bottom-0'), label: 'Drag window from bottom-left' },
            { className: cornerGrab('right-0 bottom-0'), label: 'Drag window from bottom-right' },
          ] as const
        ).map(({ className, label }) => (
          <div
            key={label}
            className={className}
            style={{ width: CORNER_GRAB, height: CORNER_GRAB }}
            onPointerDown={beginDrag}
            aria-label={label}
            title="Drag window"
          />
        ))}
    </div>
  )
}

function FullscreenIcon({ expanded }: { expanded: boolean }) {
  if (expanded) {
    return (
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 9H5V5M15 5h4v4M19 15v4h-4M5 15v4h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StatusDot({ status }: { status: AppWindow['status'] }) {
  const color =
    status === 'ready'
      ? 'bg-praxis-cyan'
      : status === 'error'
        ? 'bg-red-400'
        : status === 'building' || status === 'interpreting' || status === 'verifying' || status === 'fixing'
          ? 'bg-praxis-violet animate-pulse-soft'
          : 'bg-praxis-edge'
  return <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
}

function EditIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function formatWindowBuildTime(durationMs: number) {
  const seconds = durationMs / 1000
  return seconds < 10 ? `${seconds.toFixed(1)}s` : `${Math.round(seconds)}s`
}
