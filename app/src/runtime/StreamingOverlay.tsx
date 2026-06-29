import type { GenerationStatus } from '../data/types'

type StreamingOverlayProps = {
  status: GenerationStatus
}

export function StreamingOverlay({ status }: StreamingOverlayProps) {
  const label =
    status === 'fixing' ? 'Patching' : status === 'interpreting' ? 'Spec' : 'Compiling'

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-praxis-cyan/[0.04] via-transparent to-praxis-violet/[0.06]" />

      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-praxis-cyan/30 bg-praxis-navy/80 px-2 py-0.5 backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-praxis-cyan animate-pulse-soft" />
        <span className="font-mono text-[9px] uppercase tracking-wider text-praxis-cyan/90">
          {label}
        </span>
      </div>

      <Corner className="left-2 top-2 border-l border-t" />
      <Corner className="right-2 top-2 border-r border-t" />
      <Corner className="bottom-2 left-2 border-b border-l" />
      <Corner className="bottom-2 right-2 border-b border-r" />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-praxis-cyan/60 to-transparent animate-creation-scan" />
      <div className="absolute inset-x-0 h-16 animate-creation-beam bg-gradient-to-b from-praxis-cyan/25 via-praxis-cyan/5 to-transparent" />
    </div>
  )
}

function Corner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`absolute h-4 w-4 border-praxis-cyan/40 animate-creation-corner ${className}`}
    />
  )
}
