export type WindowBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type GenerationStatus =
  | 'idle'
  | 'interpreting'
  | 'building'
  | 'verifying'
  | 'ready'
  | 'error'
  | 'fixing'

export type FixEntry = {
  at: string
  error: string
  applied: boolean
}

export type BuildMetrics = {
  durationMs: number
  timeToFirstHtmlMs: number | null
  fastTokPerSec: number
  slowTokPerSec: number | null
  multimodal: boolean
}

export type AppWindow = {
  id: string
  title: string
  bounds: WindowBounds
  zIndex: number
  minimized: boolean
  fullscreen: boolean
  restoreBounds?: WindowBounds
  status: GenerationStatus
  html: string
  spec?: unknown
  errors: FixEntry[]
  buildMetrics?: BuildMetrics
}

export type UserPromptRequest = {
  id: string
  prompt: string
  createdAt: string
  screenshot?: string
}

export type AppDesign = {
  style_source: 'user' | 'inferred' | 'auto'
  theme_id?: string
  theme_name?: string
  layout?: string
  personality?: string
  ux_notes?: string
  palette?: {
    background?: string
    background_alt?: string
    surface?: string
    accent?: string
    accent_secondary?: string
    text?: string
    muted?: string
    color_scheme?: 'dark' | 'light'
    [key: string]: string | undefined
  }
}

export type AppSpec = {
  app_name: string
  description: string
  components: string[]
  logic: string
  window_size: 'small' | 'medium' | 'large'
  design?: AppDesign
}

export type GenerationResult = {
  html: string
  spec?: AppSpec
  fixes: FixEntry[]
}

export type GeneratedDoc = {
  windowId: string
  html: string
  valid: boolean
}
