import { TopBar } from './TopBar'
import { PromptBar } from './PromptBar'

type ShellProps = {
  onPrompt?: (prompt: string) => void
  children?: React.ReactNode
}

export function Shell({ onPrompt, children }: ShellProps) {
  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-praxis-navy">
      <TopBar />
      <main className="relative flex-1 overflow-hidden">
        {/* desktop surface where generated windows will live */}
        <div className="absolute inset-0">{children}</div>

        {/* empty-state hint, hidden once windows exist */}
        <DesktopHint />

        <PromptBar onSubmit={onPrompt} />
      </main>
    </div>
  )
}

function DesktopHint() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <p className="praxis-display text-2xl text-praxis-muted/60">
          Your desktop is empty.
        </p>
        <p className="mt-1 text-sm text-praxis-muted/50">
          Describe an app below to summon it onto the canvas.
        </p>
      </div>
    </div>
  )
}
