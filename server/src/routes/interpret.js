import { callModel, ProviderError } from '../callModel.js'
import { INTERPRETER_SYSTEM_PROMPT } from '../praxisPrompts.js'
import { getDefaultInterpreterProvider } from '../providerConfig.js'

/** POST /api/interpret
 *  Body: { prompt: string, screenshot?: string }
 *  Returns: JSON AppSpec
 */
export async function handleInterpret(req, res, next) {
  try {
    const { prompt, screenshot } = req.body
    if (!prompt && !screenshot) {
      return res.status(400).json({ error: 'prompt or screenshot is required' })
    }

    const provider = getDefaultInterpreterProvider()

    const messages = [
      {
        role: 'system',
        content: INTERPRETER_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ]

    const result = await callModel({
      role: 'interpreter',
      provider: provider.provider,
      model: provider.model,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      messages,
    })
    res.json({ spec: parseSpec(result) })
  } catch (err) {
    next(err)
  }
}

function parseSpec(raw) {
  const normalized = String(raw || '').trim()

  try {
    return ensureSpecShape(JSON.parse(normalized))
  } catch {
    throw new ProviderError('Interpreter returned invalid spec JSON.', {
      logMessage: `Interpreter spec parse failed: ${normalized.slice(0, 400)}`,
      statusCode: 502,
    })
  }
}

function ensureSpecShape(spec) {
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
    typeof spec.app_name === 'string' &&
    typeof spec.description === 'string' &&
    typeof spec.logic === 'string' &&
    Array.isArray(spec.components) &&
    spec.components.every((item) => typeof item === 'string') &&
    ['small', 'medium', 'large'].includes(spec.window_size)
  )
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
