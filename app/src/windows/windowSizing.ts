import type { AppSpec, WindowBounds } from '../data/types'
import { deriveCategoryFromSpec, getLearnedSizeForCategory } from '../runtime/learningMemory'

export const TITLE_BAR_HEIGHT = 36
export const TOP_BAR_HEIGHT = 48
const VIEWPORT_MARGIN = 24
const CONTENT_PADDING = 16
const MIN_WINDOW_WIDTH = 300
const MIN_WINDOW_HEIGHT = 200

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function fitWindowToContent(
  contentWidth: number,
  contentHeight: number,
  current: WindowBounds,
): WindowBounds {
  const maxWidth = Math.max(MIN_WINDOW_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2)
  const maxHeight = Math.max(MIN_WINDOW_HEIGHT, window.innerHeight - VIEWPORT_MARGIN * 2)

  const width = clamp(
    Math.ceil(contentWidth) + CONTENT_PADDING,
    MIN_WINDOW_WIDTH,
    maxWidth,
  )
  const height = clamp(
    Math.ceil(contentHeight) + CONTENT_PADDING + TITLE_BAR_HEIGHT,
    MIN_WINDOW_HEIGHT,
    maxHeight,
  )

  const x = clamp(current.x, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN))
  const y = clamp(current.y, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN))

  return { x, y, width, height }
}

/** Grow window if content needs more space; never shrink below measured need. */
export function fitWindowGrowToContent(
  contentWidth: number,
  contentHeight: number,
  current: WindowBounds,
): WindowBounds {
  const fitted = fitWindowToContent(contentWidth, contentHeight, current)
  return {
    ...fitted,
    width: Math.max(current.width, fitted.width),
    height: Math.max(current.height, fitted.height),
  }
}

export function defaultContentSizeForSpec(spec: AppSpec): { width: number; height: number } {
  const category = deriveCategoryFromSpec(spec)
  const learned = getLearnedSizeForCategory(category) ?? getLearnedSizeForCategory('general')
  if (learned && learned.samples >= 2) {
    return { width: learned.width, height: learned.height }
  }

  const text = `${spec.app_name} ${spec.description} ${spec.logic} ${spec.components.join(' ')}`.toLowerCase()

  if (/\bcalculator\b/.test(text)) {
    return { width: 340, height: 500 }
  }
  if (/\b(game|gaming|simulator|sim)\b/.test(text)) {
    return { width: 560, height: 480 }
  }
  if (text.includes('spreadsheet') || text.includes('sheet') || text.includes('csv') || text.includes('table')) {
    return { width: 680, height: 520 }
  }
  if (text.includes('store') || text.includes('shop') || text.includes('market')) {
    return { width: 580, height: 620 }
  }
  if (text.includes('todo') || text.includes('task') || text.includes('list')) {
    return { width: 420, height: 480 }
  }
  if (text.includes('dashboard') || text.includes('chart')) {
    return { width: 720, height: 560 }
  }

  if (spec.window_size === 'small') {
    return { width: 380, height: 360 }
  }
  if (spec.window_size === 'large') {
    return { width: 720, height: 580 }
  }

  return { width: 520, height: 460 }
}

export function defaultWindowBoundsForSpec(spec: AppSpec, current: WindowBounds): WindowBounds {
  const size = defaultContentSizeForSpec(spec)
  return fitWindowToContent(size.width, size.height, current)
}

export function desktopFullscreenBounds(): WindowBounds {
  return {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: Math.max(MIN_WINDOW_HEIGHT, window.innerHeight - TOP_BAR_HEIGHT),
  }
}
