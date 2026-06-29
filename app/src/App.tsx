import { useState } from 'react'
import { Shell } from './shell/Shell'
import { BootScreen } from './shell/BootScreen'

export default function App() {
  const [booted, setBooted] = useState(false)

  return (
    <>
      {!booted && <BootScreen onReady={() => setBooted(true)} />}
      {booted && <Shell onPrompt={(p) => console.log('prompt:', p)} />}
    </>
  )
}
