## Why

Praxis needs a concrete change plan that separates scaffoldable platform work from hackathon-critical AI generation work, so the team can prepare a polished generative OS shell before integrating real providers and streaming behavior. The change is needed now to lock down product boundaries, UX expectations, and delivery sequencing for a full-screen web app demo.

## What Changes

- Create a full-screen Praxis web application with a dark, tech-magic desktop shell, branded top bar, and a bottom-centered prompt bar for app generation.
- Add a desktop window manager with draggable and resizable windows, title bars, and minimize/close controls for generated apps.
- Render generated apps inside sandboxed `iframe srcdoc` containers so the generated HTML/CSS/JS runs in isolation from the shell.
- Introduce a backend model-provider abstraction centered on `callModel({ role, messages, stream })`, with provider, model, and API key sourced from backend environment variables only.
- Define a three-role multi-agent generation flow: INTERPRETER converts prompts into JSON specs, BUILDER generates self-contained HTML in streaming mode, and FIXER repairs generated HTML when runtime errors occur.
- Establish a reusable Praxis design system whose classes must be used by the BUILDER output.
- Add a Speed Compare panel that can present throughput comparisons between a faster and a slower provider.
- Separate implementation work into explicit PRE-BUILD tasks for scaffolding and CORE tasks for hackathon-time integrations, prompts, and live model behavior.
- Include versioning and repository hygiene tasks covering Git initialization, GitHub setup, `.gitignore`, README creation, atomic commits, OpenSpec versioning, and hackathon marker commits.

## Capabilities

### New Capabilities
- `praxis-shell`: Full-screen generative OS shell, desktop chrome, prompt entry, and managed app windows.
- `generated-app-runtime`: Sandboxed generated app execution, provider abstraction, multi-agent generation flow, and streaming/fix-up pipeline.
- `provider-speed-compare`: Provider comparison panel and related performance reporting workflow.

### Modified Capabilities
- None.

## Impact

- Frontend: new React + Vite + TypeScript + TailwindCSS application structure, shell components, window manager, design-system styles, and iframe runtime.
- Backend: new Node/Express service for OpenAI-compatible provider calls and future streaming orchestration.
- Environment/config: backend-only secrets, provider/model environment variables, `.gitignore`, and repository setup.
- Product/demo flow: introduces a staged PRE-BUILD versus CORE delivery model for the hackathon.
