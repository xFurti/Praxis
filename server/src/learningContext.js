import {
  deriveCategory,
  getLearningStore,
  getSizeCalibration,
} from './learningStore.js'

const FAST_PROVIDER = 'fast'

const QUALITY_MEMORY_PREAMBLE = `QUALITY MEMORY (read carefully):
- Use this section ONLY to improve layout fit, contrast, completeness, and bug avoidance.
- NEVER copy colors, themes, visual style, or composition from prior builds.
- Every new app must look visually unique — learning makes each generation BETTER, not MORE ALIKE.`

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
      `LAYOUT FIT (${sizeCal.sample_count} measured ${sizeCal.source === 'category' ? category : 'app'} builds):`,
      `- Aim for ~${sizeCal.content_width}×${sizeCal.content_height}px of real content inside .praxis-card`,
      `- Avoid huge empty margins, viewport-filling wrappers, or content that overflows without reason`,
      `- Compact tools (calculator, timer) stay tight; tables/dashboards may be wider`,
    )
  }

  const qualityHints = buildAggregateQualityHints(store, category)
  if (qualityHints.length) {
    lines.push('', 'QUALITY TRENDS FOR THIS APP TYPE:')
    for (const hint of qualityHints) {
      lines.push(`- ${hint}`)
    }
  }

  const relevantLessons = pickRelevantLessons(store.ui_lessons, category, spec)
  if (relevantLessons.length) {
    lines.push('', 'USER-CORRECTED ISSUES (fix these quality problems when relevant — do not copy prior visuals):')
    for (const lesson of relevantLessons) {
      lines.push(`- ${lesson}`)
    }
  }

  if (!lines.length) {
    return ''
  }

  return `${QUALITY_MEMORY_PREAMBLE}\n${lines.join('\n')}`
}

export async function buildInterpreterLearningSection() {
  const store = await getLearningStore()
  const lessons = store.ui_lessons
    .map(sanitizeLessonForPrompt)
    .filter(Boolean)
    .slice(0, 2)

  if (!lessons.length) {
    return ''
  }

  const lines = [
    'QUALITY FEEDBACK FROM PAST BUILDS (apply only when relevant to this prompt):',
    ...lessons.map((lesson) => `- ${lesson}`),
    'Do not reuse prior visual styles — only learn from these quality/behavior corrections.',
  ]

  return `\n\n${lines.join('\n')}`
}

/**
 * Aggregate non-visual quality signals — no app names, no themes, no style references.
 * @param {import('./learningStore.js').LearningStore} store
 * @param {string} category
 */
function buildAggregateQualityHints(store, category) {
  const records = store.records.filter(
    (r) => r.success && r.provider === FAST_PROVIDER && r.category === category,
  )

  if (records.length < 2) {
    return []
  }

  const hints = []
  const refinedCount = records.filter((r) => r.refined).length
  const refineRate = refinedCount / records.length

  if (refineRate >= 0.25) {
    hints.push(
      `${Math.round(refineRate * 100)}% of recent ${category} builds needed user refinements — prioritize correct sizing and complete component coverage on the first pass`,
    )
  }

  const componentCounts = records
    .map((r) => r.component_count)
    .filter((n) => typeof n === 'number' && n > 0)
  const medComponents = median(componentCounts)
  if (medComponents && medComponents >= 3) {
    hints.push(
      `Successful ${category} builds typically implement ~${medComponents} interactive components — verify every spec component is present and functional`,
    )
  }

  const withDimensions = records.filter((r) => r.content_width && r.content_height)
  const oversized = withDimensions.filter((r) => {
    const area = r.content_width * r.content_height
    const medW = median(withDimensions.map((x) => x.content_width))
    const medH = median(withDimensions.map((x) => x.content_height))
    if (!medW || !medH) return false
    return area > medW * medH * 2.5
  })

  if (withDimensions.length >= 2 && oversized.length / withDimensions.length >= 0.3) {
    hints.push(
      `Watch for oversized layouts in ${category} — keep content compact and avoid nested full-width wrappers`,
    )
  }

  return hints
}

/**
 * @param {string[]} lessons
 * @param {string} category
 * @param {Record<string, unknown>} spec
 */
function pickRelevantLessons(lessons, category, spec) {
  const haystack = `${category} ${spec.app_name} ${spec.description}`.toLowerCase()
  const scored = lessons
    .map((raw) => sanitizeLessonForPrompt(raw))
    .filter(Boolean)
    .map((lesson) => {
      const lower = lesson.toLowerCase()
      let score = 0
      if (lower.includes(category)) score += 3
      if (haystack.includes('button') && lower.includes('button')) score += 1
      if (haystack.includes('color') && lower.includes('contrast')) score += 1
      if (lower.includes('resize') || lower.includes('size') || lower.includes('overflow')) score += 1
      if (lower.includes('readable') || lower.includes('contrast')) score += 1
      return { lesson, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored
    .filter((item) => item.score >= 2)
    .slice(0, 2)
    .map((item) => item.lesson)
}

/** Strip legacy lesson prefixes that referenced specific app names. */
function sanitizeLessonForPrompt(lesson) {
  const text = String(lesson || '').trim()
  if (!text) return ''

  const legacy = text.match(/^After "[^"]+" \([^)]+\): users asked — (.+)$/i)
  if (legacy) {
    return legacy[1].trim()
  }

  const quality = text.match(/^Quality (?:lesson|fix) \([^)]+\): (.+)$/i)
  if (quality) {
    return quality[1].trim()
  }

  if (/^After "/i.test(text)) {
    return ''
  }

  return text
}

function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}
