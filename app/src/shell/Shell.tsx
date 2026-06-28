import { useEffect, useState, useMemo, useRef } from 'react'
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
  const [liveTokens, setLiveTokens] = useState<{ fast: number; slow: number | null }>({ fast: 0, slow: null })
  const [isBuilding, setIsBuilding] = useState(false)

  // Listen for live tokens/sec updates from the generation pipeline
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { fast: number; slow: number | null }
      setLiveTokens(detail)
      setIsBuilding(true)
    }
    window.addEventListener('praxis-tokens', handler)
    return () => window.removeEventListener('praxis-tokens', handler)
  }, [])

  // Track building state — set true on prompt, reset on complete or timeout
  const resetBuilding = useRef<number | null>(null)
  const handlePromptWithTracking = (prompt: string, screenshot?: string) => {
    onPrompt?.(prompt)
    setIsBuilding(true)
    setLiveTokens({ fast: 0, slow: null })
    if (resetBuilding.current) clearTimeout(resetBuilding.current)
    resetBuilding.current = window.setTimeout(() => {
      setIsBuilding(false)
    }, 30000) // auto-reset after 30s max
    window.__praxisGenerate?.(prompt, screenshot)
  }

  // Reset building state when generation completes
  useEffect(() => {
    const handler = () => {
      setIsBuilding(false)
      if (resetBuilding.current) clearTimeout(resetBuilding.current)
    }
    window.addEventListener('praxis-build-complete', handler)
    return () => {
      window.removeEventListener('praxis-build-complete', handler)
      if (resetBuilding.current) clearTimeout(resetBuilding.current)
    }
  }, [])

  // Merge live tokens into provider list during build
  const effectiveProviders = useMemo(() => {
    if (!providers) return providers
    return providers.map((p) => {
      if (p.id === 'fast' && isBuilding && liveTokens.fast > 0) {
        return { ...p, tokenPerSec: liveTokens.fast, status: 'measuring' as const }
      }
      if (p.id === 'slow' && isBuilding && liveTokens.slow != null && liveTokens.slow > 0) {
        return { ...p, tokenPerSec: liveTokens.slow, status: 'measuring' as const }
      }
      return p
    })
  }, [providers, isBuilding, liveTokens])

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
            <SpeedCompare providers={effectiveProviders} />
          </div>
        </div>

        <PromptBar onSubmit={handlePromptWithTracking} multimodal={multimodal} />
      </main>
    </div>
  )
}
