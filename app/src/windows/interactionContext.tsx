import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type InteractionState = {
  interacting: boolean
  begin: () => void
  end: () => void
}

const Ctx = createContext<InteractionState>({
  interacting: false,
  begin: () => {},
  end: () => {},
})

export function InteractionProvider({ children }: { children: ReactNode }) {
  const [interacting, setInteracting] = useState(false)

  useEffect(() => {
    if (!interacting) return
    const prevUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.userSelect = prevUserSelect
    }
  }, [interacting])

  return (
    <Ctx.Provider
      value={{
        interacting,
        begin: () => setInteracting(true),
        end: () => setInteracting(false),
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useInteraction() {
  return useContext(Ctx)
}
