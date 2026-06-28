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
  const showFixer = activeWindow.status === 'fixing'

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
          <FixerSprite />
        </div>
      )}
    </div>
  )
}

function InterpreterSprite({ talking }: { talking: boolean }) {
  return (
    <div className="relative h-24 w-24">
      {talking && (
        <div className="absolute -right-8 -top-5 rounded-2xl border border-praxis-cyan/60 bg-praxis-navy2/95 px-2 py-1 text-[10px] text-praxis-cyan shadow-glow">
          {'spec -> builder'}
        </div>
      )}
      <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-[0_0_20px_rgba(139,92,246,0.45)]">
        <ellipse cx="60" cy="108" rx="24" ry="6" fill="rgba(0,0,0,0.35)" />
        <circle cx="60" cy="34" r="18" fill="#d2bfd0" />
        <rect x="45" y="50" width="30" height="38" rx="14" fill="#44538e" />
        <circle cx="51" cy="35" r="10" fill="#22315b" stroke="#7ddffd" strokeWidth="3" />
        <circle cx="69" cy="35" r="10" fill="#22315b" stroke="#7ddffd" strokeWidth="3" />
        <circle cx="51" cy="35" r="5" fill="#7ddffd" />
        <circle cx="69" cy="35" r="5" fill="#7ddffd" />
        <path d="M35 56l-12 18" stroke="#44538e" strokeWidth="8" strokeLinecap="round" />
        <path d="M85 56l14 14" stroke="#44538e" strokeWidth="8" strokeLinecap="round" />
        <path d="M49 88l-10 16" stroke="#44538e" strokeWidth="8" strokeLinecap="round" />
        <path d="M71 88l8 14" stroke="#44538e" strokeWidth="8" strokeLinecap="round" />
        <path d="M26 40l18-12 10 10-12 18-16-2z" fill="rgba(139,92,246,0.3)" stroke="#8b5cf6" strokeWidth="3" />
        {talking && <circle cx="102" cy="70" r="4" fill="#22d3ee" className="praxis-agent-blink" />}
      </svg>
    </div>
  )
}

function BuilderSprite() {
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-[0_0_20px_rgba(34,211,238,0.35)]">
        <ellipse cx="60" cy="112" rx="24" ry="6" fill="rgba(0,0,0,0.35)" />
        <rect x="40" y="18" width="40" height="32" rx="14" fill="#394a7e" stroke="#22d3ee" strokeWidth="3" />
        <rect x="44" y="28" width="32" height="8" rx="4" fill="#7ddffd" />
        <rect x="38" y="48" width="44" height="40" rx="14" fill="#44538e" />
        <path d="M32 58l-10 20" stroke="#44538e" strokeWidth="10" strokeLinecap="round" />
        <path d="M88 58l14 22" stroke="#44538e" strokeWidth="10" strokeLinecap="round" />
        <path d="M47 88l-10 18" stroke="#44538e" strokeWidth="10" strokeLinecap="round" />
        <path d="M73 88l8 18" stroke="#44538e" strokeWidth="10" strokeLinecap="round" />
        <rect x="84" y="46" width="18" height="20" rx="6" fill="#1f2c52" stroke="#22d3ee" strokeWidth="2" />
        <path d="M93 56l13 18" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
        <path d="M105 72l7-2" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" className="praxis-agent-blink" />
        <rect x="86" y="74" width="24" height="18" rx="5" fill="rgba(34,211,238,0.16)" stroke="#22d3ee" strokeWidth="2" />
      </svg>
    </div>
  )
}

function FixerSprite() {
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 120 120" className="h-28 w-28 drop-shadow-[0_0_22px_rgba(139,92,246,0.4)]">
        <ellipse cx="60" cy="112" rx="22" ry="6" fill="rgba(0,0,0,0.35)" />
        <circle cx="60" cy="36" r="18" fill="#2c2c54" stroke="#8b5cf6" strokeWidth="3" />
        <rect x="44" y="54" width="32" height="34" rx="14" fill="#5c6ba3" />
        <path d="M34 60l-14 16" stroke="#7b8bc5" strokeWidth="8" strokeLinecap="round" />
        <path d="M86 60l18 8" stroke="#7b8bc5" strokeWidth="8" strokeLinecap="round" />
        <path d="M52 88l-8 16" stroke="#7b8bc5" strokeWidth="8" strokeLinecap="round" />
        <path d="M69 88l10 14" stroke="#7b8bc5" strokeWidth="8" strokeLinecap="round" />
        <path d="M70 42l28 -8" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
        <path d="M98 34l12 0" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round" className="praxis-agent-blink" />
        <path d="M56 34c6-8 15-8 21 0" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}
