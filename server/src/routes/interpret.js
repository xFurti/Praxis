import { callModel } from '../callModel.js'
import { INTERPRETER_SYSTEM_PROMPT } from '../praxisPrompts.js'

/** POST /api/interpret
 *  Body: { prompt: string, screenshot?: string }
 *  Returns: JSON AppSpec
 */
export async function handleInterpret(req, res, next) {
  try {
    const { prompt, screenshot } = req.body
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' })
    }

    const messages = [
      {
        role: 'system',
        content: INTERPRETER_SYSTEM_PROMPT,
      },
      { role: 'user', content: screenshot ? `[image attached] ${prompt}` : prompt },
    ]

    const result = await callModel({ role: 'interpreter', messages })
    res.json({ spec: parseSpec(result) })
  } catch (err) {
    next(err)
  }
}

function parseSpec(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return { name: 'Unknown', purpose: raw.slice(0, 120), components: [] }
  }
}
