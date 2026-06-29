import { useEffect, useState } from 'react'
import type { GenerationStatus } from '../data/types'

type GenerationPlaceholderProps = {
  status: GenerationStatus
}

const STATUS_COPY: Partial<Record<GenerationStatus, { label: string; hint: string }>> = {
  interpreting: { label: 'Interpreting your idea', hint: 'Vision agent → app spec' },
  building: { label: 'Writing your app', hint: 'Streaming HTML & logic' },
  verifying: { label: 'Fixer fitting the window', hint: 'Adjusting size to match your app' },
  fixing: { label: 'Repairing runtime', hint: 'Auto-fix in progress' },
}

const CODE_FRAGMENTS = [
  '<div class="app">',
  'function init() {',
  'const state = {',
  'render(<Canvas />)',
  'export default App',
  'addEventListener(',
  'grid-template:',
  'return compute()',
]

export function GenerationPlaceholder({ status }: GenerationPlaceholderProps) {
  const copy = STATUS_COPY[status] ?? STATUS_COPY.building!
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 2400)
    return () => window.clearInterval(id)
  }, [])

  const fragment = CODE_FRAGMENTS[tick % CODE_FRAGMENTS.length]

  return (
    <div className="absolute inset-0 overflow-hidden bg-praxis-navy2/90">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.12),transparent_55%)] animate-creation-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(139,92,246,0.1),transparent_50%)] animate-creation-pulse-reverse" />

      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="absolute h-px w-px rounded-full bg-praxis-cyan animate-creation-particle"
            style={{
              left: `${8 + ((i * 37) % 84)}%`,
              top: `${6 + ((i * 53) % 88)}%`,
              animationDelay: `${i * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex h-full flex-col items-center justify-center gap-5 px-6">
        {status === 'verifying' ? (
          <div className="relative h-28 w-28">
            <img
              src="/fixer_repairing.png"
              alt=""
              className="h-full w-full object-contain drop-shadow-[0_0_22px_rgba(139,92,246,0.4)] animate-creation-glow"
              draggable={false}
            />
          </div>
        ) : (
          <div className="relative grid h-28 w-28 place-items-center">
            <span className="absolute inset-0 rounded-full bg-tech-magic/10 blur-2xl animate-creation-glow" />
            <img
              src="/praxis-logo.png"
              alt=""
              className="absolute h-16 w-16 object-cover opacity-40 blur-[1px] animate-creation-glow"
              draggable={false}
            />
            <Sigil className="relative h-24 w-24 animate-creation-sigil" />
            <span className="absolute inset-0 animate-creation-orbit">
              <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-praxis-cyan shadow-glow" />
            </span>
            <span className="absolute inset-0 animate-creation-orbit-reverse">
              <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-praxis-violet shadow-glow-violet" />
            </span>
          </div>
        )}

        <div className="flex flex-col items-center gap-1 text-center">
          <p className="praxis-display text-sm font-medium text-praxis-text animate-creation-text">
            {copy.label}
            <span className="inline-flex w-6 justify-start">
              <span className="animate-creation-dots">…</span>
            </span>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-praxis-muted/80">
            {copy.hint}
          </p>
        </div>

        <div className="h-1 w-48 overflow-hidden rounded-full bg-praxis-surface2/80 ring-1 ring-praxis-edge/50">
          <div className="h-full w-2/5 rounded-full bg-tech-magic praxis-streaming" />
        </div>

        <p
          key={fragment}
          className="font-mono text-[10px] text-praxis-cyan/50 animate-creation-code"
          aria-hidden="true"
        >
          {fragment}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-praxis-cyan/10 to-transparent animate-creation-scan" />
    </div>
  )
}

function Sigil({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sigil-grad" x1="50" y1="0" x2="50" y2="100">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <polygon
        points="50,8 86,28 86,72 50,92 14,72 14,28"
        stroke="url(#sigil-grad)"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <circle cx="50" cy="50" r="4" fill="url(#sigil-grad)" className="animate-pulse-soft" />
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 60 - 90) * (Math.PI / 180)
        const x2 = 50 + Math.cos(angle) * 38
        const y2 = 50 + Math.sin(angle) * 38
        return (
          <line
            key={i}
            x1="50"
            y1="50"
            x2={x2}
            y2={y2}
            stroke="url(#sigil-grad)"
            strokeWidth="0.8"
            opacity="0.6"
          />
        )
      })}
      <circle cx="50" cy="50" r="22" stroke="url(#sigil-grad)" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.45" />
    </svg>
  )
}
