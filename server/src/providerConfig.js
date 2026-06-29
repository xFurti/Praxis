export function getProviderConfigs() {
  const defaultProvider = resolveDefaultProvider()

  return [
    {
      id: 'fast',
      label: process.env.SPEED_COMPARE_FAST_LABEL || 'Gemma 4 31B',
      provider: (process.env.SPEED_COMPARE_FAST_PROVIDER || defaultProvider).toLowerCase(),
      model:
        process.env.SPEED_COMPARE_FAST_MODEL ||
        process.env.CEREBRAS_MODEL ||
        process.env.MODEL ||
        'gemma-4-31b',
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
      multimodal:
        readBoolean(process.env.SPEED_COMPARE_FAST_MULTIMODAL) ||
        readBoolean(process.env.MULTIMODAL_ENABLED) ||
        Boolean(process.env.CEREBRAS_API_KEY),
    },
    {
      id: 'slow',
      label: process.env.SPEED_COMPARE_SLOW_LABEL || 'Qwen 3.5 35B',
      provider: (process.env.SPEED_COMPARE_SLOW_PROVIDER || defaultProvider).toLowerCase(),
      model:
        process.env.SPEED_COMPARE_SLOW_MODEL ||
        process.env.QWEN_MODEL ||
        process.env.CEREBRAS_MODEL ||
        process.env.MODEL ||
        'qwen-3-35b',
      apiKey:
        process.env.SPEED_COMPARE_SLOW_API_KEY ||
        process.env.CEREBRAS_API_KEY ||
        process.env.MODEL_API_KEY ||
        '',
      baseUrl:
        process.env.SPEED_COMPARE_SLOW_BASE_URL ||
        process.env.QWEN_BASE_URL ||
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
