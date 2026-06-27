import { useState } from 'react'

type PromptBarProps = {
  onSubmit?: (prompt: string) => void
  placeholder?: string
}

export function PromptBar({
  onSubmit,
  placeholder = 'Describe an app and watch it appear...',
}: PromptBarProps) {
  const [value, setValue] = useState('')

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit?.(trimmed)
    setValue('')
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-6">
      <div className="pointer-events-auto w-full max-w-3xl">
        <div className="praxis-card flex items-center gap-2 p-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-tech-magic/20 text-praxis-cyan">
            <SparkIcon />
          </span>
          <input
            className="praxis-input border-0 bg-transparent shadow-none focus:shadow-none"
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
          <button
            className="praxis-btn-primary"
            onClick={submit}
            disabled={!value.trim()}
            aria-label="Generate"
          >
            Generate
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-praxis-muted/80">
          Praxis writes the app for you — keys and models stay on the server.
        </p>
      </div>
    </div>
  )
}

function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"
        fill="currentColor"
      />
    </svg>
  )
}
