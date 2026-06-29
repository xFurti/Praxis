import type { WindowBounds } from '../data/types'
import { fitWindowToContent } from '../windows/windowSizing'

const MIN_FIXER_VISIBLE_MS = 900
const CONTENT_SIZE_WAIT_MS = 1600

export function waitForWindowContentSize(
  windowId: string,
  timeoutMs = CONTENT_SIZE_WAIT_MS,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; windowId?: string; width?: number; height?: number }
      if (
        data?.type !== 'praxis-content-size' ||
        data.windowId !== windowId ||
        typeof data.width !== 'number' ||
        typeof data.height !== 'number'
      ) {
        return
      }

      window.clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      resolve({ width: data.width, height: data.height })
    }

    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage)
      resolve(null)
    }, timeoutMs)

    window.addEventListener('message', onMessage)
  })
}

export async function settleWindowDimensions(options: {
  windowId: string
  bounds: WindowBounds
  onUpdate: (id: string, patch: { bounds: WindowBounds }) => void
  signal: AbortSignal
}) {
  const started = Date.now()
  const measured = await waitForWindowContentSize(options.windowId)

  if (!options.signal.aborted && measured) {
    options.onUpdate(options.windowId, {
      bounds: fitWindowToContent(measured.width, measured.height, options.bounds),
    })
  }

  const elapsed = Date.now() - started
  const remaining = MIN_FIXER_VISIBLE_MS - elapsed
  if (remaining > 0 && !options.signal.aborted) {
    await new Promise((resolve) => window.setTimeout(resolve, remaining))
  }
}
