import type { AppWindow, GenerationStatus } from '../data/types'

const MOCK_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  :root { --c:#22d3ee; --v:#8b5cf6; --n:#070b1a; --s:#121a33; --e:#243056; --t:#e6ebff; --m:#8b93b8; }
  *{box-sizing:border-box} html,body{margin:0;height:100%;font-family:Inter,system-ui,sans-serif;background:var(--n);color:var(--t)}
  .wrap{height:100%;display:flex;flex-direction:column;gap:12px;padding:24px;background:radial-gradient(800px 400px at 50% -10%,rgba(139,92,246,.18),transparent 60%)}
  h1{font-family:'Space Grotesk',sans-serif;margin:0;background:linear-gradient(90deg,var(--c),var(--v));-webkit-background-clip:text;background-clip:text;color:transparent}
  .card{border:1px solid var(--e);background:rgba(18,26,51,.8);border-radius:12px;padding:16px}
  input{width:100%;border:1px solid var(--e);background:rgba(7,11,26,.8);color:var(--t);border-radius:8px;padding:10px 14px;outline:none}
  button{border:0;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer;background:linear-gradient(90deg,var(--c),var(--v));color:var(--n)}
  .row{display:flex;gap:8px;align-items:center}
  small{color:var(--m)}
</style></head><body>
  <div class="wrap">
    <h1>Hello from Praxis</h1>
    <div class="card"><p>This app was generated for you. Edit the prompt to spawn another.</p></div>
    <div class="row"><input placeholder="Type something..."/><button>Say hi</button></div>
    <small>Generated · sandboxed iframe</small>
  </div>
</body></html>`

export type MockGenHandle = {
  windowId: string
  cancel: () => void
}

/**
 * PRE-BUILD mock generation: emits an app window and reveals HTML progressively
 * to simulate the "app writes itself" effect without a real provider.
 */
export function startMockGeneration(
  win: AppWindow,
  _onUpdate: (id: string, patch: Partial<AppWindow>) => void,
  onStatus: (id: string, status: GenerationStatus) => void,
  onHtml: (id: string, html: string) => void,
): MockGenHandle {
  const id = win.id
  let cancelled = false

  const steps = [
    'interpreting',
    'building',
    'building',
    'building',
    'ready',
  ] as GenerationStatus[]

  let i = 0
  const tick = () => {
    if (cancelled) return
    if (i < steps.length) {
      onStatus(id, steps[i])
      if (steps[i] === 'building') {
        const partial = MOCK_HTML.slice(0, Math.floor((MOCK_HTML.length * (i + 1)) / steps.length))
        onHtml(id, partial)
      }
      if (steps[i] === 'ready') {
        onHtml(id, MOCK_HTML)
      }
      i += 1
      setTimeout(tick, 650)
    }
  }

  setTimeout(tick, 250)

  return {
    windowId: id,
    cancel: () => {
      cancelled = true
    },
  }
}
