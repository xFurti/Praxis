import { Shell } from './shell/Shell'

export default function App() {
  return (
    <Shell onPrompt={(p) => console.log('prompt:', p)}>
      {/* windows and panels will mount here in later PRE-BUILD tasks */}
    </Shell>
  )
}
