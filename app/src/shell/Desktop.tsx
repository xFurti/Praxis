import { useCallback, useEffect, useRef } from 'react'
import { useWindowManager } from '../windows/useWindowManager'
import { AppWindowFrame } from '../windows/AppWindowFrame'
import { InteractionProvider } from '../windows/interactionContext'
import { AppFrame } from '../runtime/AppFrame'
import { startFixGeneration, startLiveGeneration, type LiveGenHandle } from '../runtime/liveGeneration'

declare global {
  interface Window {
    __praxisGenerate?: (p: string) => void
  }
}

export function Desktop() {
  const wm = useWindowManager()
  const handles = useRef<Map<string, LiveGenHandle>>(new Map())

  const generate = useCallback(
    (prompt: string) => {
      const title = deriveTitle(prompt)
      const win = wm.openWindow({ title, status: 'interpreting', html: '' })
      const handle = startLiveGeneration({
        win,
        prompt,
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
      const data = event.data as { type?: string; windowId?: string; error?: string }
      if (data?.type !== 'praxis-runtime-error' || !data.windowId || !data.error) {
        return
      }

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
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [wm])

  return (
    <InteractionProvider>
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

function deriveTitle(prompt: string) {
  const clean = prompt.trim().replace(/\s+/g, ' ')
  const head = clean.length > 24 ? clean.slice(0, 24) + '…' : clean
  return head || 'Untitled app'
}
