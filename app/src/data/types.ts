export type WindowBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type GenerationStatus = 'idle' | 'interpreting' | 'building' | 'ready' | 'error' | 'fixing'

export type FixEntry = {
  at: string
  error: string
  applied: boolean
}

export type AppWindow = {
  id: string
  title: string
  bounds: WindowBounds
  zIndex: number
  minimized: boolean
  status: GenerationStatus
  html: string
  spec?: unknown
  errors: FixEntry[]
}

export type UserPromptRequest = {
  id: string
  prompt: string
  createdAt: string
  screenshot?: string
}

export type AppSpec = {
  name: string
  purpose: string
  components: Array<{ name: string; kind: string; description: string }>
  notes?: string
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
