import { useEffect, useState, useMemo, useRef } from 'react'
import { TopBar } from './TopBar'
import { PromptBar } from './PromptBar'
import { Desktop } from './Desktop'
import { SpeedCompareDock } from '../panels/SpeedCompareDock'
import { BuildCompleteBanner } from './BuildCompleteBanner'
import { AgentPipeline } from '../agents/AgentPipeline'
import type { ProviderEntry } from '../panels/SpeedCompare'
import type { BuildSummary } from '../runtime/generationEvents'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

const SPEED_COMPARE_MODELS = [
  { id: 'fast' as const, label: 'Cerebras · Gemma 4 31B' },
  { id: 'slow' as const, label: 'Qwen 3.5 35B' },
]

const SUMMARY_VISIBLE_MS = 15000

type ShellProps = {
  onPrompt?: (prompt: string) => void
}

export function Shell({ onPrompt }: ShellProps) {
  const [multimodal, setMultimodal] = useState(false)
  const [liveTokens, setLiveTokens] = useState<{ fast: number; slow: number | null }>({ fast: 0, slow: null })
  const [isBuilding, setIsBuilding] = useState(false)
  const [lastBuildSummary, setLastBuildSummary] = useState<BuildSummary | null>(null)
  const generationActiveRef = useRef(false)
  const summaryTimerRef = useRef<number | null>(null)

  const resetBuilding = useRef<number | null>(null)

  const clearSummaryTimer = () => {
    if (summaryTimerRef.current != null) {
      window.clearTimeout(summaryTimerRef.current)
      summaryTimerRef.current = null
    }
  }

  const beginGenerationTracking = () => {
    generationActiveRef.current = true
    setIsBuilding(true)
    setLiveTokens({ fast: 0, slow: null })
    setLastBuildSummary(null)
    clearSummaryTimer()
    if (resetBuilding.current) clearTimeout(resetBuilding.current)
    resetBuilding.current = window.setTimeout(() => {
      generationActiveRef.current = false
      setIsBuilding(false)
      setLiveTokens({ fast: 0, slow: null })
    }, 30000)
  }

  const endGenerationTracking = (summary?: BuildSummary) => {
    generationActiveRef.current = false
    setIsBuilding(false)
    setLiveTokens({ fast: 0, slow: null })
    if (resetBuilding.current) clearTimeout(resetBuilding.current)

    clearSummaryTimer()
    if (summary && !summary.failed) {
      setLastBuildSummary(summary)
      summaryTimerRef.current = window.setTimeout(() => {
        setLastBuildSummary(null)
        summaryTimerRef.current = null
      }, SUMMARY_VISIBLE_MS)
    } else {
      setLastBuildSummary(null)
    }
  }

  useEffect(() => {
    const handler = (e: Event) => {
      if (!generationActiveRef.current) return

      const detail = (e as CustomEvent).detail as { fast?: number; slow?: number }
      setLiveTokens((prev) => ({
        fast: detail.fast != null && detail.fast > 0 ? detail.fast : prev.fast,
        slow: detail.slow != null && detail.slow > 0 ? detail.slow : prev.slow,
      }))
    }
    const onBuildStart = () => {
      beginGenerationTracking()
    }
    window.addEventListener('praxis-tokens', handler)
    window.addEventListener('praxis-build-start', onBuildStart)
    return () => {
      window.removeEventListener('praxis-tokens', handler)
      window.removeEventListener('praxis-build-start', onBuildStart)
    }
  }, [])

  const handlePromptWithTracking = (prompt: string, screenshot?: string) => {
    onPrompt?.(prompt)
    beginGenerationTracking()
    window.__praxisGenerate?.(prompt, screenshot)
  }

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as BuildSummary | undefined
      endGenerationTracking(detail)
    }
    window.addEventListener('praxis-build-complete', handler)
    return () => {
      window.removeEventListener('praxis-build-complete', handler)
      if (resetBuilding.current) clearTimeout(resetBuilding.current)
      clearSummaryTimer()
    }
  }, [])

  const [canPreview, setCanPreview] = useState(false)

  useEffect(() => {
    const handler = () => setCanPreview(Boolean(window.__praxisLastSpec))
    window.addEventListener('praxis-build-complete', handler)
    window.addEventListener('praxis-spec-ready', handler)
    return () => {
      window.removeEventListener('praxis-build-complete', handler)
      window.removeEventListener('praxis-spec-ready', handler)
    }
  }, [])

  const handleProviderClick = (providerId: 'fast' | 'slow', label: string) => {
    window.__praxisOpenProviderPreview?.(providerId, label)
  }

  const effectiveProviders = useMemo((): ProviderEntry[] => {
    if (!isBuilding) {
      return SPEED_COMPARE_MODELS.map((model) => ({
        ...model,
        tokenPerSec: null,
        status: 'idle' as const,
      }))
    }

    return [
      {
        id: 'fast',
        label: SPEED_COMPARE_MODELS[0].label,
        tokenPerSec: liveTokens.fast > 0 ? liveTokens.fast : null,
        status: 'measuring' as const,
        source: 'live' as const,
      },
      {
        id: 'slow',
        label: SPEED_COMPARE_MODELS[1].label,
        tokenPerSec: liveTokens.slow,
        status: 'measuring' as const,
        source: 'live' as const,
      },
    ]
  }, [isBuilding, liveTokens])

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

    void loadCapabilities()
  }, [])

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-praxis-navy">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-aurora animate-aurora opacity-80"
        aria-hidden="true"
      />
      <TopBar />
      <main className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-[1] praxis-vignette" aria-hidden="true" />
        <div className="absolute inset-0">
          <Desktop />
        </div>

        <AgentPipeline />
        <BuildCompleteBanner summary={lastBuildSummary} />

        <SpeedCompareDock
          providers={effectiveProviders}
          live={isBuilding}
          summary={lastBuildSummary}
          canPreview={canPreview}
          onProviderClick={handleProviderClick}
        />

        <PromptBar onSubmit={handlePromptWithTracking} multimodal={multimodal} />
      </main>
    </div>
  )
}
