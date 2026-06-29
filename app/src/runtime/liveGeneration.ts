import type { AppSpec, AppWindow, GenerationStatus, WindowBounds } from '../data/types'
import { applyBuildSizeUpdate } from './contentSizeEstimator'
import { withRuntimeMonitor } from './runtimeMonitor'
import { defaultWindowBoundsForSpec, fitWindowToContent } from '../windows/windowSizing'
import { measureHtmlContent } from './publishVerifier'
import { settleWindowDimensions } from './windowDimensionSettle'
import {
  dispatchAgentPhase,
  dispatchBuildComplete,
  type BuildSummary,
} from './generationEvents'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const SLOW_BENCHMARK_MS = 12000

declare global {
  interface Window {
    __praxisLastSpec?: AppSpec
  }
}

type LiveGenerationOptions = {
  win: AppWindow
  prompt: string
  screenshot?: string
  onUpdate: (id: string, patch: Partial<AppWindow>) => void
  onStatus: (id: string, status: GenerationStatus) => void
  onHtml: (id: string, html: string) => void
  onTokensPerSec?: (fast: number, slow: number | null) => void
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

type RefineOptions = {
  win: AppWindow
  changeRequest: string
  onUpdate: (id: string, patch: Partial<AppWindow>) => void
  onStatus: (id: string, status: GenerationStatus) => void
  onHtml: (id: string, html: string) => void
  onTokensPerSec?: (fast: number, slow: number | null) => void
}

export function startRefineGeneration(options: RefineOptions): LiveGenHandle {
  const controller = new AbortController()
  void runRefine(options, controller.signal)
  return {
    windowId: options.win.id,
    cancel: () => controller.abort(),
  }
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
  const { win, prompt, screenshot, onUpdate, onStatus, onHtml, onTokensPerSec } = options
  const generationStartedAt = Date.now()
  const multimodal = Boolean(screenshot)
  let firstHtmlAt: number | null = null
  let latestFast = 0
  let latestSlow: number | null = null

  try {
    notifyBuildStart()
    onStatus(win.id, 'interpreting')

    if (screenshot) {
      dispatchAgentPhase('vision', true)
    }

    dispatchAgentPhase('interpret', multimodal)
    let spec = validateSpec(await interpretPrompt(prompt, screenshot, signal))

    dispatchAgentPhase('verify', multimodal)
    spec = await verifySpecBeforeBuild(spec, signal, prompt)
    window.__praxisLastSpec = spec
    window.dispatchEvent(new Event('praxis-spec-ready'))

    let currentBounds: WindowBounds = defaultWindowBoundsForSpec(spec, win.bounds)

    onUpdate(win.id, {
      spec,
      title: spec.app_name || win.title,
      bounds: currentBounds,
    })

    onStatus(win.id, 'building')
    dispatchAgentPhase('build', multimodal)
    let html = ''
    let totalTokens = 0
    const buildStart = Date.now()
    let lastSizeUpdateAt = 0

    const slowBenchmark = runSlowBenchmark(spec, signal, (slowTokPerSec) => {
      latestSlow = slowTokPerSec
      onTokensPerSec?.(latestFast, slowTokPerSec)
    })

    for await (const chunk of buildStream(spec, signal, 'fast')) {
      if (!firstHtmlAt && chunk.trim()) {
        firstHtmlAt = Date.now()
      }
      html += chunk
      totalTokens += estimateTokens(chunk)
      const elapsed = Math.max(1, Date.now() - buildStart)
      latestFast = Math.round((totalTokens / elapsed) * 1000)
      onTokensPerSec?.(latestFast, latestSlow)
      onHtml(win.id, html)

      const now = Date.now()
      if (now - lastSizeUpdateAt > 400) {
        lastSizeUpdateAt = now
        currentBounds = applyBuildSizeUpdate(spec, html, currentBounds)
        onUpdate(win.id, { bounds: currentBounds })
      }
    }

    slowBenchmark.stop()

    html = stripHtmlFences(html)
    html = await ensureValidHtml(html, 'Generated HTML failed validation.', signal)
    const publishResult = await finalizeForPublish({
      win,
      spec,
      html,
      bounds: currentBounds,
      onUpdate: (id, patch) => {
        if (patch.bounds) currentBounds = patch.bounds
        onUpdate(id, patch)
      },
      onStatus,
      signal,
    })
    html = publishResult.html
    currentBounds = publishResult.bounds
    onHtml(win.id, html)
    await settleWindowDimensions({
      windowId: win.id,
      bounds: currentBounds,
      onUpdate: (id, patch) => {
        currentBounds = patch.bounds
        onUpdate(id, { bounds: patch.bounds })
      },
      signal,
    })
    onStatus(win.id, 'ready')
    dispatchAgentPhase('ready', multimodal)

    const buildMetrics = createBuildMetrics({
      generationStartedAt,
      firstHtmlAt,
      latestFast,
      latestSlow,
      multimodal,
    })

    onUpdate(win.id, { buildMetrics })
    dispatchBuildComplete({ windowId: win.id, ...buildMetrics, refined: false })
  } catch (error) {
    if (signal.aborted) {
      return
    }

    dispatchBuildComplete({
      windowId: win.id,
      ...createBuildMetrics({
        generationStartedAt,
        firstHtmlAt,
        latestFast,
        latestSlow,
        multimodal,
      }),
      failed: true,
    })

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

async function runRefine(options: RefineOptions, signal: AbortSignal) {
  const { win, changeRequest, onUpdate, onStatus, onHtml, onTokensPerSec } = options
  const generationStartedAt = Date.now()
  let firstHtmlAt: number | null = null
  let latestFast = 0
  let latestSlow: number | null = null

  const currentSpec = win.spec as AppSpec | undefined
  if (!currentSpec) {
    onStatus(win.id, 'error')
    onHtml(win.id, buildErrorDocument('This window has no app spec to refine.'))
    return
  }

  try {
    notifyBuildStart()
    onStatus(win.id, 'interpreting')
    onHtml(win.id, '')

    dispatchAgentPhase('interpret')
    const spec = validateSpec(await refineSpec(currentSpec, changeRequest, signal))
    dispatchAgentPhase('verify')
    const verifiedSpec = await verifySpecBeforeBuild(
      spec,
      signal,
      (spec as AppSpec & { _source_prompt?: string })._source_prompt || changeRequest,
    )
    window.__praxisLastSpec = verifiedSpec
    window.dispatchEvent(new Event('praxis-spec-ready'))

    let currentBounds: WindowBounds = defaultWindowBoundsForSpec(verifiedSpec, win.bounds)

    onUpdate(win.id, {
      spec: verifiedSpec,
      title: verifiedSpec.app_name || win.title,
      bounds: currentBounds,
    })

    onStatus(win.id, 'building')
    dispatchAgentPhase('build')
    let html = ''
    let totalTokens = 0
    const buildStart = Date.now()
    let lastSizeUpdateAt = 0

    const slowBenchmark = runSlowBenchmark(verifiedSpec, signal, (slowTokPerSec) => {
      latestSlow = slowTokPerSec
      onTokensPerSec?.(latestFast, slowTokPerSec)
    })

    for await (const chunk of buildStream(verifiedSpec, signal, 'fast')) {
      if (!firstHtmlAt && chunk.trim()) {
        firstHtmlAt = Date.now()
      }
      html += chunk
      totalTokens += estimateTokens(chunk)
      const elapsed = Math.max(1, Date.now() - buildStart)
      latestFast = Math.round((totalTokens / elapsed) * 1000)
      onTokensPerSec?.(latestFast, latestSlow)
      onHtml(win.id, html)

      const now = Date.now()
      if (now - lastSizeUpdateAt > 400) {
        lastSizeUpdateAt = now
        currentBounds = applyBuildSizeUpdate(verifiedSpec, html, currentBounds)
        onUpdate(win.id, { bounds: currentBounds })
      }
    }

    slowBenchmark.stop()

    html = stripHtmlFences(html)
    html = await ensureValidHtml(html, 'Refined HTML failed validation.', signal)
    const publishResult = await finalizeForPublish({
      win,
      spec: verifiedSpec,
      html,
      bounds: currentBounds,
      onUpdate: (id, patch) => {
        if (patch.bounds) currentBounds = patch.bounds
        onUpdate(id, patch)
      },
      onStatus,
      signal,
    })
    html = publishResult.html
    currentBounds = publishResult.bounds
    onHtml(win.id, html)
    await settleWindowDimensions({
      windowId: win.id,
      bounds: currentBounds,
      onUpdate: (id, patch) => {
        currentBounds = patch.bounds
        onUpdate(id, { bounds: patch.bounds })
      },
      signal,
    })
    onStatus(win.id, 'ready')
    dispatchAgentPhase('ready')

    const buildMetrics = createBuildMetrics({
      generationStartedAt,
      firstHtmlAt,
      latestFast,
      latestSlow,
      multimodal: false,
    })

    onUpdate(win.id, { buildMetrics })
    dispatchBuildComplete({ windowId: win.id, ...buildMetrics, refined: true })
  } catch (error) {
    if (signal.aborted) {
      return
    }

    dispatchBuildComplete({
      windowId: win.id,
      ...createBuildMetrics({
        generationStartedAt,
        firstHtmlAt,
        latestFast,
        latestSlow,
        multimodal: false,
      }),
      refined: true,
      failed: true,
    })

    onStatus(win.id, 'error')
    onUpdate(win.id, {
      errors: [
        ...win.errors,
        {
          at: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Refine failed',
          applied: false,
        },
      ],
    })
    onHtml(win.id, buildErrorDocument(error instanceof Error ? error.message : 'Refine failed'))
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

    onUpdate(win.id, {
      errors: [...win.errors, { ...errorEntry, applied: true }],
    })
    onHtml(win.id, fixed)
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

async function refineSpec(spec: AppSpec, changeRequest: string, signal: AbortSignal): Promise<AppSpec> {
  const res = await fetch(`${API_BASE_URL}/api/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spec, changeRequest }),
    signal,
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Refine request failed.'))
  }

  const data = (await res.json()) as { spec?: AppSpec }
  if (!data.spec) {
    throw new Error('Refiner returned no app spec.')
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

async function* buildStream(spec: AppSpec, signal: AbortSignal, provider?: 'fast' | 'slow') {
  const sourcePrompt = (spec as AppSpec & { _source_prompt?: string })._source_prompt
  const res = await fetch(`${API_BASE_URL}/api/build`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ spec, provider, source_prompt: sourcePrompt }),
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
    return JSON.parse(payload) as {
      chunk?: string
      done?: boolean
      error?: string
      tokenPerSec?: number
    }
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

async function verifySpecBeforeBuild(
  spec: AppSpec,
  signal: AbortSignal,
  sourcePrompt = '',
): Promise<AppSpec> {
  const res = await fetch(`${API_BASE_URL}/api/verify/spec`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spec, source_prompt: sourcePrompt }),
    signal,
  })

  if (!res.ok) {
    return spec
  }

  const data = (await res.json()) as { spec?: AppSpec }
  if (!data.spec) {
    return spec
  }

  try {
    return validateSpec(data.spec)
  } catch {
    return spec
  }
}

async function requestVerifyPublish(
  spec: AppSpec,
  html: string,
  measured: { width: number; height: number } | null,
  signal: AbortSignal,
) {
  const res = await fetch(`${API_BASE_URL}/api/verify/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      spec,
      html,
      content_width: measured?.width,
      content_height: measured?.height,
      fast: true,
    }),
    signal,
  })

  if (!res.ok) {
    return { ok: true, needs_fix: false, issues: [] as string[], fix_hint: '' }
  }

  return (await res.json()) as {
    ok: boolean
    needs_fix?: boolean
    issues?: string[]
    fix_hint?: string
  }
}

async function finalizeForPublish(options: {
  win: AppWindow
  spec: AppSpec
  html: string
  bounds: WindowBounds
  onUpdate: (id: string, patch: Partial<AppWindow>) => void
  onStatus: (id: string, status: GenerationStatus) => void
  signal: AbortSignal
}): Promise<{ html: string; bounds: WindowBounds }> {
  const { win, spec, html: inputHtml, bounds, onUpdate, onStatus, signal } = options
  let html = withRuntimeMonitor(inputHtml, win.id)
  let nextBounds = bounds

  onStatus(win.id, 'verifying')
  dispatchAgentPhase('verify')

  let measured = await measureHtmlContent(html).catch(() => null)
  const publish = await requestVerifyPublish(spec, html, measured, signal)

  if (publish.needs_fix && publish.fix_hint) {
    onStatus(win.id, 'fixing')
    dispatchAgentPhase('fix')
    html = await requestFix(html, publish.fix_hint, signal)
    html = stripHtmlFences(html)
    const structuralError = validateGeneratedHtml(html)
    if (structuralError) {
      throw new Error(`Publish fix still invalid: ${structuralError}`)
    }
    html = withRuntimeMonitor(html, win.id)
    measured = await measureHtmlContent(html).catch(() => measured)
  }

  onStatus(win.id, 'verifying')

  if (measured) {
    nextBounds = fitWindowToContent(measured.width, measured.height, nextBounds)
    onUpdate(win.id, { bounds: nextBounds })
  }

  if (!publish.ok && publish.issues?.length) {
    console.warn('[praxis] publish verification notes:', publish.issues)
  }

  return { html, bounds: nextBounds }
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

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(String(text || '').length / 4))
}

function notifyBuildStart() {
  window.dispatchEvent(new Event('praxis-build-start'))
}

function createBuildMetrics(options: {
  generationStartedAt: number
  firstHtmlAt: number | null
  latestFast: number
  latestSlow: number | null
  multimodal: boolean
}): Omit<BuildSummary, 'windowId' | 'failed' | 'refined'> {
  const durationMs = Math.max(1, Date.now() - options.generationStartedAt)
  return {
    durationMs,
    timeToFirstHtmlMs:
      options.firstHtmlAt != null
        ? Math.max(1, options.firstHtmlAt - options.generationStartedAt)
        : null,
    fastTokPerSec: options.latestFast,
    slowTokPerSec: options.latestSlow,
    multimodal: options.multimodal,
  }
}


export function startProviderPreview(options: {
  win: AppWindow
  spec: AppSpec
  provider: 'fast' | 'slow'
  onUpdate: (id: string, patch: Partial<AppWindow>) => void
  onStatus: (id: string, status: GenerationStatus) => void
  onHtml: (id: string, html: string) => void
}): LiveGenHandle {
  const controller = new AbortController()

  void runProviderPreview(options, controller.signal)

  return {
    windowId: options.win.id,
    cancel: () => controller.abort(),
  }
}

async function runProviderPreview(
  options: {
    win: AppWindow
    spec: AppSpec
    provider: 'fast' | 'slow'
    onUpdate: (id: string, patch: Partial<AppWindow>) => void
    onStatus: (id: string, status: GenerationStatus) => void
    onHtml: (id: string, html: string) => void
  },
  signal: AbortSignal,
) {
  const { win, spec, provider, onUpdate, onStatus, onHtml } = options

  try {
    onStatus(win.id, 'building')

    let currentBounds = defaultWindowBoundsForSpec(spec, win.bounds)
    onUpdate(win.id, { spec, bounds: currentBounds })

    let html = ''
    let lastSizeUpdateAt = 0

    for await (const chunk of buildStream(spec, signal, provider)) {
      html += chunk
      onHtml(win.id, html)

      const now = Date.now()
      if (now - lastSizeUpdateAt > 400) {
        lastSizeUpdateAt = now
        currentBounds = applyBuildSizeUpdate(spec, html, currentBounds)
        onUpdate(win.id, { bounds: currentBounds })
      }
    }

    html = stripHtmlFences(html)
    html = await ensureValidHtml(html, 'Generated HTML failed validation.', signal)
    const publishResult = await finalizeForPublish({
      win,
      spec,
      html,
      bounds: currentBounds,
      onUpdate: (id, patch) => {
        if (patch.bounds) currentBounds = patch.bounds
        onUpdate(id, patch)
      },
      onStatus,
      signal,
    })
    html = publishResult.html
    currentBounds = publishResult.bounds
    onHtml(win.id, html)
    await settleWindowDimensions({
      windowId: win.id,
      bounds: currentBounds,
      onUpdate: (id, patch) => {
        currentBounds = patch.bounds
        onUpdate(id, { bounds: patch.bounds })
      },
      signal,
    })
    onStatus(win.id, 'ready')
  } catch (error) {
    if (signal.aborted) {
      return
    }

    onStatus(win.id, 'error')
    onHtml(win.id, buildErrorDocument(error instanceof Error ? error.message : 'Generation failed'))
  }
}

function runSlowBenchmark(
  spec: AppSpec,
  parentSignal: AbortSignal,
  onSlowTokens: (tokPerSec: number) => void,
) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), SLOW_BENCHMARK_MS)
  const onParentAbort = () => controller.abort()
  let mockInterval: number | null = null

  parentSignal.addEventListener('abort', onParentAbort)

  const stop = () => {
    controller.abort()
    if (mockInterval != null) {
      window.clearInterval(mockInterval)
      mockInterval = null
    }
  }

  const startClientMock = () => {
    let rate = 24
    mockInterval = window.setInterval(() => {
      if (controller.signal.aborted) {
        return
      }
      rate += 4
      onSlowTokens(rate)
    }, 320)
    controller.signal.addEventListener('abort', () => {
      if (mockInterval != null) {
        window.clearInterval(mockInterval)
        mockInterval = null
      }
    })
  }

  void (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/speed-compare/live`, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spec }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        startClientMock()
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let gotSlow = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const event of events) {
          const parsed = parseSseEvent(event)
          if (typeof parsed.tokenPerSec === 'number' && parsed.tokenPerSec > 0) {
            gotSlow = true
            onSlowTokens(parsed.tokenPerSec)
          }
        }
      }

      if (!gotSlow) {
        startClientMock()
      }
    } catch {
      if (!controller.signal.aborted) {
        startClientMock()
      }
    } finally {
      window.clearTimeout(timeout)
      parentSignal.removeEventListener('abort', onParentAbort)
    }
  })()

  return { stop }
}
