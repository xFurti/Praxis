import { Shell } from './shell/Shell'

export default function App() {
  return <Shell onPrompt={(p) => console.log('prompt:', p)} />
}
