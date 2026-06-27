import { Logo } from './Logo'

export function TopBar() {
  return (
    <header className="relative z-30 flex h-12 items-center justify-between border-b border-praxis-edge/70 bg-praxis-navy2/70 px-4 backdrop-blur-md">
      <Logo />
      <div className="hidden items-center gap-2 sm:flex">
        <span className="praxis-chip">
          <span className="h-1.5 w-1.5 rounded-full bg-praxis-cyan animate-pulse-soft" />
          generative os
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-praxis-edge" />
        <span className="h-2.5 w-2.5 rounded-full bg-praxis-edge" />
        <span className="h-2.5 w-2.5 rounded-full bg-praxis-edge" />
      </div>
    </header>
  )
}
