# Frontend Data Contract

The Praxis frontend talks to the backend through a small, stable set of request/response shapes so PRE-BUILD mocks and CORE live integrations remain interchangeable.

See `app/src/data/types.ts` for the canonical TypeScript types.

## 1. User request

Submitted from the prompt bar.

```ts
type UserPromptRequest = {
  id: string            // client-generated request id
  prompt: string        // user text
  createdAt: string     // ISO timestamp
  screenshot?: string   // optional data URL (multimodal)
}
```

## 2. Interpreted spec

Returned by the INTERPRETER role. A structured, reusable description of the app to build.

```ts
type AppSpec = {
  name: string
  purpose: string
  components: Array<{ name: string; kind: string; description: string }>
  notes?: string
}
```

## 3. Generated HTML document

Streamed by the BUILDER role. A self-contained single-file HTML document intended for `iframe srcdoc`.

```ts
type GeneratedDoc = {
  windowId: string
  html: string
  valid: boolean        // passes minimal structural validation
}
```

## 4. Error / fix history

Produced by the FIXER role when runtime or validation errors occur.

```ts
type FixEntry = {
  at: string            // ISO timestamp
  error: string
  applied: boolean
}
```

## 5. Window state (client-only)

The window manager tracks each generated app session locally. Not sent to the backend.

```ts
type AppWindow = {
  id: string
  title: string
  bounds: { x, y, width, height }
  zIndex: number
  minimized: boolean
  status: 'idle' | 'interpreting' | 'building' | 'ready' | 'error' | 'fixing'
  html: string
  spec?: AppSpec
  errors: FixEntry[]
}
```

## Flow

```
PromptBar -- UserPromptRequest --> backend /interpret (INTERPRETER)
         <-- AppSpec
         -- AppSpec + design-system --> backend /build (BUILDER, streamed)
         <-- GeneratedDoc chunks
         -- HTML + error context --> backend /fix (FIXER)
         <-- corrected GeneratedDoc
```

During PRE-BUILD, the backend endpoints may return mocked data; the contracts above do not change.
