export function getProviderConfigs() {
  const defaultProvider = resolveDefaultProvider()

  return [
    {
      id: 'fast',
      label: process.env.SPEED_COMPARE_FAST_LABEL || 'Fast provider',
      provider: (process.env.SPEED_COMPARE_FAST_PROVIDER || defaultProvider).toLowerCase(),
      model:
        process.env.SPEED_COMPARE_FAST_MODEL ||
        process.env.CEREBRAS_MODEL ||
        process.env.MODEL ||
        'mock-model',
      apiKey:
        process.env.SPEED_COMPARE_FAST_API_KEY ||
        process.env.CEREBRAS_API_KEY ||
        process.env.MODEL_API_KEY ||
        '',
      baseUrl:
        process.env.SPEED_COMPARE_FAST_BASE_URL ||
        process.env.CEREBRAS_BASE_URL ||
        process.env.MODEL_BASE_URL ||
        '',
      multimodal: readBoolean(process.env.SPEED_COMPARE_FAST_MULTIMODAL) || readBoolean(process.env.MULTIMODAL_ENABLED),
    },
    {
      id: 'slow',
      label: process.env.SPEED_COMPARE_SLOW_LABEL || 'Slow provider',
      provider: (process.env.SPEED_COMPARE_SLOW_PROVIDER || defaultProvider).toLowerCase(),
      model:
        process.env.SPEED_COMPARE_SLOW_MODEL ||
        process.env.CEREBRAS_MODEL ||
        process.env.MODEL ||
        'mock-model',
      apiKey:
        process.env.SPEED_COMPARE_SLOW_API_KEY ||
        process.env.CEREBRAS_API_KEY ||
        process.env.MODEL_API_KEY ||
        '',
      baseUrl:
        process.env.SPEED_COMPARE_SLOW_BASE_URL ||
        process.env.CEREBRAS_BASE_URL ||
        process.env.MODEL_BASE_URL ||
        '',
      multimodal: readBoolean(process.env.SPEED_COMPARE_SLOW_MULTIMODAL),
    },
  ]
}

function resolveDefaultProvider() {
  const explicit = (process.env.PROVIDER || '').trim().toLowerCase()
  if (explicit) {
    return explicit
  }

  if (process.env.CEREBRAS_API_KEY) {
    return 'cerebras'
  }

  if (process.env.MODEL_API_KEY) {
    return 'openai-compatible'
  }

  return 'mock'
}

export function getDefaultInterpreterProvider() {
  return getProviderConfigs()[0]
}

export function readBoolean(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase())
}
