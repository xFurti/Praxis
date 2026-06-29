import { callModel, ProviderError } from '../callModel.js'
import { VISION_SYSTEM_PROMPT } from '../praxisPrompts.js'
import { getDefaultInterpreterProvider } from '../providerConfig.js'

/** POST /api/vision
 *  Body: { screenshot: string (base64 data URL) }
 *  Returns: { description: string } — detailed text description of the UI
 */
export async function handleVision(req, res, next) {
  try {
    const { screenshot } = req.body
    if (!screenshot) {
      return res.status(400).json({ error: 'screenshot is required' })
    }

    const provider = getDefaultInterpreterProvider()

    const messages = [
      {
        role: 'system',
        content: VISION_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: screenshot, detail: 'high' } },
          { type: 'text', text: 'Describe this UI in exhaustive detail so another agent can recreate it as a working web app.' },
        ],
      },
    ]

    const result = await callModel({
      role: 'vision',
      provider: provider.provider,
      model: provider.model,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      messages,
    })

    res.json({ description: result })
  } catch (err) {
    next(err)
  }
}
