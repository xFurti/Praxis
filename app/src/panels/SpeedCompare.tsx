type ProviderEntry = {
  id: string
  label: string
  tokenPerSec: number | null
  status: 'idle' | 'measuring' | 'done' | 'error'
  source?: 'live' | 'placeholder'
  multimodal?: boolean
}

import type { BuildSummary } from '../runtime/generationEvents'
import { formatDuration } from '../runtime/generationEvents'

type SpeedCompareProps = {
  providers?: ProviderEntry[]
  live?: boolean
  summary?: BuildSummary | null
  onProviderClick?: (providerId: 'fast' | 'slow', label: string) => void
  canPreview?: boolean
}

const DEFAULTS: ProviderEntry[] = [
  { id: 'fast', label: 'Cerebras · Gemma 4 31B', tokenPerSec: null, status: 'idle' },
  { id: 'slow', label: 'Qwen 3.5 35B', tokenPerSec: null, status: 'idle' },
]

export function SpeedCompare({ providers, live, summary, onProviderClick, canPreview }: SpeedCompareProps) {
  const list = providers ?? DEFAULTS
  const maxTokSec = live
    ? Math.max(...list.map((p) => p.tokenPerSec ?? 0), 1)
    : 1

  return (
    <div className="praxis-card w-full p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="praxis-display text-sm font-medium tracking-tight text-praxis-text">
            Speed Compare
          </h3>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-praxis-muted/60">
            Cerebras ultra-fast inference
          </p>
        </div>
        <span className="praxis-chip border-praxis-cyan/20 text-praxis-cyan">
          <span className="h-1.5 w-1.5 rounded-full bg-praxis-cyan" />
          live
        </span>
      </div>

      {summary && !live && !summary.failed && (
        <div className="mt-3 rounded-xl border border-praxis-cyan/20 bg-praxis-cyan/5 px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider text-praxis-muted/70">Last build</span>
            <span className="font-mono text-[10px] text-praxis-muted/60">
              {summary.multimodal ? 'multimodal · ' : ''}{summary.refined ? 'refined' : 'Cerebras'}
            </span>
          </div>
          <p className="mt-0.5 font-display text-xl font-semibold text-praxis-text">
            {formatDuration(summary.durationMs)}
            <span className="ml-1.5 text-xs font-normal text-praxis-muted">on Cerebras</span>
          </p>
          <p className="mt-1 font-mono text-[10px] text-praxis-muted">
            {summary.fastTokPerSec > 0 ? `${summary.fastTokPerSec} tok/s` : '—'}
            {summary.slowTokPerSec != null && summary.slowTokPerSec > 0
              ? ` · ${summary.slowTokPerSec} tok/s (Qwen)`
              : ''}
          </p>
        </div>
      )}

      <div className="mt-3 space-y-3">
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
              className={`flex w-full items-center gap-3 text-left ${
                clickable ? 'cursor-pointer rounded-lg px-1 py-0.5 transition hover:bg-praxis-surface2/50' : 'cursor-default'
              }`}
              title={clickable ? 'Open a preview window with this model' : undefined}
            >
              <div className="w-28 shrink-0">
                <p className={`text-[11px] font-medium leading-tight ${p.id === 'fast' ? 'text-praxis-cyan' : 'text-praxis-muted'}`}>
                  {p.label}
                </p>
                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-praxis-muted/55">
                  {p.id === 'fast' ? 'fast' : 'baseline'}
                </p>
              </div>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-praxis-surface2/70">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    p.id === 'fast' ? 'bg-praxis-cyan' : 'bg-praxis-violet/60'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className={`w-16 text-right font-mono text-[11px] ${
                  live && p.status === 'measuring' && (p.tokenPerSec ?? 0) > 0
                    ? 'text-praxis-text'
                    : 'text-praxis-muted/60'
                }`}
              >
                {!live
                  ? '—'
                  : p.status === 'error'
                    ? 'err'
                    : p.status === 'measuring' && (p.tokenPerSec == null || p.tokenPerSec === 0)
                      ? '...'
                      : p.tokenPerSec != null && p.tokenPerSec > 0
                        ? `${p.tokenPerSec}`
                        : '—'}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-praxis-hairline pt-2 text-[10px] text-praxis-muted/60">
        <p className="truncate">
          {live
            ? 'Cerebras builds · Qwen measured in background'
            : summary && !summary.failed
              ? 'Latest Cerebras run summary'
              : 'Metrics appear during generation'}
        </p>
        <p className="shrink-0">{canPreview ? 'Qwen → preview' : ''}</p>
      </div>
    </div>
  )
}

export type { ProviderEntry }
