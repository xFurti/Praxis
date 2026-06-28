import type { AppSpec, AppWindow, GenerationStatus } from '../data/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

type LiveGenerationOptions = {
  win: AppWindow
  prompt: string
  screenshot?: string
  onUpdate: (id: string, patch: Partial<AppWindow>) => void
  onStatus: (id: string, status: GenerationStatus) => void
  onHtml: (id: string, html: string) => void
}

export type LiveGenHandle = {
  windowId: string
  cancel: () => void
}

type FixOptions = {
  win: AppWindow
  error: string
  onUpdate: (id: string, patch: Partial<AppWindow>) => void
  onStatus: (id: string, status: GenerationStatus) => void
  onHtml: (id: string, html: string) => void
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
  const { win, prompt, screenshot, onUpdate, onStatus, onHtml } = options

  try {
    onStatus(win.id, 'interpreting')
    const spec = validateSpec(await interpretPrompt(prompt, screenshot, signal))
    onUpdate(win.id, {
      spec,
      title: spec.app_name || win.title,
      bounds: {
        ...win.bounds,
        ...boundsForWindowSize(spec.window_size),
      },
    })

    onStatus(win.id, 'building')
    let html = ''

    for await (const chunk of buildStream(spec, signal)) {
      html += chunk
      onHtml(win.id, html)
    }

    // Strip markdown fences the model may have wrapped around the HTML
    html = stripHtmlFences(html)
    html = await ensureValidHtml(html, 'Generated HTML failed validation.', signal)
    html = withRuntimeMonitor(html, win.id)
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

export function startFixGeneration(options: FixOptions): LiveGenHandle {
  const controller = new AbortController()

  void runFix(options, controller.signal)

  return {
    windowId: options.win.id,
    cancel: () => controller.abort(),
  }
}

async function runFix(options: FixOptions, signal: AbortSignal) {
  const { win, error, onUpdate, onStatus, onHtml } = options

  try {
    onStatus(win.id, 'fixing')
    const errorEntry = { at: new Date().toISOString(), error, applied: false }
    onUpdate(win.id, {
      errors: [...win.errors, errorEntry],
    })

    let fixed = await requestFix(win.html, error, signal)
    fixed = await ensureValidHtml(fixed, error, signal)
    fixed = withRuntimeMonitor(fixed, win.id)

    onHtml(win.id, fixed)
    onUpdate(win.id, {
      errors: [...win.errors, { ...errorEntry, applied: true }],
    })
    onStatus(win.id, 'ready')
  } catch (fixError) {
    if (signal.aborted) {
      return
    }

    onStatus(win.id, 'error')
    onHtml(win.id, buildErrorDocument(fixError instanceof Error ? fixError.message : 'Fix failed'))
  }
}

async function describeImage(screenshot: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/vision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ screenshot }),
    signal,
  })

  if (!res.ok) {
    // Vision failed — fall back gracefully, don't block generation
    return ''
  }

  const data = (await res.json()) as { description?: string }
  return data.description || ''
}

async function interpretPrompt(prompt: string, screenshot: string | undefined, signal: AbortSignal): Promise<AppSpec> {
  // If a screenshot is present, run the vision agent first to get a detailed text description
  // Then pass that description as the prompt to the interpreter (text-only, more reliable)
  let effectivePrompt = prompt
  if (screenshot) {
    const visionDescription = await describeImage(screenshot, signal)
    if (visionDescription) {
      effectivePrompt = visionDescription + (prompt ? `\n\nUser note: ${prompt}` : '')
    }
  }

  const res = await fetch(`${API_BASE_URL}/api/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: effectivePrompt }),
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

async function requestFix(html: string, error: string, signal: AbortSignal) {
  const res = await fetch(`${API_BASE_URL}/api/fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, error }),
    signal,
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Fixer request failed.'))
  }

  const data = (await res.json()) as { html?: string }
  if (!data.html) {
    throw new Error('Fixer returned no HTML.')
  }

  return data.html
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

function validateSpec(raw: AppSpec) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Interpreter returned an invalid spec payload.')
  }

  if (!raw.app_name || !raw.description || !raw.logic) {
    throw new Error('Interpreter spec is missing required fields.')
  }

  if (!Array.isArray(raw.components) || raw.components.some((item) => typeof item !== 'string')) {
    throw new Error('Interpreter spec components must be a string array.')
  }

  if (!['small', 'medium', 'large'].includes(raw.window_size)) {
    throw new Error('Interpreter spec has an invalid window_size.')
  }

  return raw
}

async function ensureValidHtml(html: string, errorContext: string, signal: AbortSignal) {
  const validationError = validateGeneratedHtml(html)
  if (!validationError) {
    return html
  }

  const fixed = await requestFix(html, `${errorContext} ${validationError}`, signal)
  const revalidation = validateGeneratedHtml(fixed)
  if (revalidation) {
    throw new Error(`Generated HTML is still invalid after fix: ${revalidation}`)
  }

  return fixed
}

function validateGeneratedHtml(html: string) {
  const text = (html || '').trim().toLowerCase()

  if (!text.startsWith('<!doctype html>') && !text.startsWith('<html')) {
    return 'Missing <!DOCTYPE html> or <html> root.'
  }
  if (!text.includes('<html')) {
    return 'Missing <html> tag.'
  }
  if (!text.includes('<body')) {
    return 'Missing <body> tag.'
  }
  if (!text.includes('</html>')) {
    return 'Missing closing </html> tag.'
  }

  return null
}

function withRuntimeMonitor(html: string, windowId: string) {
  const monitor = `<script>(function(){if(window.__praxisRuntimeMonitorInstalled)return;window.__praxisRuntimeMonitorInstalled=true;function post(payload){try{parent.postMessage(Object.assign({windowId:${JSON.stringify(windowId)}},payload),'*')}catch(_e){}}function send(error){post({type:'praxis-runtime-error',error:String(error||'Unknown runtime error')})}function preferredContentBox(){var body=document.body;var doc=document.documentElement;var card=document.querySelector('.praxis-card');var bodyStyle=body?window.getComputedStyle(body):null;var px=function(v){var n=parseFloat(v||'0');return Number.isFinite(n)?n:0};var padX=bodyStyle?px(bodyStyle.paddingLeft)+px(bodyStyle.paddingRight):0;var padY=bodyStyle?px(bodyStyle.paddingTop)+px(bodyStyle.paddingBottom):0;if(card&&card.getBoundingClientRect){var rect=card.getBoundingClientRect();return {width:Math.ceil(rect.width+padX),height:Math.ceil(rect.height+padY)}}return {width:Math.max(window.innerWidth,doc?doc.clientWidth:0,body?body.clientWidth:0),height:Math.max(window.innerHeight,doc?doc.clientHeight:0,body?body.clientHeight:0)}}function reportSize(){try{var box=preferredContentBox();post({type:'praxis-content-size',width:box.width,height:box.height})}catch(_e){}}window.addEventListener('error',function(event){send(event.message||event.error&&event.error.message||'Runtime error')});window.addEventListener('unhandledrejection',function(event){var reason=event.reason;send(reason&&reason.message?reason.message:String(reason||'Unhandled promise rejection'))});window.addEventListener('load',reportSize);window.addEventListener('resize',reportSize);if(window.ResizeObserver){if(document.body){new ResizeObserver(reportSize).observe(document.body)}var card=document.querySelector('.praxis-card');if(card){new ResizeObserver(reportSize).observe(card)}}setTimeout(reportSize,50);setTimeout(reportSize,250);})();</script>`

  if (html.includes('praxis-runtime-error')) {
    return html
  }

  if (html.includes('</body>')) {
    return html.replace('</body>', `${monitor}</body>`)
  }

  return `${html}${monitor}`
}

function stripHtmlFences(text: string) {
  const t = text.trim()
  // Remove leading ```html or ``` fence
  const withoutOpen = t.replace(/^```(?:html)?\s*/i, '')
  // Remove trailing ``` fence
  const withoutClose = withoutOpen.replace(/\s*```\s*$/i, '')
  return withoutClose
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function boundsForWindowSize(size: AppSpec['window_size']) {
  if (size === 'small') {
    return { width: 440, height: 320 }
  }

  if (size === 'large') {
    return { width: 760, height: 520 }
  }

  return { width: 560, height: 400 }
}
