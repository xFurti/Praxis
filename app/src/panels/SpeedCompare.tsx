type ProviderEntry = {
  id: string
  label: string
  tokenPerSec: number | null
  status: 'idle' | 'measuring' | 'done' | 'error'
  source?: 'live' | 'placeholder'
  multimodal?: boolean
}

type SpeedCompareProps = {
  providers?: ProviderEntry[]
  live?: boolean
  onProviderClick?: (providerId: 'fast' | 'slow', label: string) => void
  canPreview?: boolean
}

const DEFAULTS: ProviderEntry[] = [
  { id: 'fast', label: 'Gemma 4 31B', tokenPerSec: null, status: 'idle' },
  { id: 'slow', label: 'Qwen 3.5 35B', tokenPerSec: null, status: 'idle' },
]

export function SpeedCompare({ providers, live, onProviderClick, canPreview }: SpeedCompareProps) {
  const list = providers ?? DEFAULTS
  const maxTokSec = live
    ? Math.max(...list.map((p) => p.tokenPerSec ?? 0), 1)
    : 1

  return (
    <div className="praxis-card w-full p-4">
      <h3 className="praxis-display text-sm font-medium text-praxis-text">Speed Compare</h3>
      <div className="mt-3 space-y-2.5">
        {list.map((p) => {
          const pct =
            live && p.tokenPerSec
              ? Math.min(100, (p.tokenPerSec / maxTokSec) * 100)
              : 0
          const clickable = p.id === 'slow' && canPreview && Boolean(onProviderClick)
          return (
            <button
              key={p.id}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onProviderClick?.(p.id as 'slow', p.label)}
              className={`flex w-full items-center gap-3 text-sm text-left ${
                clickable ? 'cursor-pointer rounded-lg px-1 py-0.5 transition hover:bg-praxis-surface2/60' : 'cursor-default'
              }`}
              title={clickable ? 'Open a preview window with this model' : undefined}
            >
              <span className="w-28 text-praxis-muted text-[11px] leading-tight">{p.label}</span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-praxis-surface2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    p.id === 'fast' ? 'bg-tech-magic' : 'bg-praxis-violet/60'
                  } ${live && p.status === 'measuring' && (p.tokenPerSec ?? 0) > 0 ? 'animate-pulse' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className={`w-16 text-right font-mono text-[11px] ${
                  live && p.status === 'measuring' && (p.tokenPerSec ?? 0) > 0
                    ? 'text-praxis-cyan'
                    : 'text-praxis-muted/50'
                }`}
              >
                {!live
                  ? '—'
                  : p.status === 'error'
                    ? 'err'
                    : p.status === 'measuring' && (p.tokenPerSec == null || p.tokenPerSec === 0)
                      ? '...'
                      : p.tokenPerSec != null && p.tokenPerSec > 0
                        ? `${p.tokenPerSec} tok/s`
                        : '—'}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-praxis-muted/60">
        <p>
          {live
            ? 'Gemma builds the app · Qwen measured in background'
            : 'Metrics appear during generation'}
        </p>
        <p>{canPreview ? 'Click Qwen to preview' : ''}</p>
      </div>
    </div>
  )
}

export type { ProviderEntry }
