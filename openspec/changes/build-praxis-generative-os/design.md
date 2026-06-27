## Context

Praxis is a full-screen web application that needs to look and behave like a lightweight generative operating system while remaining feasible to stage before a hackathon. The frontend stack is React, Vite, TypeScript, and TailwindCSS; the backend is Node/Express for model access. The main constraints are a polished dark visual theme, strong separation between shell code and generated app code, backend-only API key handling, and a delivery split between PRE-BUILD scaffolding and CORE live AI integration.

The current repository only contains OpenSpec planning artifacts, so this design must define both the architectural seams and the sequencing that let the team scaffold confidently without blocking on real provider integration.

## Goals / Non-Goals

**Goals:**
- Define a frontend architecture for the Praxis shell, prompt flow, window manager, generated app containers, and Speed Compare panel.
- Define a backend boundary where all provider configuration and API keys remain server-side behind a single `callModel` abstraction.
- Define a multi-agent orchestration model that supports a future INTERPRETER -> BUILDER -> FIXER pipeline without forcing all hackathon-time behavior into prebuild code.
- Separate PRE-BUILD-ready work from CORE-only work so the team can deliver useful scaffolding before real providers and prompts are finalized.
- Make generated apps visually coherent by enforcing a reusable Praxis design system contract.

**Non-Goals:**
- Finalize the exact wording of production system prompts for the three agents.
- Commit to a specific streaming transport implementation beyond the requirement that incremental builder output be visible in the UI.
- Design a persistent storage model, authentication system, or multi-user collaboration features.
- Guarantee full multimodal support in the MVP if provider capabilities or time do not allow it.

## Decisions

### 1. Split the app into a shell-first frontend and a thin orchestration backend
The frontend will own desktop layout, prompt UX, window state, iframe rendering, and performance displays. The backend will expose app-generation endpoints and encapsulate provider credentials through `callModel({ role, messages, stream })`.

Rationale: this preserves the visual demo loop in the client while enforcing the security rule that API keys stay server-side. It also allows PRE-BUILD work to mock backend responses without changing the shell architecture later.

Alternatives considered:
- Direct browser-to-provider calls were rejected because they would expose API keys and undermine provider abstraction.
- A heavier backend-generated UI architecture was rejected because it would slow visual iteration on the OS shell.

### 2. Model the window manager as explicit client state with isolated generated-app sessions
Each generated app will be represented by window metadata and generation state: id, title, bounds, z-index, minimized state, status, generated HTML, and optional error/fix history. The shell will manage focus, drag, resize, and close/minimize actions in React state.

Rationale: explicit state supports predictable UI behavior, simple testing, and the ability to show generation progress before an app is complete.

Alternatives considered:
- Reusing a heavy desktop/window library was rejected for MVP because custom visual control is more important than exhaustive OS behavior.
- Managing generated apps outside the React tree was rejected because it complicates synchronization with prompt and streaming state.

### 3. Use `iframe srcdoc` with sandboxing as the generated app runtime boundary
Generated HTML/CSS/JS will be rendered inside sandboxed iframes using `srcdoc`. The shell must not inject generated code directly into its own DOM.

Rationale: this gives the simplest isolation boundary for untrusted or partially valid generated output while still supporting single-file HTML apps.

Alternatives considered:
- Injecting generated markup directly into React components was rejected for security and stability reasons.
- Blob URLs were considered, but `srcdoc` is simpler for incremental replacement of a single HTML document during generation.

### 4. Enforce a design-system contract between shell and BUILDER agent
The frontend will define reusable Praxis classes such as `.praxis-btn`, `.praxis-card`, `.praxis-input`, and `.praxis-display`. The BUILDER prompt contract will require generated apps to use these classes where applicable.

Rationale: this creates a consistent visual language between handcrafted shell UI and model-generated apps, improving demo quality and reducing prompt ambiguity.

Alternatives considered:
- Allowing unconstrained generated styling was rejected because results would likely drift away from the Praxis brand.
- Shipping a component library instead of CSS classes was rejected because generated output needs to stay self-contained inside `srcdoc` HTML.

### 5. Treat multi-agent orchestration as a staged pipeline with swappable placeholders
The system will define three roles from the start: INTERPRETER generates a structured app spec, BUILDER streams self-contained HTML, and FIXER repairs HTML after runtime or validation failures. PRE-BUILD may ship placeholder prompts, fake streaming, and mocked outputs so the UI and data contracts exist before live integration.

Rationale: the UI and backend contracts can be built early, while the most uncertain and time-sensitive parts remain isolated in CORE tasks.

Alternatives considered:
- Building a single-agent MVP first was rejected because the user explicitly wants the three-role architecture documented and task-tracked.
- Implementing full real orchestration during prebuild was rejected because it creates schedule risk and depends on provider-specific behavior.

### 6. Separate Speed Compare into a shell panel with mockable data source
The Speed Compare panel will be part of the shell and can initially render static or mocked throughput numbers. Later, CORE work will connect it to real token-per-second measurements captured by backend model calls.

Rationale: this allows the demo surface to be built and refined early while acknowledging that trustworthy numbers require live provider integration.

Alternatives considered:
- Deferring the panel entirely until live data exists was rejected because the user wants it visible in the staged MVP plan.

## Risks / Trade-offs

- [Generated HTML may break or partially render during streaming] -> Mitigation: render intermediate output into a dedicated draft state, validate before marking generation complete, and route failures through the FIXER flow.
- [Iframe sandboxing may restrict interactions needed by generated apps] -> Mitigation: define the minimum sandbox policy explicitly during implementation and keep the generated app contract to self-contained single-page behavior.
- [Custom drag/resize behavior can become time-consuming] -> Mitigation: keep MVP window interactions minimal and prioritize stable dragging/resizing over advanced tiling or snapping.
- [Provider-specific streaming semantics may differ across Cerebras/OpenAI-compatible endpoints] -> Mitigation: normalize backend responses inside `callModel` and keep provider-specific parsing isolated behind the abstraction.
- [Design-system enforcement may reduce generation flexibility] -> Mitigation: require the shared classes for common controls while allowing local CSS extension inside generated apps.
- [Multimodality may exceed hackathon scope] -> Mitigation: specify it as opportunistic CORE work with graceful fallback to text-only input.

## Migration Plan

1. Set up repository hygiene and branch structure (`main`, `prebuild`) before application code lands.
2. Build PRE-BUILD shell, window manager, iframe runtime, placeholder backend abstraction, design-system assets, and mocked Speed Compare experience.
3. Validate that the shell supports the end-to-end demo loop with placeholder generated apps and visible pseudo-streaming.
4. During hackathon CORE work, replace placeholders with real prompts, provider wiring, real streaming transport, multi-agent orchestration, and live Speed Compare metrics.
5. If a live integration path becomes unstable, fall back to the PRE-BUILD shell with mocked backend responses while preserving the same UI contracts.

Rollback is straightforward because PRE-BUILD scaffolding and CORE integrations can be developed incrementally behind stable frontend/backend interfaces.

## Open Questions

- Which streaming transport will be preferred for builder output in implementation: Server-Sent Events, chunked fetch, or WebSocket?
- Which exact OpenAI-compatible endpoint shape will be used first for Cerebras or GLM, and how much response normalization will be required?
- What sandbox attribute set is acceptable for generated apps that need limited scripting while preserving shell safety?
- Should the FIXER be triggered only on explicit runtime errors, or also on failed structural validation before the iframe is refreshed?
- If multimodal screenshot input is attempted, where will image preprocessing occur and what file-size limits will the UI enforce?
