import { formatDuration, type BuildSummary } from '../runtime/generationEvents'

type BuildCompleteBannerProps = {
  summary: BuildSummary | null
}

export function BuildCompleteBanner({ summary }: BuildCompleteBannerProps) {
  if (!summary || summary.failed) {
    return null
  }

  const ttft = summary.timeToFirstHtmlMs != null ? formatDuration(summary.timeToFirstHtmlMs) : null

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2">
      <div className="animate-fade-up rounded-2xl border border-praxis-cyan/25 bg-praxis-glass-strong/85 px-5 py-3 shadow-float backdrop-blur-xl">
        <p className="text-center font-display text-base font-semibold tracking-tight text-praxis-text">
          Built in <span className="text-praxis-cyan">{formatDuration(summary.durationMs)}</span>
        </p>
        <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-praxis-muted/70">
          on Cerebras · {summary.fastTokPerSec > 0 ? `${summary.fastTokPerSec} tok/s` : 'Gemma 4 31B'}
          {summary.multimodal ? ' · multimodal' : ''}
          {ttft ? ` · first UI in ${ttft}` : ''}
          {summary.refined ? ' · refined' : ''}
        </p>
      </div>
    </div>
  )
}
