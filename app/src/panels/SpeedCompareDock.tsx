import { useEffect, useState } from 'react'
import { SpeedCompare } from './SpeedCompare'
import type { ProviderEntry } from './SpeedCompare'

import type { BuildSummary } from '../runtime/generationEvents'

type SpeedCompareDockProps = {
  providers: ProviderEntry[]
  live?: boolean
  summary?: BuildSummary | null
  canPreview?: boolean
  onProviderClick?: (providerId: 'fast' | 'slow', label: string) => void
}

export function SpeedCompareDock({
  providers,
  live,
  summary,
  canPreview,
  onProviderClick,
}: SpeedCompareDockProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (live || (summary && !summary.failed)) {
      setOpen(true)
      return
    }
    setOpen(false)
  }, [live, summary])

  return (
    <div className="pointer-events-none absolute right-0 top-4 z-20 flex items-start">
      <div
        className={`pointer-events-auto flex items-stretch transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-[calc(100%-2.75rem)]'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`group relative flex w-11 shrink-0 flex-col items-center justify-center gap-2 rounded-l-2xl border border-r-0 border-praxis-hairline bg-praxis-glass-strong/85 py-4 shadow-float backdrop-blur-xl transition hover:border-praxis-cyan/40 ${
            live ? 'border-praxis-cyan/30' : ''
          }`}
          aria-expanded={open}
          aria-label={open ? 'Collapse Speed Compare' : 'Open Speed Compare'}
          title={open ? 'Hide Speed Compare' : 'Show Speed Compare'}
        >
          <span
            className={`grid h-7 w-7 place-items-center rounded-lg bg-praxis-cyan/10 transition-transform duration-300 group-hover:scale-105 ${
              live ? 'animate-pulse-soft' : ''
            }`}
          >
            <BoltIcon />
          </span>
          <ChevronIcon open={open} />
          {live && (
            <span className="absolute right-1 top-2 h-2 w-2 rounded-full bg-praxis-cyan" />
          )}
        </button>

        <div
          className={`w-72 overflow-hidden border border-praxis-hairline bg-praxis-glass-strong/80 shadow-float backdrop-blur-xl transition-all duration-300 ${
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <SpeedCompare
            providers={providers}
            live={live}
            summary={summary}
            canPreview={canPreview}
            onProviderClick={onProviderClick}
          />
        </div>
      </div>
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={`text-praxis-muted transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-180'}`}
      aria-hidden="true"
    >
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-praxis-cyan">
      <path
        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  )
}
