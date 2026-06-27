import { useCallback, useEffect, useRef } from 'react'
import { useWindowManager } from '../windows/useWindowManager'
import { AppWindowFrame } from '../windows/AppWindowFrame'
import { AppFrame } from '../runtime/AppFrame'
import { startMockGeneration, type MockGenHandle } from '../runtime/mockGeneration'

declare global {
  interface Window {
    __praxisGenerate?: (p: string) => void
  }
}

export function Desktop() {
  const wm = useWindowManager()
  const handles = useRef<Map<string, MockGenHandle>>(new Map())

  const generate = useCallback(
    (prompt: string) => {
      const title = deriveTitle(prompt)
      const id = wm.openWindow({ title, status: 'interpreting', html: '' })
      const win = wm.windows.find((w) => w.id === id)
      if (!win) return
      const handle = startMockGeneration(win, wm.updateWindow, wm.setStatus, wm.setHtml)
      handles.current.set(id, handle)
    },
    [wm],
  )

  useEffect(() => {
    window.__praxisGenerate = generate
    return () => {
      delete window.__praxisGenerate
    }
  }, [generate])

  return (
    <>
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
    </>
  )
}

function deriveTitle(prompt: string) {
  const clean = prompt.trim().replace(/\s+/g, ' ')
  const head = clean.length > 24 ? clean.slice(0, 24) + '…' : clean
  return head || 'Untitled app'
}
