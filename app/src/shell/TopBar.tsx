import { Logo } from './Logo'

export function TopBar() {
  return (
    <header className="praxis-glass-bar relative z-30 flex h-12 items-center justify-between px-4">
      <Logo />
      <div className="pointer-events-none absolute inset-x-0 flex justify-center">
        <span className="praxis-chip border-praxis-cyan/20 text-praxis-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-praxis-cyan animate-pulse-soft" />
          Powered by <span className="font-medium text-praxis-cyan">Cerebras</span>
        </span>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-praxis-edge/70" />
        <span className="h-2 w-2 rounded-full bg-praxis-edge/70" />
        <span className="h-2 w-2 rounded-full bg-praxis-edge/70" />
      </div>
    </header>
  )
}
