import { useEffect, useState } from 'react'
import { TopBar } from './TopBar'
import { PromptBar } from './PromptBar'
import { Desktop } from './Desktop'
import { SpeedCompare } from '../panels/SpeedCompare'
import type { ProviderEntry } from '../panels/SpeedCompare'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

type ShellProps = {
  onPrompt?: (prompt: string) => void
}

export function Shell({ onPrompt }: ShellProps) {
  const [providers, setProviders] = useState<ProviderEntry[] | undefined>()
  const [multimodal, setMultimodal] = useState(false)

  const handlePrompt = (prompt: string, screenshot?: string) => {
    onPrompt?.(prompt)
    window.__praxisGenerate?.(prompt, screenshot)
  }

  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/provider-capabilities`)
        if (!res.ok) return
        const data = (await res.json()) as { multimodal?: boolean }
        setMultimodal(Boolean(data.multimodal))
      } catch {
        setMultimodal(false)
      }
    }

    const loadSpeedCompare = async () => {
      try {
        setProviders((prev) =>
          prev?.map((provider) => ({ ...provider, status: 'measuring' })) ?? prev,
        )
        const res = await fetch(`${API_BASE_URL}/api/speed-compare`)
        if (!res.ok) return
        const data = (await res.json()) as { providers?: ProviderEntry[] }
        setProviders(data.providers)
      } catch {
        setProviders((prev) => prev)
      }
    }

    void loadCapabilities()
    void loadSpeedCompare()
    const id = window.setInterval(() => {
      void loadSpeedCompare()
    }, 15000)

    return () => window.clearInterval(id)
  }, [])

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
            <SpeedCompare providers={providers} />
          </div>
        </div>

        <PromptBar onSubmit={handlePrompt} multimodal={multimodal} />
      </main>
    </div>
  )
}
