import type { AppSpec, AppWindow, GenerationStatus } from '../data/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

type LiveGenerationOptions = {
  win: AppWindow
  prompt: string
  onUpdate: (id: string, patch: Partial<AppWindow>) => void
  onStatus: (id: string, status: GenerationStatus) => void
  onHtml: (id: string, html: string) => void
}

export type LiveGenHandle = {
  windowId: string
  cancel: () => void
}

export function startLiveGeneration(options: LiveGenerationOptions): LiveGenHandle {
  const controller = new AbortController()

  void run(options, controller.signal)

  return {
    windowId: options.win.id,
    cancel: () => controller.abort(),
  }
}

async function run(options: LiveGenerationOptions, signal: AbortSignal) {
  const { win, prompt, onUpdate, onStatus, onHtml } = options

  try {
    onStatus(win.id, 'interpreting')
    const spec = await interpretPrompt(prompt, signal)
    onUpdate(win.id, {
      spec,
      title: spec.app_name || win.title,
    })

    onStatus(win.id, 'building')
    let html = ''

    for await (const chunk of buildStream(spec, signal)) {
      html += chunk
      onHtml(win.id, html)
    }

    onHtml(win.id, html)
    onStatus(win.id, 'ready')
  } catch (error) {
    if (signal.aborted) {
      return
    }

    onStatus(win.id, 'error')
    onUpdate(win.id, {
      errors: [
        {
          at: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Generation failed',
          applied: false,
        },
      ],
    })
    onHtml(win.id, buildErrorDocument(error instanceof Error ? error.message : 'Generation failed'))
  }
}

async function interpretPrompt(prompt: string, signal: AbortSignal): Promise<AppSpec> {
  const res = await fetch(`${API_BASE_URL}/api/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal,
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Interpreter request failed.'))
  }

  const data = (await res.json()) as { spec?: AppSpec }
  if (!data.spec) {
    throw new Error('Interpreter returned no app spec.')
  }

  return data.spec
}

async function* buildStream(spec: AppSpec, signal: AbortSignal) {
  const res = await fetch(`${API_BASE_URL}/api/build`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ spec }),
    signal,
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Builder request failed.'))
  }

  if (!res.body) {
    throw new Error('Builder stream returned no body.')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const event of events) {
        const parsed = parseSseEvent(event)
        if (parsed.error) {
          throw new Error(parsed.error)
        }
        if (parsed.chunk) {
          yield parsed.chunk
        }
        if (parsed.done) {
          return
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function parseSseEvent(event: string) {
  const lines = event.split('\n')
  const dataLines = lines.filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim())
  const payload = dataLines.join('')

  if (!payload) {
    return {}
  }

  try {
    return JSON.parse(payload) as { chunk?: string; done?: boolean; error?: string }
  } catch {
    return {}
  }
}

async function readApiError(res: Response, fallback: string) {
  try {
    const data = (await res.json()) as { error?: string }
    return data.error || fallback
  } catch {
    return fallback
  }
}

function buildErrorDocument(message: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:24px;font-family:Inter,system-ui,sans-serif;background:#070b1a;color:#e6ebff} .card{border:1px solid #243056;background:rgba(18,26,51,.82);border-radius:16px;padding:16px} h1{margin:0 0 12px;font-size:20px} p{margin:0;color:#8b93b8}</style></head><body><div class="card"><h1>Generation failed</h1><p>${escapeHtml(message)}</p></div></body></html>`
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
