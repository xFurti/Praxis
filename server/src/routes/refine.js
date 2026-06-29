import { callModel } from '../callModel.js'
import { REFINER_SYSTEM_PROMPT } from '../praxisPrompts.js'
import { enrichSpecDesign } from '../styleDirector.js'
import { parseSpec } from '../specUtils.js'
import { getDefaultInterpreterProvider } from '../providerConfig.js'

/** POST /api/refine
 *  Body: { spec: object, changeRequest: string }
 *  Returns: JSON AppSpec
 */
export async function handleRefine(req, res, next) {
  try {
    const { spec, changeRequest } = req.body
    if (!spec || typeof spec !== 'object') {
      return res.status(400).json({ error: 'spec is required' })
    }
    if (!changeRequest || typeof changeRequest !== 'string' || !changeRequest.trim()) {
      return res.status(400).json({ error: 'changeRequest is required' })
    }

    const provider = getDefaultInterpreterProvider()

    const messages = [
      { role: 'system', content: REFINER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `CURRENT spec:\n${JSON.stringify(spec, null, 2)}\n\nUSER change request:\n${changeRequest.trim()}`,
      },
    ]

    const result = await callModel({
      role: 'refiner',
      provider: provider.provider,
      model: provider.model,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      messages,
    })

    res.json({ spec: enrichSpecDesign(parseSpec(result, 'Refiner')) })
  } catch (err) {
    next(err)
  }
}
