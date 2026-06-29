import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORE_PATH = path.join(__dirname, '../data/gemma-learning.json')
const MAX_RECORDS = 120
const MAX_UI_LESSONS = 24

/** @typedef {{
 *   id: string
 *   at: string
 *   provider: string
 *   app_name: string
 *   category: string
 *   window_size: string
 *   theme_id?: string
 *   content_width?: number
 *   content_height?: number
 *   window_width?: number
 *   window_height?: number
 *   component_count: number
 *   refined: boolean
 *   refinement_note?: string
 *   success: boolean
 * }} LearningRecord */

/** @typedef {{ version: number, records: LearningRecord[], ui_lessons: string[] }} LearningStore */

/** @type {LearningStore | null} */
let cache = null

async function loadStore() {
  if (cache) {
    return cache
  }

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8')
    cache = JSON.parse(raw)
    return cache
  } catch {
    cache = { version: 1, records: [], ui_lessons: [] }
    return cache
  }
}

async function saveStore(store) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
  cache = store
}

export function deriveCategory(specOrText) {
  const text =
    typeof specOrText === 'string'
      ? specOrText.toLowerCase()
      : `${specOrText.app_name} ${specOrText.description} ${specOrText.logic} ${(specOrText.components || []).join(' ')}`.toLowerCase()

  if (text.includes('calculator') || text.includes('calc')) return 'calculator'
  if (text.includes('spreadsheet') || text.includes('sheet') || text.includes('csv')) return 'spreadsheet'
  if (text.includes('store') || text.includes('shop') || text.includes('market')) return 'store'
  if (text.includes('todo') || text.includes('task') || text.includes('checklist')) return 'todo'
  if (text.includes('timer') || text.includes('pomodoro') || text.includes('stopwatch')) return 'timer'
  if (text.includes('dashboard') || text.includes('chart') || text.includes('analytics')) return 'dashboard'
  if (text.includes('form') || text.includes('survey') || text.includes('signup')) return 'form'
  if (text.includes('game') || text.includes('puzzle') || text.includes('quiz')) return 'game'
  if (text.includes('note') || text.includes('editor') || text.includes('markdown')) return 'notes'

  if (typeof specOrText === 'object' && specOrText.window_size === 'small') return 'compact'
  if (typeof specOrText === 'object' && specOrText.window_size === 'large') return 'expansive'

  return 'general'
}

function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

/**
 * @param {LearningStore} store
 * @param {string} category
 */
export function getSizeCalibration(store, category) {
  const records = store.records.filter(
    (r) => r.success && r.provider === 'fast' && r.content_width && r.content_height,
  )

  const forCategory = records.filter((r) => r.category === category)
  const pool = forCategory.length >= 2 ? forCategory : records

  const widths = pool.map((r) => r.content_width).filter((n) => typeof n === 'number')
  const heights = pool.map((r) => r.content_height).filter((n) => typeof n === 'number')

  const width = median(widths)
  const height = median(heights)

  if (!width || !height) {
    return null
  }

  return {
    category,
    content_width: width,
    content_height: height,
    sample_count: pool.length,
    source: forCategory.length >= 2 ? 'category' : 'global',
  }
}

/**
 * @param {Record<string, unknown>} entry
 */
export async function recordLearning(entry) {
  const store = await loadStore()

  /** @type {LearningRecord} */
  const record = {
    id: `lr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    provider: entry.provider === 'slow' ? 'slow' : 'fast',
    app_name: String(entry.app_name || 'App').slice(0, 80),
    category: String(entry.category || 'general'),
    window_size: String(entry.window_size || 'medium'),
    theme_id: typeof entry.theme_id === 'string' ? entry.theme_id : undefined,
    content_width: typeof entry.content_width === 'number' ? Math.round(entry.content_width) : undefined,
    content_height: typeof entry.content_height === 'number' ? Math.round(entry.content_height) : undefined,
    window_width: typeof entry.window_width === 'number' ? Math.round(entry.window_width) : undefined,
    window_height: typeof entry.window_height === 'number' ? Math.round(entry.window_height) : undefined,
    component_count: typeof entry.component_count === 'number' ? entry.component_count : 0,
    refined: Boolean(entry.refined),
    refinement_note:
      typeof entry.refinement_note === 'string' ? entry.refinement_note.slice(0, 240) : undefined,
    success: entry.success !== false,
  }

  store.records.unshift(record)
  if (store.records.length > MAX_RECORDS) {
    store.records = store.records.slice(0, MAX_RECORDS)
  }

  if (record.refined && record.refinement_note) {
    const lesson = `After "${record.app_name}" (${record.category}): users asked — ${record.refinement_note}`
    if (!store.ui_lessons.includes(lesson)) {
      store.ui_lessons.unshift(lesson)
    }
  }

  if (store.ui_lessons.length > MAX_UI_LESSONS) {
    store.ui_lessons = store.ui_lessons.slice(0, MAX_UI_LESSONS)
  }

  await saveStore(store)
  return record
}

export async function getLearningStore() {
  return loadStore()
}

export async function getLearnedSizeHints() {
  const store = await loadStore()
  const categories = [...new Set(store.records.map((r) => r.category))]
  const hints = {}

  for (const category of categories) {
    const cal = getSizeCalibration(store, category)
    if (cal) {
      hints[category] = { width: cal.content_width, height: cal.content_height, samples: cal.sample_count }
    }
  }

  const global = getSizeCalibration(store, 'general')
  if (global) {
    hints.general = { width: global.content_width, height: global.content_height, samples: global.sample_count }
  }

  return hints
}
