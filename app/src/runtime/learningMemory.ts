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

  if (text.includes('calculator') || text.includes('calc')) return 'calculator'
  if (text.includes('spreadsheet') || text.includes('sheet') || text.includes('csv')) return 'spreadsheet'
  if (text.includes('store') || text.includes('shop') || text.includes('market')) return 'store'
  if (text.includes('todo') || text.includes('task') || text.includes('checklist')) return 'todo'
  if (text.includes('timer') || text.includes('pomodoro') || text.includes('stopwatch')) return 'timer'
  if (text.includes('dashboard') || text.includes('chart') || text.includes('analytics')) return 'dashboard'
  if (text.includes('form') || text.includes('survey') || text.includes('signup')) return 'form'
  if (text.includes('game') || text.includes('puzzle') || text.includes('quiz')) return 'game'
  if (text.includes('note') || text.includes('editor') || text.includes('markdown')) return 'notes'
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
