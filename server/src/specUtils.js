import { ProviderError } from './callModel.js'

export function parseSpec(raw, label = 'Interpreter') {
  const normalized = String(raw || '').trim()

  try {
    return ensureSpecShape(JSON.parse(normalized))
  } catch {
    throw new ProviderError(`${label} returned invalid spec JSON.`, {
      logMessage: `${label} spec parse failed: ${normalized.slice(0, 400)}`,
      statusCode: 502,
    })
  }
}

export function ensureSpecShape(spec) {
  if (isCurrentSpecShape(spec)) {
    return spec
  }

  if (isLegacySpecShape(spec)) {
    return {
      app_name: spec.name,
      description: spec.purpose,
      components: spec.components.map(normalizeLegacyComponent),
      logic: spec.purpose,
      window_size: 'medium',
      design: { style_source: 'auto' },
    }
  }

  throw new ProviderError('Interpreter returned an unusable app spec.', {
    logMessage: `Interpreter spec schema mismatch: ${JSON.stringify(spec).slice(0, 400)}`,
    statusCode: 502,
  })
}

function isCurrentSpecShape(spec) {
  return (
    spec &&
    typeof spec === 'object' &&
    hasNonemptyString(spec.app_name) &&
    hasNonemptyString(spec.description) &&
    hasNonemptyString(spec.logic) &&
    Array.isArray(spec.components) &&
    spec.components.length > 0 &&
    spec.components.every((item) => typeof item === 'string') &&
    ['small', 'medium', 'large'].includes(spec.window_size)
  )
}

function hasNonemptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isLegacySpecShape(spec) {
  return (
    spec &&
    typeof spec === 'object' &&
    typeof spec.name === 'string' &&
    typeof spec.purpose === 'string' &&
    Array.isArray(spec.components)
  )
}

function normalizeLegacyComponent(component) {
  if (typeof component === 'string') {
    return component
  }

  if (component && typeof component === 'object') {
    const name = typeof component.name === 'string' ? component.name : 'item'
    const kind = typeof component.kind === 'string' ? component.kind : 'component'
    return `${kind}:${name}`
  }

  return 'component:item'
}
