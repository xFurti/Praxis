/**
 * App-type detection — avoid false positives (e.g. "calculate" ≠ calculator).
 */

const GAME_RE =
  /\b(battle\s*royale|royale|fps|shooter|game|gaming|simulator|sim|puzzle|quiz|arcade|platformer|rpg|moba|survival|arena)\b/i

const CALCULATOR_RE = /\bcalculator\b/i

const NON_CALC_APP_RE =
  /\b(game|gaming|simulator|sim|todo|task|timer|pomodoro|dashboard|spreadsheet|sheet|shop|store|market|form|survey|notes?|editor|chat|mail|weather|map)\b/i

export function specText(spec) {
  return `${spec.app_name || ''} ${spec.description || ''} ${spec.logic || ''} ${(spec.components || []).join(' ')}`
}

export function promptWantsCalculator(prompt) {
  const text = String(prompt || '').toLowerCase()
  return CALCULATOR_RE.test(text) || /\b(arithmetic|math tool|math app)\b/.test(text)
}

/**
 * Strict calculator detection — used only for the layout template shortcut.
 * @param {Record<string, unknown>} spec
 */
export function isCalculatorSpec(spec) {
  const name = String(spec.app_name || '').toLowerCase()
  const desc = String(spec.description || '').toLowerCase()

  if (CALCULATOR_RE.test(name) || CALCULATOR_RE.test(desc)) {
    return true
  }

  if (NON_CALC_APP_RE.test(`${name} ${desc}`) || GAME_RE.test(`${name} ${desc}`)) {
    return false
  }

  const logic = String(spec.logic || '').toLowerCase()
  if (!CALCULATOR_RE.test(logic) && !/\barithmetic\b/.test(logic)) {
    return false
  }

  const components = (spec.components || []).map((c) => String(c).toLowerCase())
  const keypadLabels = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'c', '+', '-', '×', '÷', '='])
  const digitButtons = components
    .filter((c) => c.startsWith('button'))
    .filter((c) => keypadLabels.has(c.replace(/^button:?/, '').trim()))

  return digitButtons.length >= 8
}

export function deriveCategory(specOrText) {
  const text =
    typeof specOrText === 'string'
      ? specOrText.toLowerCase()
      : specText(specOrText).toLowerCase()

  if (isCalculatorSpec(typeof specOrText === 'object' ? specOrText : { description: text })) {
    return 'calculator'
  }

  if (GAME_RE.test(text)) return 'game'
  if (/\b(spreadsheet|sheet|csv|excel|table)\b/.test(text)) return 'spreadsheet'
  if (/\b(store|shop|market|ecommerce|e-commerce)\b/.test(text)) return 'store'
  if (/\b(todo|task|checklist)\b/.test(text)) return 'todo'
  if (/\b(timer|pomodoro|stopwatch|countdown)\b/.test(text)) return 'timer'
  if (/\b(dashboard|chart|analytics|metrics)\b/.test(text)) return 'dashboard'
  if (/\b(form|survey|signup|register|login)\b/.test(text)) return 'form'
  if (/\b(note|notes|editor|markdown|journal)\b/.test(text)) return 'notes'

  if (typeof specOrText === 'object' && specOrText.window_size === 'small') return 'compact'
  if (typeof specOrText === 'object' && specOrText.window_size === 'large') return 'expansive'

  return 'general'
}

export function detectSpecIntentMismatch(spec, sourcePrompt = '') {
  const issues = []
  const prompt = String(sourcePrompt || spec._source_prompt || '').trim()
  if (!prompt) {
    return issues
  }

  const wantsCalculator = promptWantsCalculator(prompt)
  const looksCalculator = isCalculatorSpec(spec)

  if (!wantsCalculator && looksCalculator) {
    issues.push(
      'Intent mismatch: user did not ask for a calculator but the spec describes one. Rewrite the spec to match the user request.',
    )
  }

  if (wantsCalculator && !looksCalculator) {
    issues.push('Intent mismatch: user asked for a calculator but the spec does not describe calculator UI.')
  }

  return issues
}
