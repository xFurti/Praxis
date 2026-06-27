type ProviderEntry = {
  id: string
  label: string
  tokenPerSec: number | null
  status: 'idle' | 'measuring' | 'done' | 'error'
}

type SpeedCompareProps = {
  providers?: ProviderEntry[]
}

const DEFAULTS: ProviderEntry[] = [
  { id: 'fast', label: 'Fast provider', tokenPerSec: 120, status: 'done' },
  { id: 'slow', label: 'Slow provider', tokenPerSec: 45, status: 'done' },
]

export function SpeedCompare({ providers }: SpeedCompareProps) {
  const list = providers ?? DEFAULTS

  return (
    <div className="praxis-card w-full p-4">
      <h3 className="praxis-display text-sm font-medium text-praxis-text">Speed Compare</h3>
      <div className="mt-3 space-y-2">
        {list.map((p) => (
          <div key={p.id} className="flex items-center gap-3 text-sm">
            <span className="w-24 text-praxis-muted">{p.label}</span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-praxis-surface2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  p.id === 'fast' ? 'bg-tech-magic' : 'bg-praxis-edge'
                }`}
                style={{ width: `${p.tokenPerSec ? Math.min(100, (p.tokenPerSec / 150) * 100) : 0}%` }}
              />
            </div>
            <span className="w-16 text-right font-mono text-xs text-praxis-text">
              {p.status === 'measuring'
                ? '…'
                : p.tokenPerSec != null
                  ? `${p.tokenPerSec} tok/s`
                  : '—'}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-praxis-muted/70">
        {providers ? 'Live data' : 'Placeholder values — connect providers in CORE'}
      </p>
    </div>
  )
}

export type { ProviderEntry }
