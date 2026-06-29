import { useCallback, useEffect, useRef } from 'react'
import { useWindowManager } from '../windows/useWindowManager'
import { AppWindowFrame } from '../windows/AppWindowFrame'
import { InteractionProvider } from '../windows/interactionContext'
import { AppFrame } from '../runtime/AppFrame'
import { startFixGeneration, startLiveGeneration, startProviderPreview, startRefineGeneration, type LiveGenHandle } from '../runtime/liveGeneration'
import { primeLearnedSizes, recordGenerationLearning } from '../runtime/learningMemory'
import type { AppSpec } from '../data/types'
import { fitWindowGrowToContent } from '../windows/windowSizing'
import { AgentOverlay } from '../agents/AgentOverlay'
import { CreationAmbience } from './CreationAmbience'
import { Taskbar } from './Taskbar'

declare global {
  interface Window {
    __praxisGenerate?: (prompt: string, screenshot?: string) => void
    __praxisOpenProviderPreview?: (providerId: 'fast' | 'slow', label: string) => void
  }
}

export function Desktop() {
  const wm = useWindowManager()
  const handles = useRef<Map<string, LiveGenHandle>>(new Map())
  const windowsRef = useRef(wm.windows)
  const contentMaxRef = useRef(new Map<string, { width: number; height: number }>())
  windowsRef.current = wm.windows
  const activeWorkflowWindow =
    [...wm.windows]
      .filter(
        (win) =>
          win.status === 'interpreting' ||
          win.status === 'building' ||
          win.status === 'verifying' ||
          win.status === 'fixing',
      )
      .sort((a, b) => b.zIndex - a.zIndex)[0] ?? undefined

  const emitTokens = useCallback((fast: number, slow: number | null) => {
    const detail: { fast?: number; slow?: number } = {}
    if (fast > 0) {
      detail.fast = fast
    }
    if (slow != null && slow > 0) {
      detail.slow = slow
    }
    if (detail.fast != null || detail.slow != null) {
      window.dispatchEvent(new CustomEvent('praxis-tokens', { detail }))
    }
  }, [])

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
        onTokensPerSec: emitTokens,
      })
      handles.current.set(win.id, handle)
    },
    [wm, emitTokens],
  )

  const refineWindow = useCallback(
    (id: string, changeRequest: string) => {
      const win = windowsRef.current.find((item) => item.id === id)
      if (!win || !win.spec) {
        return
      }

      handles.current.get(id)?.cancel()
      contentMaxRef.current.delete(id)

      const handle = startRefineGeneration({
        win,
        changeRequest,
        onUpdate: wm.updateWindow,
        onStatus: wm.setStatus,
        onHtml: wm.setHtml,
        onTokensPerSec: emitTokens,
      })
      handles.current.set(id, handle)
    },
    [wm, emitTokens],
  )

  const openProviderPreview = useCallback(
    (providerId: 'fast' | 'slow', label: string) => {
      const spec = window.__praxisLastSpec
      if (!spec) {
        return
      }

      const win = wm.openWindow({
        title: `${label} preview`,
        status: 'building',
        html: '',
      })

      const handle = startProviderPreview({
        win,
        spec,
        provider: providerId,
        onUpdate: wm.updateWindow,
        onStatus: wm.setStatus,
        onHtml: wm.setHtml,
      })
      handles.current.set(win.id, handle)
    },
    [wm],
  )

  useEffect(() => {
    void primeLearnedSizes()
  }, [])

  useEffect(() => {
    const onBuildComplete = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        windowId?: string
        refined?: boolean
        refinement_note?: string
      } | undefined

      const windowId = detail?.windowId
      if (!windowId) {
        return
      }

      // Allow iframe measure script to report final content size
      window.setTimeout(() => {
        const win = windowsRef.current.find((item) => item.id === windowId)
        if (!win || !win.spec) {
          return
        }

        const measured = contentMaxRef.current.get(windowId)
        void recordGenerationLearning({
          spec: win.spec as AppSpec,
          content_width: measured?.width,
          content_height: measured?.height,
          window_width: win.bounds.width,
          window_height: win.bounds.height,
          refined: Boolean(detail?.refined),
          refinement_note: detail?.refinement_note,
        })
      }, 600)
    }

    window.addEventListener('praxis-build-complete', onBuildComplete)
    return () => window.removeEventListener('praxis-build-complete', onBuildComplete)
  }, [])

  useEffect(() => {
    window.__praxisGenerate = generate
    window.__praxisOpenProviderPreview = openProviderPreview
    return () => {
      delete window.__praxisGenerate
      delete window.__praxisOpenProviderPreview
    }
  }, [generate, openProviderPreview])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string
        windowId?: string
        error?: string
        width?: number
        height?: number
      }

      if (
        data?.type === 'praxis-content-size' &&
        data.windowId &&
        typeof data.width === 'number' &&
        typeof data.height === 'number'
      ) {
        const win = windowsRef.current.find((item) => item.id === data.windowId)
        if (!win) {
          return
        }

        const stored = contentMaxRef.current.get(data.windowId) ?? { width: 0, height: 0 }
        stored.width = Math.max(stored.width, data.width)
        stored.height = Math.max(stored.height, data.height)
        contentMaxRef.current.set(data.windowId, stored)

        wm.setBounds(
          data.windowId,
          fitWindowGrowToContent(stored.width, stored.height, win.bounds),
        )
        return
      }

      if (data?.type === 'praxis-runtime-error' && data.windowId && data.error) {
        const win = windowsRef.current.find((item) => item.id === data.windowId)
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
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [wm.setBounds, wm.updateWindow, wm.setStatus, wm.setHtml])

  return (
    <InteractionProvider>
      <div className="relative h-full w-full">
        <CreationAmbience activeWindow={activeWorkflowWindow} />
        <AgentOverlay activeWindow={activeWorkflowWindow} />
        {wm.windows.map((w) => (
          <AppWindowFrame
            key={w.id}
            win={w}
            onFocus={wm.focus}
            onMinimize={wm.minimize}
            onToggleFullscreen={wm.toggleFullscreen}
            onClose={(id) => {
              handles.current.get(id)?.cancel()
              handles.current.delete(id)
              contentMaxRef.current.delete(id)
              wm.close(id)
            }}
            onRefine={refineWindow}
            onBoundsChange={wm.setBounds}
          >
            <AppFrame win={w} />
          </AppWindowFrame>
        ))}
        <Taskbar
          windows={wm.windows}
          onRestore={wm.focus}
          onClose={(id) => {
            handles.current.get(id)?.cancel()
            handles.current.delete(id)
            contentMaxRef.current.delete(id)
            wm.close(id)
          }}
        />
      </div>
    </InteractionProvider>
  )
}

function deriveTitle(prompt: string) {
  const clean = prompt.trim().replace(/\s+/g, ' ')
  const head = clean.length > 24 ? clean.slice(0, 24) + '…' : clean
  return head || 'Untitled app'
}
