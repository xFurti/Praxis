import { callModel } from '../callModel.js'
import { buildBuilderSystemPrompt } from '../styleDirector.js'
import { getProviderConfigs } from '../providerConfig.js'

function estimateTokens(text) {
  return Math.max(1, Math.ceil(String(text || '').length / 4))
}

function flushSse(res) {
  if (typeof res.flush === 'function') {
    res.flush()
  }
}

function writeSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
  flushSse(res)
}

/** POST /api/speed-compare/live — stream slow-provider tok/s during a build. */
export async function handleSpeedCompareLive(req, res, next) {
  try {
    const { spec } = req.body
    if (!spec) {
      return res.status(400).json({ error: 'spec is required' })
    }

    const slow = getProviderConfigs().find((item) => item.id === 'slow')
    if (!slow) {
      return res.status(500).json({ error: 'Slow provider is not configured.' })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders()
    }

    const start = Date.now()
    let totalTokens = 0

    const writeRate = () => {
      const elapsed = Math.max(1, Date.now() - start)
      const tokenPerSec = Math.round((totalTokens / elapsed) * 1000)
      writeSse(res, { tokenPerSec })
    }

    const runMockFallback = (source) => {
      let tick = 0
      writeSse(res, { tokenPerSec: 28, source, status: 'measuring' })
      const mock = setInterval(() => {
        tick += 5
        totalTokens += tick
        writeRate()
      }, 260)
      setTimeout(() => {
        clearInterval(mock)
        writeSse(res, { done: true, source })
        res.end()
      }, 5000)
    }

    if (!slow.apiKey) {
      runMockFallback('mock')
      return
    }

    // Immediate heartbeat so the UI shows Qwen is measuring
    writeSse(res, { tokenPerSec: 1, status: 'starting' })

    try {
      const chunks = await callModel({
        role: 'builder',
        provider: slow.provider,
        model: slow.model,
        apiKey: slow.apiKey,
        baseUrl: slow.baseUrl,
        messages: [
          { role: 'system', content: await buildBuilderSystemPrompt(spec, { providerId: 'slow' }) },
          { role: 'user', content: JSON.stringify(spec) },
        ],
        stream: true,
      })

      if (typeof chunks[Symbol.asyncIterator] !== 'function') {
        totalTokens += estimateTokens(chunks)
        writeRate()
      } else {
        for await (const chunk of chunks) {
          totalTokens += estimateTokens(chunk)
          writeRate()
          if (Date.now() - start > 12000) {
            break
          }
        }
      }

      writeRate()
      writeSse(res, { done: true })
      res.end()
    } catch (err) {
      const message = err?.publicMessage || err?.message || 'Slow benchmark failed'
      console.warn('speed-compare/live slow provider failed, using mock fallback:', message)
      runMockFallback('mock-fallback')
    }
  } catch (err) {
    next(err)
  }
}
