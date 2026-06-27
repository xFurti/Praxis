import { TopBar } from './TopBar'
import { PromptBar } from './PromptBar'
import { Desktop } from './Desktop'
import { SpeedCompare } from '../panels/SpeedCompare'

type ShellProps = {
  onPrompt?: (prompt: string) => void
}

export function Shell({ onPrompt }: ShellProps) {
  const handlePrompt = (prompt: string) => {
    onPrompt?.(prompt)
    window.__praxisGenerate?.(prompt)
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-praxis-navy">
      <TopBar />
      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <Desktop />
        </div>

        {/* Speed Compare panel — floating top-right */}
        <div className="pointer-events-none absolute right-4 top-4 z-20 flex flex-col gap-3">
          <div className="pointer-events-auto w-72">
            <SpeedCompare />
          </div>
        </div>

        <PromptBar onSubmit={handlePrompt} />
      </main>
    </div>
  )
}
