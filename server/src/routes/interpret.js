import { callModel, ProviderError } from '../callModel.js'
import { INTERPRETER_SYSTEM_PROMPT } from '../praxisPrompts.js'
import { buildInterpreterLearningSection } from '../learningContext.js'
import { enrichSpecDesign } from '../styleDirector.js'
import { parseSpec } from '../specUtils.js'
import { getDefaultInterpreterProvider } from '../providerConfig.js'
import { attachSourcePrompt } from '../specPipeline.js'

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
    const learning = await buildInterpreterLearningSection()

    const messages = [
      {
        role: 'system',
        content: INTERPRETER_SYSTEM_PROMPT + learning,
      },
      {
        role: 'user',
        content: `USER REQUEST:\n${prompt}\n\nProduce the JSON app spec for exactly this request.`,
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
    res.json({
      spec: enrichSpecDesign(attachSourcePrompt(parseSpec(result), prompt)),
    })
  } catch (err) {
    next(err)
  }
}
