import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { AppWindow, WindowBounds } from '../data/types'

type AppWindowFrameProps = {
  win: AppWindow
  onFocus: (id: string) => void
  onMinimize: (id: string) => void
  onClose: (id: string) => void
  onBoundsChange: (id: string, bounds: WindowBounds) => void
  children?: React.ReactNode
}

export function AppWindowFrame({
  win,
  onFocus,
  onMinimize,
  onClose,
  onBoundsChange,
  children,
}: AppWindowFrameProps) {
  const mode = useRef<'drag' | 'resize' | null>(null)
  const start = useRef<{ x: number; y: number; bounds: WindowBounds }>({
    x: 0,
    y: 0,
    bounds: win.bounds,
  })

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!mode.current) return
    e.preventDefault()
    const { x, y, bounds } = start.current
    const dx = e.clientX - x
    const dy = e.clientY - y
    if (mode.current === 'drag') {
      onBoundsChange(win.id, {
        ...bounds,
        x: bounds.x + dx,
        y: bounds.y + dy,
      })
    } else {
      onBoundsChange(win.id, {
        ...bounds,
        width: Math.max(280, bounds.width + dx),
        height: Math.max(200, bounds.height + dy),
      })
    }
  }

  const endDrag = () => {
    mode.current = null
  }

  const beginDrag = (e: ReactPointerEvent) => {
    onFocus(win.id)
    mode.current = 'drag'
    start.current = { x: e.clientX, y: e.clientY, bounds: { ...win.bounds } }
  }

  const beginResize = (e: ReactPointerEvent) => {
    e.stopPropagation()
    onFocus(win.id)
    mode.current = 'resize'
    start.current = { x: e.clientX, y: e.clientY, bounds: { ...win.bounds } }
  }

  if (win.minimized) return null

  return (
    <div
      className="praxis-card absolute flex flex-col"
      style={{ left: win.bounds.x, top: win.bounds.y, width: win.bounds.width, height: win.bounds.height, zIndex: win.zIndex }}
      onPointerDown={() => onFocus(win.id)}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <div
        className="flex h-9 shrink-0 cursor-grab items-center justify-between border-b border-praxis-edge/70 px-3 active:cursor-grabbing"
        onPointerDown={beginDrag}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-praxis-text">{win.title}</span>
          <StatusDot status={win.status} />
        </div>
        <div className="flex items-center gap-1.5">
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

      <div className="relative flex-1 overflow-hidden rounded-b-xl bg-praxis-navy2/60">
        {children}
      </div>

      <div
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        onPointerDown={beginResize}
      />
    </div>
  )
}

function StatusDot({ status }: { status: AppWindow['status'] }) {
  const color =
    status === 'ready'
      ? 'bg-praxis-cyan'
      : status === 'error'
        ? 'bg-red-400'
        : status === 'building' || status === 'interpreting' || status === 'fixing'
          ? 'bg-praxis-violet animate-pulse-soft'
          : 'bg-praxis-edge'
  return <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
}

function CloseIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
