import {
  deriveCategory,
  getLearningStore,
  getSizeCalibration,
} from './learningStore.js'

const FAST_PROVIDER = 'fast'

/**
 * @param {Record<string, unknown>} spec
 * @param {{ providerId?: string }} [options]
 */
export async function buildBuilderLearningSection(spec, options = {}) {
  if (options.providerId && options.providerId !== FAST_PROVIDER) {
    return ''
  }

  const store = await getLearningStore()
  const category = deriveCategory(spec)
  const lines = []

  const sizeCal = getSizeCalibration(store, category)
  if (sizeCal) {
    lines.push(
      `SIZE CALIBRATION (from ${sizeCal.sample_count} prior successful ${sizeCal.source === 'category' ? category : 'app'} builds):`,
      `- Target content area ≈ ${sizeCal.content_width}×${sizeCal.content_height}px inside .praxis-card`,
      `- Avoid excess empty space; avoid content that overflows or needs scrolling unless the spec requires a list/table`,
      `- Use compact layouts for calculators/timers; use wider grids for dashboards/spreadsheets`,
    )
  }

  const relevantLessons = pickRelevantLessons(store.ui_lessons, category, spec)
  if (relevantLessons.length) {
    lines.push('', 'LESSONS FROM PRIOR USER FEEDBACK (apply when relevant):')
    for (const lesson of relevantLessons) {
      lines.push(`- ${lesson}`)
    }
  }

  const recentWins = store.records
    .filter((r) => r.success && r.provider === FAST_PROVIDER && r.category === category)
    .slice(0, 3)

  if (recentWins.length) {
    lines.push('', 'RECENT SUCCESSFUL PATTERNS IN THIS CATEGORY:')
    for (const win of recentWins) {
      const dims =
        win.content_width && win.content_height
          ? ` (${win.content_width}×${win.content_height}px content)`
          : ''
      lines.push(`- "${win.app_name}"${dims}, ${win.component_count} components, theme: ${win.theme_id || 'default'}`)
    }
  }

  if (!lines.length) {
    return ''
  }

  return `GEMMA LEARNING MEMORY (improve over past creations):\n${lines.join('\n')}`
}

export async function buildInterpreterLearningSection() {
  const store = await getLearningStore()
  const lines = []

  const categories = ['calculator', 'todo', 'timer', 'spreadsheet', 'dashboard', 'form', 'general']
  const sizeHints = []

  for (const category of categories) {
    const cal = getSizeCalibration(store, category)
    if (cal && cal.sample_count >= 2) {
      sizeHints.push(
        `${category}: prefer window_size that fits ~${cal.content_width}×${cal.content_height}px content`,
      )
    }
  }

  if (sizeHints.length) {
    lines.push('Learned window sizing from prior apps:')
    lines.push(...sizeHints.map((h) => `- ${h}`))
  }

  const topLessons = store.ui_lessons.slice(0, 5)
  if (topLessons.length) {
    lines.push('', 'Common user refinements to anticipate in specs:')
    for (const lesson of topLessons) {
      lines.push(`- ${lesson}`)
    }
  }

  if (!lines.length) {
    return ''
  }

  return `\n\nLEARNING FROM PRIOR APPS:\n${lines.join('\n')}`
}

/**
 * @param {string[]} lessons
 * @param {string} category
 * @param {Record<string, unknown>} spec
 */
function pickRelevantLessons(lessons, category, spec) {
  const haystack = `${category} ${spec.app_name} ${spec.description}`.toLowerCase()
  const scored = lessons
    .map((lesson) => {
      const lower = lesson.toLowerCase()
      let score = 0
      if (lower.includes(category)) score += 3
      if (lower.includes(String(spec.app_name || '').toLowerCase())) score += 2
      if (haystack.includes('button') && lower.includes('button')) score += 1
      if (haystack.includes('color') && lower.includes('color')) score += 1
      return { lesson, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  const picked = scored.slice(0, 4).map((item) => item.lesson)
  if (picked.length) {
    return picked
  }

  return lessons.slice(0, 3)
}
