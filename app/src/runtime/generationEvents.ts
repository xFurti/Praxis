export type AgentPhase = 'vision' | 'interpret' | 'verify' | 'build' | 'fix' | 'ready'

export type BuildSummary = {
  windowId: string
  durationMs: number
  timeToFirstHtmlMs: number | null
  fastTokPerSec: number
  slowTokPerSec: number | null
  multimodal: boolean
  failed?: boolean
  refined?: boolean
}

export function dispatchAgentPhase(phase: AgentPhase, multimodal = false) {
  window.dispatchEvent(new CustomEvent('praxis-agent-phase', { detail: { phase, multimodal } }))
}

export function dispatchBuildComplete(summary: BuildSummary) {
  window.dispatchEvent(new CustomEvent('praxis-build-complete', { detail: summary }))
}

export function formatDuration(ms: number) {
  if (ms < 1000) {
    return `${Math.max(1, Math.round(ms / 100) / 10)}s`
  }
  return `${(ms / 1000).toFixed(1)}s`
}
