# Yuta — Local-first AI companion

Friends-only desktop companion. Personal data stays on the user's machine. The desktop shell is Tauri + Vite; AI, memory, emotion, character, voice, and behavior live in reusable TypeScript packages so a later web app can share the same core.

## Current milestone

Working prototype:

- Open the Tauri app
- See a Live2D character (official sample: Hiyori Momose)
- Chat in text
- Optional Gemini (user-supplied key) or local mock provider
- Structured AI output drives 5 emotions + 5 actions
- Web Speech TTS with amplitude-style lip sync
- Local markdown memory with hierarchical retrieval
- Recent behavior tracking
- Debug panel

## Architecture

```text
Tauri desktop shell
  React + Vite UI
    Chat | Character | Memory | Behavior | Settings | Debug
          │
    AI Orchestrator (TypeScript)
      Context → Memory → Behaviour → Provider → Zod → Output
          │
    Memory | Behaviour | Emotion | Voice
          │
    Character Engine → Live2D Cubism
```

AI orchestration stays in TypeScript. Rust is limited to filesystem, config, OS paths, lifecycle, and secret storage.

## Monorepo

pnpm workspaces + Nx. Packages export TypeScript source and are bundled by Vite.

| Package | Responsibility |
| --- | --- |
| `@yuta/shared` | Types, constants, small utils |
| `@yuta/ai` | Provider interface, Gemini, mock, prompts, Zod contract, orchestrator |
| `@yuta/memory` | File adapter, router, keyword retrieval, markdown format |
| `@yuta/emotion-engine` | Closed emotion/action vocabulary and transitions |
| `@yuta/character-engine` | `CharacterState` → Live2D. No AI imports |
| `@yuta/voice` | STT, TTS, lip-sync |
| `@yuta/behavior` | Recent observations and response hints |
| `@yuta/ui` | Shared primitives |
| `@yuta/desktop` | Tauri app, screens, session wiring |

## Stack

- React 19, Vite, TypeScript, Tailwind CSS 4, shadcn-style primitives
- TanStack Query, Zustand, Zod, Lucide, Biome
- Tauri 2 + Rust
- `@google/genai` behind `AIProvider`
- PixiJS 8 + `untitled-pixi-live2d-engine` (Cubism 3/4/5)
- Web Speech API for prototype TTS/STT

Do not couple the app to Gemini. New providers implement `AIProvider`.

## Local data (source of truth)

Tauri app data directory:

```text
AppData/yuta/
  config/settings.json
  memory/{profile,preferences,people,experiences,knowledge,private}/
  behavior/{recent,patterns,summaries}/
  conversations/
  cache/
```

The Gemini API key is stored with the Tauri store plugin (user-provided). Never ship a key. Never use `.env` for distributed desktop secrets.

## Memory levels

| Level | What | Loaded |
| --- | --- | --- |
| L0 | Current conversation | Always |
| L1 | Last N turns, recent behavior, current emotion | Always, small |
| L2 | Relevant memories via router + scoring | On demand |
| L3 | Archive | Never automatic |

Start with human-readable markdown + keyword/tag retrieval. No vector DB until filesystem search is actually insufficient.

## AI output contract

Gemini never drives the character directly. Output is JSON, validated with Zod against a closed emotion/action vocabulary. Invalid names are rejected and fall back to `neutral` / no action.

## Character engine

Receives only `CharacterState`. Live2D is a renderer behind `CharacterRenderer`. Replacing Live2D later must not touch `@yuta/ai`.

Prototype lip-sync: mouth openness from speech amplitude (synthetic envelope while Web Speech is talking). Phoneme sync is later.

## Phases

1. Character prototype — **this repo's first working slice**
2. Gemini structured output
3. Voice (STT/TTS/lip-sync)
4. Memory retrieval
5. Behaviour
6. Advanced emotion (blending, voice modulation)
7. Polish (onboarding, import/export, updates)

## Intentionally not in this prototype

Vector DB, cloud backend, multi-user accounts, agent frameworks, multiple LLM providers in the UI, 50 emotions, perfect lip-sync, cloud memory, microservices.

## Live2D assets

- Model: [Hiyori Momose](https://github.com/Live2D/CubismWebSamples) under the Live2D Free Material License (non-commercial / sample use).
- Runtime: `live2dcubismcore.min.js` from the Cubism SDK for Web. Proprietary; downloaded by `scripts/setup-assets.mjs`, not treated as app source.

## Run

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the Tauri desktop app. Put a Gemini key in Settings to use Gemini; otherwise the mock provider still drives the character.
