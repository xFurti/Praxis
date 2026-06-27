import { TopBar } from './TopBar'
import { PromptBar } from './PromptBar'
import { Desktop } from './Desktop'

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
        <PromptBar onSubmit={handlePrompt} />
      </main>
    </div>
  )
}
