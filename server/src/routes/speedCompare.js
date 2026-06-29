import { callModel } from '../callModel.js'
import { getProviderConfigs } from '../providerConfig.js'

export async function handleSpeedCompare(_req, res, next) {
  try {
    const providers = getProviderConfigs()
    const results = await Promise.all(providers.map((provider) => measureProvider(provider)))
    res.json({ providers: results })
  } catch (err) {
    next(err)
  }
}

async function measureProvider(provider) {
  const start = Date.now()
  let output = ''

  try {
    output = await callModel({
      role: 'interpreter',
      provider: provider.provider,
      model: provider.model,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      messages: [
        {
          role: 'system',
          content: 'Return only a compact JSON object like {"ok":true}.',
        },
        {
          role: 'user',
          content: 'healthcheck',
        },
      ],
    })

    const durationMs = Math.max(1, Date.now() - start)
    const tokenPerSec = Math.round((estimateTokens(output) / durationMs) * 1000)

    return {
      id: provider.id,
      label: provider.label,
      tokenPerSec,
      status: 'done',
      source: provider.apiKey ? 'live' : 'placeholder',
      multimodal: provider.multimodal,
    }
  } catch {
    return {
      id: provider.id,
      label: provider.label,
      tokenPerSec: null,
      status: provider.apiKey ? 'error' : 'done',
      source: provider.apiKey ? 'live' : 'placeholder',
      multimodal: provider.multimodal,
    }
  }
}

function estimateTokens(text) {
  return Math.max(1, Math.ceil(String(text || '').length / 4))
}
