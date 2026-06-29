import { useCallback, useState } from 'react'
import { useSpeechInput } from './useSpeechInput'

type PromptBarProps = {
  onSubmit?: (prompt: string, screenshot?: string) => void
  placeholder?: string
  multimodal?: boolean
}

export function PromptBar({
  onSubmit,
  placeholder = 'Describe an app and watch it appear...',
  multimodal = false,
}: PromptBarProps) {
  const [value, setValue] = useState('')
  const [screenshot, setScreenshot] = useState<string | undefined>()
  const [dragging, setDragging] = useState(false)
  const [focused, setFocused] = useState(false)
  const [uploading, setUploading] = useState(false)

  const applyTranscript = useCallback((text: string) => {
    setValue(text)
  }, [])

  const speech = useSpeechInput({ onTranscript: applyTranscript })

  const submit = () => {
    speech.stop()
    const trimmed = value.trim()
    if (!trimmed && !screenshot) return
    onSubmit?.(trimmed || 'Replicate or take inspiration from the attached screenshot', screenshot)
    setValue('')
    setScreenshot(undefined)
  }

  const onFileChange = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await compressImage(file, 1024, 0.8)
      setScreenshot(dataUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-6">
      <div className="pointer-events-auto w-full max-w-3xl">
        {screenshot && (
          <div className="animate-upload-reveal relative mb-2 flex items-center gap-3 overflow-hidden rounded-2xl border border-praxis-cyan/30 bg-praxis-glass-strong/80 px-3 py-2 shadow-float backdrop-blur-xl">
            <div className="absolute inset-0 bg-tech-magic/5" aria-hidden="true" />
            <img
              src={screenshot}
              alt="Attached screenshot"
              className="relative h-12 w-16 animate-upload-pop rounded-lg object-cover ring-1 ring-praxis-cyan/40"
            />
            <div className="relative flex flex-1 flex-col gap-0.5">
              <span className="text-xs font-medium text-praxis-cyan">Screenshot attached</span>
              <span className="text-[11px] text-praxis-muted">
                Vision agent will analyze the layout
              </span>
            </div>
            <button
              className="relative grid h-6 w-6 place-items-center rounded-full text-praxis-muted transition hover:text-red-400"
              onClick={() => setScreenshot(undefined)}
              aria-label="Remove screenshot"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {uploading && (
          <div className="animate-upload-reveal mb-2 flex items-center gap-2 rounded-2xl border border-praxis-hairline bg-praxis-glass-strong/70 px-3 py-2 text-xs text-praxis-muted backdrop-blur-xl">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-praxis-cyan/30 border-t-praxis-cyan" />
            Processing image…
          </div>
        )}

        {speech.error && (
          <div className="animate-upload-reveal mb-2 rounded-2xl border border-red-400/30 bg-red-400/5 px-3 py-2 text-xs text-red-300 backdrop-blur-xl">
            {speech.error}
          </div>
        )}

        <div
          className={`praxis-card flex items-center gap-2 p-2 transition-all duration-300 ${
            focused ? 'ring-1 ring-praxis-cyan/40 shadow-active' : ''
          } ${dragging ? 'ring-1 ring-praxis-violet/50' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void onFileChange(e.dataTransfer.files?.[0])
          }}
        >
          <button
            type="button"
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition ${
              speech.listening
                ? 'border-praxis-cyan/50 bg-praxis-cyan/10 text-praxis-cyan shadow-glow animate-pulse-soft'
                : 'border-praxis-hairline bg-praxis-panel/40 text-praxis-muted hover:border-praxis-cyan/40 hover:text-praxis-cyan'
            } disabled:cursor-not-allowed disabled:opacity-40`}
            onClick={() => speech.toggle(value)}
            disabled={!speech.supported}
            aria-label={speech.listening ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={speech.listening}
            title={
              speech.supported
                ? speech.listening
                  ? 'Stop listening'
                  : 'Speak your prompt'
                : 'Voice input not supported in this browser'
            }
          >
            <MicrophoneIcon listening={speech.listening} />
          </button>
          <input
            className="praxis-input border-0 bg-transparent px-1 py-1 shadow-none focus:shadow-none"
            value={value}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
          <button
            className="praxis-btn-primary rounded-xl px-5 py-2.5 text-sm shadow-glow"
            onClick={submit}
            disabled={!value.trim() && !screenshot}
            aria-label="Generate"
          >
            Generate
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[11px] text-praxis-muted/70">
          <label
            className={`praxis-chip cursor-pointer transition-colors duration-200 hover:border-praxis-cyan/40 hover:text-praxis-cyan ${
              dragging ? 'border-praxis-violet/50 text-praxis-violet' : ''
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void onFileChange(e.target.files?.[0])
                e.currentTarget.value = ''
              }}
            />
            <ImageIcon />
            Attach screenshot
          </label>
          <span className="text-right">
            {speech.listening
              ? 'Listening… speak your app idea'
              : multimodal
                ? 'Image input enabled for the vision agent'
                : 'Praxis writes the app — keys and models stay on the server.'}
          </span>
        </div>
      </div>
    </div>
  )
}

async function compressImage(file: File, maxPx: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  })
}

function MicrophoneIcon({ listening }: { listening: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={listening ? 'currentColor' : 'none'}
        fillOpacity={listening ? 0.25 : 0}
      />
      <path
        d="M6 11a6 6 0 0012 0M12 17v4M8 21h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 16l-5-5-4 4-2-2-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
