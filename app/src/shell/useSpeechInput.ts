import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechInputOptions = {
  onTranscript: (text: string) => void
  lang?: string
}

type SpeechInputState = {
  supported: boolean
  listening: boolean
  error: string | null
  toggle: (prefix?: string) => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognition

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useSpeechInput({ onTranscript, lang }: SpeechInputOptions): SpeechInputState {
  const SpeechRecognitionClass = getSpeechRecognition()
  const supported = SpeechRecognitionClass != null

  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const prefixRef = useRef('')
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const listeningRef = useRef(false)

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    listeningRef.current = false
    setListening(false)
  }, [])

  const toggle = useCallback((prefix = '') => {
    if (!SpeechRecognitionClass) return

    if (listeningRef.current) {
      stop()
      return
    }

    setError(null)

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang ?? (navigator.language || 'en-US')

    prefixRef.current = prefix

    recognition.onstart = () => {
      listeningRef.current = true
      setListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = ''
      let interimText = ''

      for (let i = 0; i < event.results.length; i++) {
        const chunk = event.results[i][0]?.transcript ?? ''
        if (event.results[i].isFinal) {
          finalText += chunk
        } else {
          interimText += chunk
        }
      }

      const spoken = `${finalText}${interimText}`.trim()
      if (!spoken) return

      const prefix = prefixRef.current.trim()
      const combined = prefix ? `${prefix} ${spoken}` : spoken
      onTranscriptRef.current(combined)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') return
      if (event.error === 'not-allowed') {
        setError('Microphone access denied')
      } else if (event.error === 'no-speech') {
        setError('No speech detected')
      } else {
        setError('Voice input unavailable')
      }
      setListening(false)
    }

    recognition.onend = () => {
      listeningRef.current = false
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      setError('Could not start voice input')
      setListening(false)
    }
  }, [SpeechRecognitionClass, lang, stop])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  return { supported, listening, error, toggle, stop }
}
