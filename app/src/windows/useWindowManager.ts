import { useCallback, useEffect, useState } from 'react'
import type { AppWindow, GenerationStatus } from '../data/types'
import { desktopFullscreenBounds } from './windowSizing'

let zCounter = 10

export function useWindowManager() {
  const [windows, setWindows] = useState<AppWindow[]>([])

  const openWindow = useCallback((partial: Partial<AppWindow> & { title: string }) => {
    const id = partial.id ?? `win-${Date.now().toString(36)}`
    const win: AppWindow = {
      id,
      title: partial.title,
      bounds: partial.bounds ?? {
        x: 120 + (windows.length * 28) % 200,
        y: 90 + (windows.length * 28) % 160,
        width: 520,
        height: 380,
      },
      zIndex: ++zCounter,
      minimized: false,
      fullscreen: false,
      status: partial.status ?? 'building',
      html: partial.html ?? '',
      spec: partial.spec,
      errors: partial.errors ?? [],
    }
    setWindows((prev) => [...prev, win])
    return win
  }, [windows.length])

  const updateWindow = useCallback((id: string, patch: Partial<AppWindow>) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w
        const next = { ...w, ...patch }
        if (w.fullscreen && patch.bounds && patch.fullscreen !== false) {
          next.bounds = desktopFullscreenBounds()
        }
        return next
      }),
    )
  }, [])

  const setHtml = useCallback((id: string, html: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, html } : w)))
  }, [])

  const setStatus = useCallback((id: string, status: GenerationStatus) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)))
  }, [])

  const focus = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: ++zCounter, minimized: false } : w)),
    )
  }, [])

  const minimize = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)))
  }, [])

  const close = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id))
  }, [])

  const setBounds = useCallback((id: string, bounds: AppWindow['bounds']) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id || w.fullscreen) return w
        return { ...w, bounds }
      }),
    )
  }, [])

  const toggleFullscreen = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w
        if (w.fullscreen) {
          return {
            ...w,
            fullscreen: false,
            bounds: w.restoreBounds ?? w.bounds,
            restoreBounds: undefined,
          }
        }
        return {
          ...w,
          fullscreen: true,
          restoreBounds: w.bounds,
          bounds: desktopFullscreenBounds(),
          zIndex: ++zCounter,
          minimized: false,
        }
      }),
    )
  }, [])

  const syncFullscreenBounds = useCallback(() => {
    setWindows((prev) =>
      prev.map((w) => (w.fullscreen ? { ...w, bounds: desktopFullscreenBounds() } : w)),
    )
  }, [])

  useEffect(() => {
    const onResize = () => syncFullscreenBounds()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [syncFullscreenBounds])

  return {
    windows,
    openWindow,
    updateWindow,
    setHtml,
    setStatus,
    focus,
    minimize,
    close,
    setBounds,
    toggleFullscreen,
  }
}
