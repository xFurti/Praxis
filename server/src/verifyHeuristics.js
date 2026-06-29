import { deriveCategory, detectSpecIntentMismatch } from './appCategory.js'
import { getSizeCalibration, getLearningStore } from './learningStore.js'

/**
 * @param {Record<string, unknown>} spec
 * @param {string} [sourcePrompt]
 */
export function verifySpecHeuristics(spec, sourcePrompt = '') {
  /** @type {string[]} */
  const issues = []
  /** @type {Record<string, unknown>} */
  const patches = {}

  if (!Array.isArray(spec.components) || spec.components.length === 0) {
    issues.push('Spec has no components — add at least one UI element.')
  }

  issues.push(...detectSpecIntentMismatch(spec, sourcePrompt))

  const logic = String(spec.logic || '')
  const componentText = (spec.components || []).join(' ').toLowerCase()
  const mentionsButton = /button|click|tap|submit|press/i.test(logic + ' ' + componentText)
  const hasButton = componentText.includes('button')

  if (mentionsButton && !hasButton) {
    issues.push('Logic implies buttons but components list has no button entries.')
  }

  const count = Array.isArray(spec.components) ? spec.components.length : 0
  let windowSize = spec.window_size

  if (count <= 4 && windowSize === 'large') {
    issues.push('window_size large is oversized for a simple app — prefer small or medium.')
    windowSize = 'small'
    patches.window_size = 'small'
  }

  if (count >= 10 && windowSize === 'small') {
    issues.push('window_size small may be too tight for many components — prefer medium or large.')
    windowSize = 'medium'
    patches.window_size = 'medium'
  }

  const category = deriveCategory(spec)
  if (category === 'calculator') {
    if (windowSize === 'large' || windowSize === 'medium') {
      issues.push('Calculators should use window_size small for a compact keypad layout.')
      patches.window_size = 'small'
      windowSize = 'small'
    }
    const ux = String(spec.design?.ux_notes || '')
    if (!ux.toLowerCase().includes('grid') && !ux.toLowerCase().includes('calc')) {
      patches.design = {
        ...(spec.design && typeof spec.design === 'object' ? spec.design : {}),
        ux_notes:
          'Compact calculator: single card ~300px wide, .praxis-readout + 4×5 .praxis-calc-pad grid, standard operator layout.',
      }
      issues.push('Calculator spec missing layout guidance — added keypad grid ux_notes.')
    }
  }

  return { issues, patches, window_size: windowSize }
}

/**
 * @param {Record<string, unknown>} spec
 * @param {string} html
 * @param {{ content_width?: number, content_height?: number }} measured
 */
export async function verifyPublishHeuristics(spec, html, measured = {}) {
  /** @type {string[]} */
  const issues = []
  const text = String(html || '').toLowerCase()

  if (!text.includes('class="praxis-app"') && !text.includes("class='praxis-app'")) {
    issues.push('Missing body.praxis-app class.')
  }

  if (!text.includes('praxis-card')) {
    issues.push('Missing .praxis-card wrapper for the main UI.')
  }

  const category = deriveCategory(spec)

  if (category === 'game' && (text.includes('praxis-calc-pad') || text.includes('data-action="digit"'))) {
    issues.push('HTML looks like a calculator but the spec is not — rebuild to match the spec.')
  }

  if (category !== 'calculator' && text.includes('praxis-calc-pad')) {
    issues.push('Calculator keypad detected in HTML but spec is not a calculator.')
  }

  if (text.includes('100vh') || text.includes('min-height: 100%')) {
    if (category === 'calculator' || category === 'todo' || category === 'timer' || category === 'compact') {
      issues.push('Full-viewport height wrapper detected on a compact app — use body.praxis-fit and size to content.')
    }
  }

  if (/<script[^>]+src=/i.test(html)) {
    issues.push('External script src detected — apps must be fully self-contained.')
  }

  if (/<link[^>]+href=/i.test(html)) {
    issues.push('External link href detected — no CDN or external stylesheets allowed.')
  }

  const store = await getLearningStore()
  const cal = getSizeCalibration(store, category)

  const width = measured.content_width
  const height = measured.content_height

  if (typeof width === 'number' && typeof height === 'number') {
    if (width < 120 || height < 100) {
      issues.push(`Measured content is too small (${width}×${height}px) — layout may be collapsed or empty.`)
    }

    if (width > 1400 || height > 1200) {
      issues.push(`Measured content is very large (${width}×${height}px) — tighten layout and avoid full-viewport wrappers.`)
    }

    if (cal && cal.sample_count >= 2) {
      const wRatio = width / cal.content_width
      const hRatio = height / cal.content_height
      if (wRatio > 2.2 || hRatio > 2.2) {
        issues.push(
          `Content footprint (${width}×${height}px) is much larger than learned ${category} apps (~${cal.content_width}×${cal.content_height}px). Reduce empty space and nested full-width wrappers.`,
        )
      }
    }
  } else {
    issues.push('Could not measure content dimensions before publish.')
  }

  const { critical, warnings } = splitPublishIssues(issues)
  return { issues, critical, warnings, category, target_size: cal }
}

const CRITICAL_PATTERNS = [
  /^Missing body\.praxis-app/i,
  /^Missing \.praxis-card/i,
  /^External script/i,
  /^External link/i,
  /^Measured content is too small/i,
  /^Could not measure/i,
]

export function splitPublishIssues(issues) {
  const critical = issues.filter((issue) => CRITICAL_PATTERNS.some((re) => re.test(issue)))
  const warnings = issues.filter((issue) => !critical.includes(issue))
  return { critical, warnings }
}

export function buildPublishFixHint(issues) {
  const { critical } = splitPublishIssues(issues)
  const blockers = critical.length ? critical : issues
  if (!blockers.length) {
    return ''
  }

  return `PRE-PUBLISH VERIFICATION failed. Fix these before shipping:\n${blockers.map((i) => `- ${i}`).join('\n')}\nPreserve all working behavior. Ensure body has class praxis-app (add praxis-fit for compact apps) and main UI uses praxis-card. Fit content compactly without excess whitespace or viewport-filling wrappers. For calculators use .praxis-readout and .praxis-calc-pad with equal-size keys.`
}
