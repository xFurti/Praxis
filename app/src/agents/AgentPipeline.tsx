import { useEffect, useMemo, useState } from 'react'
import type { AgentPhase } from '../runtime/generationEvents'

type StepState = 'idle' | 'active' | 'done'

type PipelineStep = {
  id: AgentPhase
  label: string
  short: string
  optional?: boolean
}

const STEPS: PipelineStep[] = [
  { id: 'vision', label: 'Vision', short: 'VIS', optional: true },
  { id: 'interpret', label: 'Interpreter', short: 'INT' },
  { id: 'verify', label: 'Verifier', short: 'VER' },
  { id: 'build', label: 'Builder', short: 'BLD' },
  { id: 'fix', label: 'Fixer', short: 'FIX', optional: true },
]

const ORDER: AgentPhase[] = ['vision', 'interpret', 'verify', 'build', 'fix', 'ready']

const PHASE_STATUS: Partial<Record<AgentPhase, string>> = {
  vision: 'Analyzing screenshot layout…',
  interpret: 'Writing structured app spec…',
  verify: 'Validating spec & intent…',
  build: 'Streaming UI on Cerebras…',
  fix: 'Patching layout & runtime…',
  ready: 'Pipeline complete',
}

export function AgentPipeline() {
  const [active, setActive] = useState(false)
  const [showVision, setShowVision] = useState(false)
  const [showFix, setShowFix] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<AgentPhase | null>(null)
  const [donePhases, setDonePhases] = useState<Set<AgentPhase>>(new Set())

  useEffect(() => {
    const onStart = () => {
      setActive(true)
      setShowVision(false)
      setShowFix(false)
      setCurrentPhase(null)
      setDonePhases(new Set())
    }

    const onPhase = (event: Event) => {
      const detail = (event as CustomEvent).detail as { phase?: AgentPhase; multimodal?: boolean }
      const phase = detail.phase
      if (!phase) return

      setActive(true)
      if (detail.multimodal) {
        setShowVision(true)
      }
      if (phase === 'fix') {
        setShowFix(true)
      }

      setCurrentPhase(phase)
      if (phase === 'ready') {
        setDonePhases(new Set(ORDER))
        window.setTimeout(() => setActive(false), 2800)
        return
      }

      const index = ORDER.indexOf(phase)
      if (index > 0) {
        setDonePhases(new Set(ORDER.slice(0, index)))
      }
    }

    const onComplete = () => {
      setCurrentPhase('ready')
      setDonePhases(new Set(ORDER))
      window.setTimeout(() => setActive(false), 2800)
    }

    window.addEventListener('praxis-build-start', onStart)
    window.addEventListener('praxis-agent-phase', onPhase)
    window.addEventListener('praxis-build-complete', onComplete)
    return () => {
      window.removeEventListener('praxis-build-start', onStart)
      window.removeEventListener('praxis-agent-phase', onPhase)
      window.removeEventListener('praxis-build-complete', onComplete)
    }
  }, [])

  const visibleSteps = STEPS.filter((step) => {
    if (step.id === 'vision') return showVision
    if (step.id === 'fix') return showFix
    return true
  })

  const activeIndex = useMemo(() => {
    if (!currentPhase || currentPhase === 'ready') {
      return visibleSteps.length - 1
    }
    const index = visibleSteps.findIndex((step) => step.id === currentPhase)
    return index >= 0 ? index : 0
  }, [currentPhase, visibleSteps])

  const progressPct =
    visibleSteps.length <= 1 ? 0 : Math.min(100, (activeIndex / (visibleSteps.length - 1)) * 100)

  if (!active) {
    return null
  }

  const statusLine =
    currentPhase && PHASE_STATUS[currentPhase]
      ? PHASE_STATUS[currentPhase]
      : 'Agents coordinating…'

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20 w-[min(100vw-2rem,420px)] animate-window-spawn">
      <div className="overflow-hidden rounded-2xl border border-praxis-hairline bg-praxis-glass-strong/85 shadow-float backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 border-b border-praxis-hairline px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-praxis-cyan opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-praxis-cyan" />
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-praxis-cyan">
              Agent mesh
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-praxis-muted/60">
            Cerebras · Gemma 4
          </span>
        </div>
        <p className="truncate px-4 pt-2 text-[11px] text-praxis-text/90">{statusLine}</p>

        <div className="relative px-4 pb-4 pt-3">
          <div className="absolute left-9 right-9 top-[26px] h-px bg-praxis-edge/50" aria-hidden="true" />
          <div
            className="absolute left-9 top-[25px] h-0.5 rounded-full bg-tech-magic transition-all duration-500 ease-out"
            style={{ width: `calc((100% - 4.5rem) * ${progressPct / 100})`, boxShadow: '0 0 12px rgba(34,211,238,0.5)' }}
            aria-hidden="true"
          />

          <div className="relative flex items-start justify-between gap-1">
            {visibleSteps.map((step) => {
              const state = stepState(step.id, currentPhase, donePhases)
              return (
                <div key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div
                    className={`relative grid h-9 w-9 place-items-center rounded-full border transition-all duration-300 ${
                      state === 'active'
                        ? 'border-praxis-cyan/70 bg-praxis-cyan/10'
                        : state === 'done'
                          ? 'border-praxis-violet/40 bg-tech-magic/10 text-praxis-text'
                          : 'border-praxis-edge/40 bg-praxis-navy/70 text-praxis-muted/45'
                    }`}
                  >
                    {state === 'done' ? (
                      <CheckIcon />
                    ) : (
                      <AgentIcon id={step.id} active={state === 'active'} />
                    )}
                  </div>
                  <p
                    className={`text-[10px] font-medium leading-tight ${
                      state === 'active'
                        ? 'text-praxis-cyan'
                        : state === 'done'
                          ? 'text-praxis-text'
                          : 'text-praxis-muted/55'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function stepState(step: AgentPhase, current: AgentPhase | null, done: Set<AgentPhase>): StepState {
  if (current === 'ready') return 'done'
  if (current === step) return 'active'
  if (done.has(step)) return 'done'
  return 'idle'
}

function AgentIcon({ id, active }: { id: AgentPhase; active: boolean }) {
  const className = active ? 'text-praxis-cyan' : 'text-praxis-muted/70'

  switch (id) {
    case 'vision':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'interpret':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 3l1.6 4.9H19l-4 2.9 1.5 4.9L12 13.8 7.5 15.7 9 10.8 5 7.9h5.4L12 3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'verify':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 3l8 4v5c0 4.4-3.2 8.5-8 9-4.8-.5-8-4.6-8-9V7l8-4z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M9.5 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'build':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M8 6h8M6 10h12M9 14h6M11 18h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'fix':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M14 7a3.5 3.5 0 00-4.9 4.9L4 15l1 1 4.9-5.1A3.5 3.5 0 0014 7z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-praxis-cyan" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
