import { useEffect, useState } from 'react'

const BOOT_LINES = [
  'initializing agent mesh…',
  'connecting inference…',
  'loading multi-agent pipeline…',
  'preparing your desktop…',
]

const MIN_VISIBLE_MS = 2200
const FADE_MS = 520

type BootScreenProps = {
  onReady: () => void
}

export function BootScreen({ onReady }: BootScreenProps) {
  const [lineIndex, setLineIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const lineTimer = window.setInterval(() => {
      setLineIndex((index) => (index + 1) % BOOT_LINES.length)
    }, 520)

    const start = Date.now()
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - start
      const next = Math.min(100, Math.round((elapsed / MIN_VISIBLE_MS) * 100))
      setProgress(next)
    }, 40)

    const doneTimer = window.setTimeout(() => {
      setProgress(100)
      setFadeOut(true)
      window.setTimeout(onReady, FADE_MS)
    }, MIN_VISIBLE_MS)

    return () => {
      window.clearInterval(lineTimer)
      window.clearInterval(progressTimer)
      window.clearTimeout(doneTimer)
    }
  }, [onReady])

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-praxis-navy transition-all duration-500 ${
        fadeOut ? 'pointer-events-none scale-[1.02] opacity-0' : 'scale-100 opacity-100'
      }`}
      aria-live="polite"
      aria-busy={!fadeOut}
      role="status"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-aurora animate-aurora opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 75%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 praxis-vignette" aria-hidden="true" />

      <div className="relative flex w-full max-w-md flex-col items-center px-8 text-center animate-fade-up">
        <div className="relative mb-9 grid h-28 w-28 place-items-center">
          <span
            className="absolute inset-0 rounded-full border border-praxis-cyan/15"
            style={{ animation: 'creation-sigil 22s linear infinite' }}
            aria-hidden="true"
          />
          <span className="absolute inset-0 rounded-full bg-tech-magic/10 blur-2xl animate-pulse-soft" aria-hidden="true" />
          <span className="relative overflow-hidden rounded-2xl border border-praxis-hairline bg-praxis-glass-strong/90 p-1.5 shadow-float backdrop-blur-xl">
            <span className="block h-14 w-14 overflow-hidden rounded-xl">
              <img
                src="/praxis-logo.png"
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </span>
          </span>
        </div>

        <h1 className="praxis-display text-5xl font-bold tracking-[0.04em] text-praxis-text sm:text-6xl">
          Praxis
        </h1>
        <p className="mt-2.5 text-sm uppercase tracking-[0.32em] text-praxis-muted/80">
          Generative OS
        </p>

        <div className="mt-7 flex items-center gap-2 rounded-full border border-praxis-hairline bg-praxis-panel/70 px-3.5 py-1.5 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-praxis-cyan animate-pulse-soft" />
          <span className="text-[11px] text-praxis-muted">
            Powered by <span className="font-medium text-praxis-cyan">Cerebras</span>
            <span className="text-praxis-muted/70"> · Gemma 4 31B</span>
          </span>
        </div>

        <div className="mt-12 w-full">
          <div className="mb-2.5 flex items-center justify-between font-mono text-[10px] lowercase tracking-wider text-praxis-muted/70">
            <span className="min-h-[14px] animate-pulse-soft">{BOOT_LINES[lineIndex]}</span>
            <span>{progress}%</span>
          </div>
          <div className="relative h-1 overflow-hidden rounded-full bg-praxis-surface2/70">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-tech-magic praxis-streaming transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
