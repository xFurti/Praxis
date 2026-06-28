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
}

const DEFAULTS: ProviderEntry[] = [
  { id: 'fast', label: 'Gemma 4 31B', tokenPerSec: 0, status: 'idle' },
  { id: 'slow', label: 'Qwen 3.5 35B', tokenPerSec: 0, status: 'idle' },
]

export function SpeedCompare({ providers }: SpeedCompareProps) {
  const list = providers ?? DEFAULTS
  const usesLiveData = providers?.some((provider) => provider.source === 'live')
  const maxTokSec = Math.max(...list.map((p) => p.tokenPerSec ?? 0), 1)

  return (
    <div className="praxis-card w-full p-4">
      <h3 className="praxis-display text-sm font-medium text-praxis-text">Speed Compare</h3>
      <div className="mt-3 space-y-2.5">
        {list.map((p) => {
          const pct = p.tokenPerSec ? Math.min(100, (p.tokenPerSec / maxTokSec) * 100) : 0
          return (
            <div key={p.id} className="flex items-center gap-3 text-sm">
              <span className="w-28 text-praxis-muted text-[11px] leading-tight">{p.label}</span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-praxis-surface2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    p.id === 'fast' ? 'bg-tech-magic' : 'bg-praxis-violet/60'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-16 text-right font-mono text-[11px] text-praxis-text">
                {p.status === 'measuring'
                  ? '...'
                  : p.status === 'error'
                    ? 'err'
                  : p.tokenPerSec != null && p.tokenPerSec > 0
                    ? `${p.tokenPerSec} tok/s`
                    : '—'}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-praxis-muted/60">
        <p>{usesLiveData ? 'Live data from Cerebras' : 'Connect providers for live speed test'}</p>
        <p>{list.some((provider) => provider.multimodal) ? 'Multimodal' : 'Text-only'}</p>
      </div>
    </div>
  )
}

export type { ProviderEntry }
