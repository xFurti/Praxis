import type { AppWindow } from '../data/types'

type AgentOverlayProps = {
  activeWindow?: AppWindow
}

export function AgentOverlay({ activeWindow }: AgentOverlayProps) {
  if (!activeWindow) {
    return null
  }

  const promptStyle = {
    left: '50%',
    bottom: '112px',
    transform: 'translateX(-50%)',
  } as const

  const builderStyle = {
    left: `${Math.max(24, activeWindow.bounds.x + activeWindow.bounds.width - 120)}px`,
    top: `${Math.max(24, activeWindow.bounds.y - 84)}px`,
  }

  const fixerStyle = {
    left: `${Math.max(24, activeWindow.bounds.x + activeWindow.bounds.width - 110)}px`,
    top: `${Math.max(24, activeWindow.bounds.y + 16)}px`,
  }

  const showInterpreter = activeWindow.status === 'interpreting' || activeWindow.status === 'building'
  const showBuilder = activeWindow.status === 'building'
  const showFixer = activeWindow.status === 'fixing' || activeWindow.status === 'verifying'

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {showInterpreter && (
        <div className="absolute praxis-agent praxis-agent-jump" style={promptStyle}>
          <InterpreterSprite talking={activeWindow.status === 'building'} />
        </div>
      )}

      {showBuilder && (
        <>
          <div className="absolute left-1/2 bottom-[168px] h-12 w-40 -translate-x-1/2 rounded-full border border-praxis-cyan/20 bg-gradient-to-r from-transparent via-praxis-cyan/30 to-transparent blur-sm" />
          <div className="absolute praxis-agent praxis-agent-bob" style={builderStyle}>
            <BuilderSprite />
          </div>
        </>
      )}

      {showFixer && (
        <div className="absolute praxis-agent praxis-agent-bob" style={fixerStyle}>
          <FixerSprite
            label={
              activeWindow.status === 'fixing'
                ? 'Patching UI…'
                : 'Fitting window…'
            }
          />
        </div>
      )}
    </div>
  )
}

function InterpreterSprite({ talking }: { talking: boolean }) {
  const src = talking ? '/interpreter_talking.png' : '/interpreter_idle.png'
  return (
    <div className="relative h-24 w-24">
      {talking && (
        <div className="absolute -right-8 -top-5 rounded-2xl border border-praxis-cyan/60 bg-praxis-navy2/95 px-2 py-1 text-[10px] text-praxis-cyan shadow-glow">
          {'spec -> builder'}
        </div>
      )}
      <img
        src={src}
        alt="Interpreter"
        className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.45)]"
      />
    </div>
  )
}

function BuilderSprite() {
  return (
    <div className="relative h-28 w-28">
      <img
        src="/builder_working.png"
        alt="Builder"
        className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.35)]"
      />
    </div>
  )
}

function FixerSprite({ label }: { label?: string }) {
  return (
    <div className="relative h-28 w-28">
      {label && (
        <div className="absolute -left-2 -top-6 whitespace-nowrap rounded-2xl border border-praxis-violet/60 bg-praxis-navy2/95 px-2.5 py-1 text-[10px] font-medium text-praxis-violet shadow-glow-violet">
          {label}
        </div>
      )}
      <img
        src="/fixer_repairing.png"
        alt="Fixer"
        className="h-full w-full object-contain drop-shadow-[0_0_22px_rgba(139,92,246,0.4)]"
      />
    </div>
  )
}
