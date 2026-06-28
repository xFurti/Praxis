import { useCallback, useEffect, useRef } from 'react'
import { useWindowManager } from '../windows/useWindowManager'
import { AppWindowFrame } from '../windows/AppWindowFrame'
import { InteractionProvider } from '../windows/interactionContext'
import { AppFrame } from '../runtime/AppFrame'
import { startFixGeneration, startLiveGeneration, type LiveGenHandle } from '../runtime/liveGeneration'
import { AgentOverlay } from '../agents/AgentOverlay'

declare global {
  interface Window {
    __praxisGenerate?: (prompt: string, screenshot?: string) => void
  }
}

export function Desktop() {
  const wm = useWindowManager()
  const handles = useRef<Map<string, LiveGenHandle>>(new Map())
  const activeWorkflowWindow =
    [...wm.windows]
      .filter((win) => win.status === 'interpreting' || win.status === 'building' || win.status === 'fixing')
      .sort((a, b) => b.zIndex - a.zIndex)[0] ?? undefined

  const generate = useCallback(
    (prompt: string, screenshot?: string) => {
      const title = deriveTitle(prompt)
      const win = wm.openWindow({ title, status: 'interpreting', html: '' })
      const handle = startLiveGeneration({
        win,
        prompt,
        screenshot,
        onUpdate: wm.updateWindow,
        onStatus: wm.setStatus,
        onHtml: wm.setHtml,
      })
      handles.current.set(win.id, handle)
    },
    [wm],
  )

  useEffect(() => {
    window.__praxisGenerate = generate
    return () => {
      delete window.__praxisGenerate
    }
  }, [generate])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string
        windowId?: string
        error?: string
        width?: number
        height?: number
      }

      if (data?.type === 'praxis-runtime-error' && data.windowId && data.error) {
        const win = wm.windows.find((item) => item.id === data.windowId)
        if (!win || win.status === 'fixing' || win.errors.length >= 3) {
          return
        }

        handles.current.get(win.id)?.cancel()
        const handle = startFixGeneration({
          win,
          error: data.error,
          onUpdate: wm.updateWindow,
          onStatus: wm.setStatus,
          onHtml: wm.setHtml,
        })
        handles.current.set(win.id, handle)
        return
      }

      if (data?.type === 'praxis-content-size' && data.windowId && data.width && data.height) {
        const win = wm.windows.find((item) => item.id === data.windowId)
        if (!win) {
          return
        }

        wm.setBounds(data.windowId, {
          ...win.bounds,
          width: clamp(data.width + 28, 380, 980),
          height: clamp(data.height + 42, 260, 760),
        })
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [wm])

  return (
    <InteractionProvider>
      <AgentOverlay activeWindow={activeWorkflowWindow} />
      {wm.windows.map((w) => (
        <AppWindowFrame
          key={w.id}
          win={w}
          onFocus={wm.focus}
          onMinimize={wm.minimize}
          onClose={(id) => {
            handles.current.get(id)?.cancel()
            handles.current.delete(id)
            wm.close(id)
          }}
          onBoundsChange={wm.setBounds}
        >
          <AppFrame win={w} />
        </AppWindowFrame>
      ))}
    </InteractionProvider>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function deriveTitle(prompt: string) {
  const clean = prompt.trim().replace(/\s+/g, ' ')
  const head = clean.length > 24 ? clean.slice(0, 24) + '…' : clean
  return head || 'Untitled app'
}
