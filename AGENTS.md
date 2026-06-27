# Praxis Agent & Workflow Rules

## Pre-commit guardrail (mandatory)

Before every commit, the operator (human or AI agent) MUST:

1. Confirm `.gitignore` still protects `.env`, `.env.*`, `node_modules/`, and build output.
2. Confirm no `.env` file, API key, token, or secret is staged:
   ```bash
   git diff --cached --name-only | findstr /I ".env"
   git diff --cached | findstr /I "API_KEY TOKEN SECRET sk-"
   ```
   Both must return nothing.
3. If anything sensitive is staged, unstage it (`git restore --staged <path>`) and abort the commit.

## Commit conventions

- Atomic commits, one per completed task.
- PRE-BUILD scaffolding tasks: prefix `[prebuild]`, e.g. `[prebuild] add shell layout`.
- CORE hackathon tasks: prefix `[core]`, e.g. `[core] wire live builder streaming`.
- Hackathon boundaries marked with empty commits `[core] HACKATHON START` and `[core] HACKATHON END`.

## Secrets policy

- API keys live ONLY in backend environment variables, never in frontend code or client requests.
- Never commit `.env` files; only `.env.example` (without real values) may be tracked.
