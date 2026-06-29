import type { AppSpec } from '../data/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export type SizeHint = { width: number; height: number; samples: number }

let cachedHints: Record<string, SizeHint> | null = null
let loadPromise: Promise<void> | null = null

export function primeLearnedSizes() {
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/learn/sizes`)
      if (!res.ok) return
      const data = (await res.json()) as { hints?: Record<string, SizeHint> }
      cachedHints = data.hints ?? {}
    } catch {
      cachedHints = {}
    }
  })()

  return loadPromise
}

export function getLearnedSizeForCategory(category: string): SizeHint | undefined {
  return cachedHints?.[category]
}

export function deriveCategoryFromSpec(spec: AppSpec): string {
  const text = `${spec.app_name} ${spec.description} ${spec.logic} ${spec.components.join(' ')}`.toLowerCase()

  if (/\bcalculator\b/.test(text)) return 'calculator'
  if (/\b(game|gaming|simulator|sim|puzzle|quiz)\b/.test(text)) return 'game'
  if (/\b(spreadsheet|sheet|csv)\b/.test(text)) return 'spreadsheet'
  if (/\b(store|shop|market)\b/.test(text)) return 'store'
  if (/\b(todo|task|checklist)\b/.test(text)) return 'todo'
  if (/\b(timer|pomodoro|stopwatch)\b/.test(text)) return 'timer'
  if (/\b(dashboard|chart|analytics)\b/.test(text)) return 'dashboard'
  if (/\b(form|survey|signup)\b/.test(text)) return 'form'
  if (/\b(note|notes|editor|markdown)\b/.test(text)) return 'notes'
  if (spec.window_size === 'small') return 'compact'
  if (spec.window_size === 'large') return 'expansive'
  return 'general'
}

export async function recordGenerationLearning(payload: {
  spec: AppSpec
  content_width?: number
  content_height?: number
  window_width?: number
  window_height?: number
  refined?: boolean
  refinement_note?: string
}) {
  try {
    await fetch(`${API_BASE_URL}/api/learn/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, success: true }),
    })
    void primeLearnedSizes()
  } catch {
    // Learning is best-effort; never block the UI
  }
}
