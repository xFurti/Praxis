import { getProviderConfigs } from '../providerConfig.js'

export function handleProviderCapabilities(_req, res) {
  const providers = getProviderConfigs()
  const multimodal = providers.some((provider) => provider.multimodal)

  res.json({
    multimodal,
    providers: providers.map((provider) => ({
      id: provider.id,
      label: provider.label,
      multimodal: provider.multimodal,
      source: provider.apiKey ? 'live' : 'placeholder',
    })),
  })
}
