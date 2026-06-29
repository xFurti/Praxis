import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { AppWindow, WindowBounds } from '../data/types'
import { useInteraction } from './interactionContext'
import { WindowRefineBar } from './WindowRefineBar'

type AppWindowFrameProps = {
  win: AppWindow
  onFocus: (id: string) => void
  onMinimize: (id: string) => void
  onClose: (id: string) => void
  onRefine?: (id: string, changeRequest: string) => void
  onBoundsChange: (id: string, bounds: WindowBounds) => void
  children?: React.ReactNode
}

export function AppWindowFrame({
  win,
  onFocus,
  onMinimize,
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

  const move = (e: ReactPointerEvent) => {
    if (!dragging.current) return
    e.preventDefault()
    const { x, y, bounds } = start.current
    const dx = e.clientX - x
    const dy = e.clientY - y
    onBoundsChange(win.id, { ...bounds, x: bounds.x + dx, y: bounds.y + dy })
  }

  const end = () => {
    if (!dragging.current) return
    dragging.current = false
    interaction.end()
  }

  const beginDrag = (e: ReactPointerEvent) => {
    e.stopPropagation()
    onFocus(win.id)
    dragging.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY, bounds: { ...win.bounds } }
    interaction.begin()
  }

  if (win.minimized) return null

  const isCreating =
    win.status === 'building' ||
    win.status === 'interpreting' ||
    win.status === 'verifying' ||
    win.status === 'fixing'
  const canRefine = win.status === 'ready' && Boolean(win.spec) && Boolean(onRefine)

  const handleRefineSubmit = (changeRequest: string) => {
    onRefine?.(win.id, changeRequest)
    setRefineOpen(false)
  }

  return (
    <div
      className={`praxis-card absolute flex flex-col animate-window-spawn ${
        isCreating ? 'ring-1 ring-praxis-cyan/35 shadow-glow animate-drag-glow' : ''
      }`}
      style={{ left: win.bounds.x, top: win.bounds.y, width: win.bounds.width, height: win.bounds.height, zIndex: win.zIndex }}
      onPointerDown={() => onFocus(win.id)}
    >
      <div
        className="flex h-9 shrink-0 cursor-grab items-center justify-between border-b border-praxis-edge/70 px-3 active:cursor-grabbing"
        onPointerDown={beginDrag}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-praxis-text">{win.title}</span>
          <StatusDot status={win.status} />
        </div>
        <div className="flex items-center gap-1.5">
          {canRefine && (
            <button
              type="button"
              className={`grid h-4 w-4 place-items-center rounded-full bg-praxis-surface2 transition ${
                refineOpen
                  ? 'text-praxis-cyan shadow-glow'
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
          <button
            className="grid h-4 w-4 place-items-center rounded-full bg-praxis-surface2 text-praxis-muted hover:text-praxis-cyan"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onMinimize(win.id)}
            aria-label="Minimize"
          >
            <span className="block h-px w-2 bg-current" />
          </button>
          <button
            className="grid h-4 w-4 place-items-center rounded-full bg-praxis-surface2 text-praxis-muted hover:text-red-400"
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

      <div className="relative flex-1 overflow-hidden rounded-b-xl bg-praxis-navy2/60">
        {children}
      </div>
    </div>
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
