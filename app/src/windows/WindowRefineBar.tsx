import { useEffect, useRef, useState } from 'react'

type WindowRefineBarProps = {
  open: boolean
  busy: boolean
  onClose: () => void
  onSubmit: (changeRequest: string) => void
}

export function WindowRefineBar({ open, busy, onClose, onSubmit }: WindowRefineBarProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue('')
      const id = window.setTimeout(() => inputRef.current?.focus(), 50)
      return () => window.clearTimeout(id)
    }
  }, [open])

  if (!open) {
    return null
  }

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || busy) return
    onSubmit(trimmed)
  }

  return (
    <div
      className="shrink-0 border-b border-praxis-edge/70 bg-praxis-surface2/90 px-3 py-2 backdrop-blur-md"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <PencilIcon />
        <input
          ref={inputRef}
          className="praxis-input min-w-0 flex-1 border-praxis-edge/60 py-1.5 text-xs"
          placeholder="Describe changes to this interface…"
          value={value}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') onClose()
          }}
        />
        <button
          type="button"
          className="praxis-btn-ghost px-2.5 py-1.5 text-xs"
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="praxis-btn-primary px-2.5 py-1.5 text-xs"
          onClick={submit}
          disabled={busy || !value.trim()}
        >
          {busy ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </div>
  )
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-praxis-cyan"
      aria-hidden="true"
    >
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
