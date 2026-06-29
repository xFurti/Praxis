import type { AppWindow } from '../data/types'

type TaskbarProps = {
  windows: AppWindow[]
  onRestore: (id: string) => void
  onClose: (id: string) => void
}

export function Taskbar({ windows, onRestore, onClose }: TaskbarProps) {
  const minimized = windows.filter((w) => w.minimized)

  if (minimized.length === 0) return null

  return (
    <div className="pointer-events-auto absolute top-0 left-1/2 z-50 -translate-x-1/2 pt-2">
      <div className="flex items-center gap-2 rounded-2xl border border-praxis-edge/70 bg-praxis-navy2/90 px-3 py-2 backdrop-blur-md shadow-lg">
        {minimized.map((w) => (
          <div
            key={w.id}
            className="group flex items-center gap-2 rounded-xl border border-praxis-edge/50 bg-praxis-surface2/60 px-3 py-1.5 hover:border-praxis-cyan/40 hover:bg-praxis-surface2 transition-colors cursor-pointer"
            onClick={() => onRestore(w.id)}
          >
            <StatusDot status={w.status} />
            <span className="max-w-[120px] truncate text-xs text-praxis-text">{w.title}</span>
            <button
              className="ml-1 grid h-3.5 w-3.5 place-items-center rounded-full text-praxis-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onClose(w.id)
              }}
              aria-label={`Close ${w.title}`}
            >
              <svg width="7" height="7" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
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
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />
}
