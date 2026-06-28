import { callModel } from '../callModel.js'
import { FIXER_SYSTEM_PROMPT } from '../praxisPrompts.js'

/** POST /api/fix
 *  Body: { html: string, error: string }
 *  Returns: corrected HTML
 */
export async function handleFix(req, res, next) {
  try {
    const { html, error } = req.body
    if (!html || !error) {
      return res.status(400).json({ error: 'html and error are required' })
    }

    const messages = [
      {
        role: 'system',
        content: FIXER_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `HTML:\n${html}\n\nError:\n${error}\n\nReturn the fixed HTML.`,
      },
    ]

    const fixed = await callModel({ role: 'fixer', messages })
    res.json({ html: fixed })
  } catch (err) {
    next(err)
  }
}
