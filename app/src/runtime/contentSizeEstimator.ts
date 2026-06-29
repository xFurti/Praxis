import type { AppSpec } from '../data/types'
import { defaultContentSizeForSpec, fitWindowGrowToContent } from '../windows/windowSizing'
import type { WindowBounds } from '../data/types'

export type SizeEstimate = {
  width: number
  height: number
}

/** Quick HTML heuristic during streaming — only used to grow the window. */
export function estimateFromHtml(html: string): SizeEstimate | null {
  if (!html || html.length < 80) {
    return null
  }

  const lower = html.toLowerCase()
  const buttonCount = (lower.match(/<button\b/g) || []).length
  const tableCount = (lower.match(/<table\b/g) || []).length
  const rowCount = (lower.match(/<tr\b/g) || []).length

  const gridCols = lower.match(/grid-template-columns:\s*repeat\(\s*(\d+)/)
  const gridRows = lower.match(/grid-template-rows:\s*repeat\(\s*(\d+)/)

  if (lower.includes('spreadsheet') || lower.includes('sheet') || tableCount > 0) {
    return { width: 680, height: 480 + rowCount * 28 }
  }
  if (lower.includes('store') || lower.includes('shop')) {
    return { width: 580, height: 620 }
  }
  if (gridCols) {
    const cols = Number(gridCols[1])
    const rows = gridRows ? Number(gridRows[1]) : Math.max(4, Math.ceil(buttonCount / Math.max(cols, 1)))
    return { width: cols * 68 + 64, height: rows * 68 + 140 }
  }
  if (lower.includes('praxis-calc-pad') || (/\bcalculator\b/.test(lower) && buttonCount >= 12)) {
    return { width: 340, height: 500 }
  }
  if (/\b(game|gaming|simulator|sim)\b/.test(lower)) {
    return { width: 560, height: 480 }
  }

  return null
}

export function mergeEstimates(...items: Array<SizeEstimate | null | undefined>): SizeEstimate | null {
  const valid = items.filter((item): item is SizeEstimate => Boolean(item))
  if (valid.length === 0) {
    return null
  }

  return {
    width: Math.max(...valid.map((item) => item.width)),
    height: Math.max(...valid.map((item) => item.height)),
  }
}

export function applyBuildSizeUpdate(
  spec: AppSpec,
  html: string,
  currentBounds: WindowBounds,
): WindowBounds {
  const merged = mergeEstimates(
    defaultContentSizeForSpec(spec),
    estimateFromHtml(html),
  )
  if (!merged) {
    return currentBounds
  }
  return fitWindowGrowToContent(merged.width, merged.height, currentBounds)
}
