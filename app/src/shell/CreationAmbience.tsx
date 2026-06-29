import type { AppWindow } from '../data/types'

type CreationAmbienceProps = {
  activeWindow?: AppWindow
}

export function CreationAmbience({ activeWindow }: CreationAmbienceProps) {
  if (!activeWindow) {
    return null
  }

  const cx = activeWindow.bounds.x + activeWindow.bounds.width / 2
  const cy = activeWindow.bounds.y + activeWindow.bounds.height / 2

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden="true">
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: cx, top: cy }}
      >
        <div
          className="h-[min(70vw,520px)] w-[min(70vw,520px)] animate-creation-aura rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(34,211,238,0.12) 0%, rgba(139,92,246,0.06) 35%, transparent 70%)',
          }}
        />
      </div>

      <div className="absolute inset-0 opacity-[0.05]">
        <div
          className="h-full w-full animate-creation-grid"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 70%)',
          }}
        />
      </div>
    </div>
  )
}
