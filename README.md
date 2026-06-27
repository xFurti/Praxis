# Praxis

Praxis is a full-screen web application that behaves like a lightweight **generative operating system**: a dark, tech-magic desktop shell where users describe an app in a prompt bar and watch it being written live inside a managed window.

This repository contains the Praxis shell (React + Vite + TypeScript + TailwindCSS) and a thin Node/Express backend that orchestrates model calls behind a single `callModel({ role, messages, stream })` abstraction.

## Delivery model

Praxis work is split into two explicit stages:

- **PRE-BUILD**: scaffolding of the shell, window manager, iframe runtime, design system, mock backend, and the Speed Compare panel surface. No real provider keys are required; the backend returns mocked responses.
- **CORE (hackathon-time)**: real system prompts for the INTERPRETER, BUILDER, and FIXER roles, live provider wiring (OpenAI-compatible endpoints such as Cerebras or GLM), real streaming of builder output to the UI, live Speed Compare metrics, and optional multimodal screenshot input.

## Security rule (non-negotiable)

**API keys and secrets live only in the backend.** The frontend MUST NOT send, store, or read any provider API key. All model access is routed through backend endpoints that read credentials from server-side environment variables.

Before every commit, verify that `.gitignore` protects `.env` files and that no API key, secret, or `.env` file is staged.

## Branch strategy

- `main` — stable trunk.
- `prebuild` — PRE-BUILD scaffolding work.
- CORE work uses conventional commits prefixed with `[core]`; PRE-BUILD uses `[prebuild]`.
- Hackathon start/end are marked with empty commits `[core] HACKATHON START` and `[core] HACKATHON END`.

## Repository contents

- `openspec/` — OpenSpec planning artifacts (proposal, design, specs, tasks) versioned as proof of the development process.
- Frontend and backend application code (added during PRE-BUILD).

## Setup

Local setup instructions and required environment variables are documented closer to demo time (see task 8.4).
