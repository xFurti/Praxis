import { buildContentMeasureScript } from './contentMeasureScript'

export function withRuntimeMonitor(html: string, windowId: string) {
  if (html.includes('praxis-runtime-error')) {
    return html
  }

  const monitor = buildContentMeasureScript(windowId)

  if (html.includes('</body>')) {
    return html.replace('</body>', `${monitor}</body>`)
  }

  return `${html}${monitor}`
}
