import { recordLearning, getLearnedSizeHints, deriveCategory } from '../learningStore.js'

/** POST /api/learn/record — persist outcome from a completed Gemma build */
export async function handleLearnRecord(req, res, next) {
  try {
    const { spec, content_width, content_height, window_width, window_height, refined, refinement_note, success } =
      req.body

    if (!spec || typeof spec !== 'object') {
      return res.status(400).json({ error: 'spec is required' })
    }

    const record = await recordLearning({
      provider: 'fast',
      app_name: spec.app_name,
      category: deriveCategory(spec),
      window_size: spec.window_size,
      theme_id: spec.design?.theme_id,
      content_width,
      content_height,
      window_width,
      window_height,
      component_count: Array.isArray(spec.components) ? spec.components.length : 0,
      refined: Boolean(refined),
      refinement_note,
      success: success !== false,
    })

    res.json({ ok: true, id: record.id })
  } catch (err) {
    next(err)
  }
}

/** GET /api/learn/sizes — learned content dimensions per app category */
export async function handleLearnSizes(_req, res, next) {
  try {
    const hints = await getLearnedSizeHints()
    res.json({ hints })
  } catch (err) {
    next(err)
  }
}
