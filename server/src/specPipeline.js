/**
 * Helpers to keep spec identity stable across interpreter → verify → build.
 */

/**
 * @param {Record<string, unknown>} spec
 * @param {string} [prompt]
 */
export function attachSourcePrompt(spec, prompt) {
  const trimmed = String(prompt || '').trim()
  if (!trimmed) {
    return spec
  }
  return { ...spec, _source_prompt: trimmed }
}

/**
 * @param {Record<string, unknown>} spec
 */
export function stripSpecMeta(spec) {
  if (!spec || typeof spec !== 'object') {
    return spec
  }
  const { _source_prompt, ...rest } = spec
  return rest
}

/**
 * Keep theme + source prompt when a downstream agent rewrites the spec.
 * @param {Record<string, unknown>} original
 * @param {Record<string, unknown>} next
 */
export function mergeSpecIdentity(original, next) {
  const merged = { ...original, ...next }

  merged.app_name = pickNonemptyString(next.app_name, original.app_name)
  merged.description = pickNonemptyString(next.description, original.description)
  merged.logic = pickNonemptyString(next.logic, original.logic)

  if (!Array.isArray(merged.components) || merged.components.length === 0) {
    merged.components = Array.isArray(original.components) ? [...original.components] : []
  }

  if (!['small', 'medium', 'large'].includes(String(merged.window_size))) {
    merged.window_size = original.window_size || 'medium'
  }

  if (original._source_prompt && !merged._source_prompt) {
    merged._source_prompt = original._source_prompt
  }

  const prevDesign =
    original.design && typeof original.design === 'object' ? { ...original.design } : null
  const nextDesign =
    merged.design && typeof merged.design === 'object' ? { ...merged.design } : {}

  if (prevDesign) {
    merged.design = {
      ...prevDesign,
      ...nextDesign,
      theme_id: nextDesign.theme_id || prevDesign.theme_id,
      theme_name: nextDesign.theme_name || prevDesign.theme_name,
      style_source: nextDesign.style_source || prevDesign.style_source,
    }
  }

  return merged
}

function pickNonemptyString(value, fallback) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text) {
    return text
  }
  return typeof fallback === 'string' ? fallback : ''
}

/**
 * @param {string[]} issues
 */
export function filterSpecIssuesForModel(issues) {
  return issues.filter((issue) =>
    /intent mismatch/i.test(issue) ||
    /no components/i.test(issue) ||
    /logic implies buttons/i.test(issue) ||
    /does not describe calculator/i.test(issue),
  )
}

/**
 * @param {Record<string, unknown>} spec
 * @param {string} [sourcePrompt]
 */
export function buildBuilderUserMessage(spec, sourcePrompt = '') {
  const clean = stripSpecMeta(spec)
  const prompt = String(sourcePrompt || spec._source_prompt || '').trim()
  const lines = []

  if (prompt) {
    lines.push(`USER REQUEST:\n${prompt}`)
  }

  lines.push(`APP SPEC (implement every component and behavior):\n${JSON.stringify(clean, null, 2)}`)
  return lines.join('\n\n')
}
