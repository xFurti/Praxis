import { useState } from 'react'

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

  const submit = () => {
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
          <div className="animate-upload-reveal relative mb-2 flex items-center gap-2 overflow-hidden rounded-xl border border-praxis-cyan/40 bg-praxis-surface2/70 px-3 py-2 shadow-glow backdrop-blur-md">
            <div className="absolute inset-0 bg-tech-magic/5" aria-hidden="true" />
            <img
              src={screenshot}
              alt="Attached screenshot"
              className="relative h-14 w-14 animate-upload-pop rounded-lg object-cover ring-2 ring-praxis-cyan/50"
            />
            <div className="relative flex flex-1 flex-col gap-0.5">
              <span className="text-xs font-medium text-praxis-cyan">Screenshot attached</span>
              <span className="text-[11px] text-praxis-muted">
                Will be analyzed by the vision agent
              </span>
            </div>
            <button
              className="relative grid h-6 w-6 place-items-center rounded-full text-praxis-muted transition hover:scale-110 hover:text-red-400"
              onClick={() => setScreenshot(undefined)}
              aria-label="Remove screenshot"
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {uploading && (
          <div className="animate-upload-reveal mb-2 flex items-center gap-2 rounded-xl border border-praxis-violet/30 bg-praxis-surface2/60 px-3 py-2 text-xs text-praxis-muted">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-praxis-cyan/30 border-t-praxis-cyan" />
            Processing image…
          </div>
        )}

        <div
          className={`praxis-card flex items-center gap-2 p-2 transition-all duration-300 ${
            focused ? 'animate-prompt-focus scale-[1.01] ring-2 ring-praxis-cyan/40 shadow-glow' : ''
          } ${dragging ? 'animate-drag-glow scale-[1.02] ring-2 ring-praxis-violet/60' : ''}`}
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
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg transition-all duration-300 ${
              focused ? 'shadow-glow' : ''
            }`}
          >
            <img
              src="/praxis-logo.png"
              alt=""
              className={`h-9 w-9 object-cover transition-transform duration-300 ${
                focused ? 'scale-105' : ''
              }`}
              draggable={false}
            />
          </span>
          <input
            className="praxis-input border-0 bg-transparent shadow-none transition-all duration-200 focus:shadow-none"
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
            className={`praxis-btn-primary transition-all duration-200 ${
              value.trim() || screenshot ? 'animate-generate-ready shadow-glow' : ''
            }`}
            onClick={submit}
            disabled={!value.trim() && !screenshot}
            aria-label="Generate"
          >
            Generate
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-praxis-muted/80">
          <label
            className={`praxis-chip cursor-pointer transition-all duration-200 hover:border-praxis-cyan/50 hover:text-praxis-cyan ${
              dragging ? 'border-praxis-violet/60 text-praxis-violet' : ''
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
          <span className="transition-opacity duration-200">
            {multimodal
              ? 'Image input enabled for interpreter'
              : 'Keys and models stay on the server.'}
          </span>
        </div>
        <p className="mt-2 text-center text-xs text-praxis-muted/80">
          Praxis writes the app for you — keys and models stay on the server.
        </p>
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

function ImageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 16l-5-5-4 4-2-2-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
