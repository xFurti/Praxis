import { callModel } from '../callModel.js'
import { buildBuilderSystemPrompt } from '../styleDirector.js'
import { getProviderConfigs } from '../providerConfig.js'

/** POST /api/build
 *  Body: { spec: object }
 *  If Accept: text/event-stream → stream HTML chunks via SSE
 *  Otherwise → return full HTML
 */
export async function handleBuild(req, res, next) {
  try {
    const { spec, provider: providerId } = req.body
    if (!spec) {
      return res.status(400).json({ error: 'spec is required' })
    }

    const messages = [
      {
        role: 'system',
        content: await buildBuilderSystemPrompt(spec, { providerId }),
      },
      { role: 'user', content: JSON.stringify(spec) },
    ]

    const providerOpts = resolveProviderOpts(providerId)
    const streaming = req.headers.accept?.includes('text/event-stream')

    if (streaming) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      try {
        const chunks = await callModel({ role: 'builder', messages, stream: true, ...providerOpts })
        if (typeof chunks[Symbol.asyncIterator] === 'function') {
          for await (const chunk of chunks) {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
          }
        } else {
          res.write(`data: ${JSON.stringify({ chunk: chunks, done: true })}\n\n`)
        }
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
        res.end()
      } catch (err) {
        const message = err?.publicMessage || err?.message || 'Build failed'
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
        res.end()
      }
    } else {
      const html = await callModel({ role: 'builder', messages, ...providerOpts })
      res.json({ html })
    }
  } catch (err) {
    next(err)
  }
}

function resolveProviderOpts(providerId) {
  if (providerId !== 'fast' && providerId !== 'slow') {
    return {}
  }

  const cfg = getProviderConfigs().find((item) => item.id === providerId)
  if (!cfg) {
    return {}
  }

  return {
    provider: cfg.provider,
    model: cfg.model,
    apiKey: cfg.apiKey,
    baseUrl: cfg.baseUrl,
  }
}
