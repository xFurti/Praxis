import type { GenerationStatus } from '../data/types'

type StreamingOverlayProps = {
  status: GenerationStatus
}

export function StreamingOverlay({ status }: StreamingOverlayProps) {
  const label =
    status === 'fixing' ? 'Patching' : status === 'interpreting' ? 'Spec' : 'Compiling'

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-praxis-cyan/25 bg-praxis-glass-strong/70 px-2 py-0.5 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-praxis-cyan animate-pulse-soft" />
        <span className="font-mono text-[9px] uppercase tracking-wider text-praxis-cyan/90">
          {label}
        </span>
      </div>

      <Corner className="left-2 top-2 border-l border-t" />
      <Corner className="right-2 top-2 border-r border-t" />
      <Corner className="bottom-2 left-2 border-b border-l" />
      <Corner className="bottom-2 right-2 border-b border-r" />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-praxis-cyan/50 to-transparent animate-creation-scan" />
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
