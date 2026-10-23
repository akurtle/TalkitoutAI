# TalkitoutAI · Architecture Showcase

A frontend-only, interactive walkthrough of the TalkitoutAI codebase: a mock-interview simulation, a React Flow
architecture explorer with request-lifecycle playback, and an engineering deep dive linked to the real source files.

> Interactive architecture demonstration. Backend execution and AI responses are simulated for portfolio purposes.
> The full implementation is in this repository (`backend/`, `frontend/`, `supabase/`).

The showcase does not need a backend, database, API keys, authentication or environment variables. It makes no network
requests at runtime apart from loading Google Fonts. It never requests microphone or camera access.

## What's inside

| Section | What it does |
|---|---|
| **Mock interview simulation** | Setup (role, practice type, experience level) → session with a simulated clock, progressive transcript, demo-mode recorder and live tips → illustrative feedback with transcript annotations. Questions come from the backend's real template bank. Answers and scores are pre-written. |
| **Architecture explorer** | React Flow canvas of every component and connection, grouped by layer (browser, FastAPI, in-process AI/parsing, external services). Hover shows a node's responsibility. Click a node or edge for details, protocol, data format and source links. Supports filtering by flow, zoom, pan, fit and reset. |
| **Lifecycle playback** | Five deterministic scenarios: question generation (with a Gemini or template branch), live audio transcription, resume analysis, feedback and persistence, and auth/history. You can play, pause, resume, restart, step, or jump to a step. Payload shapes follow the real Pydantic models and TS types. |
| **Engineering deep dive** | Implementation status (including what was removed or is not wired), API and socket contracts, code excerpts, trade-offs, real-time challenges, deployment, and security. |

### Accuracy notes

The content was written from the code on the `optimze/backend` branch, not from the README. Where the two disagree, the
showcase follows the code:

- WebRTC (`aiortc`, `/webrtc/offer`) was removed in commit `ae39624`. Live audio now streams as Int16 PCM over `WS /asr`.
- Speech/answer/video scoring moved to the browser (`frontend/src/feedback/clientFeedback.ts`) in commit `a53c79e`.
  `/speech/feedback`, `/video/feedback` and `/ws/results/{id}` still exist but are not called by the UI. They are shown
  dashed as "in code, not called".
- Parsed resume data is displayed but not yet passed to question generation.

Source links point to `https://github.com/akurtle/TalkitoutAI/blob/main/...`. Update `REPO_URL` in `src/lib/repo.ts`
if the repo moves.

## Develop

```bash
cd showcase
npm install
npm run dev        # http://localhost:5180
```

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build to `dist/` |
| `npm run typecheck` | Type-check only |
| `npm run lint` | ESLint (typescript-eslint, react-hooks, react-refresh) |
| `npm run preview` | Serve the production build locally |

Stack: React 19, TypeScript, Vite 7, Tailwind CSS 4, `@xyflow/react`, `motion`, `lucide-react`.

## Project layout

```text
showcase/src/
  data/
    architecture.ts    # nodes, edges, groups: the single source for the diagram
    scenarios.ts       # playback steps and payloads per flow
    interview.json     # roles, modes, questions, sample transcripts, illustrative feedback
    interview.ts       # typed accessors + transcript annotation (word lists mirror clientFeedback.ts)
    deepDive.ts        # status table, API rows, snippets, decisions, security notes
  components/
    architecture/      # explorer, custom nodes, animated packet edge, playback + detail panels
    simulation/        # setup → session → feedback stages
    deepdive/          # tabbed engineering section
    layout/ ui/        # shell, banner, primitives, code block
  hooks/               # usePlayback (step engine), useInterval
  lib/                 # shared types, styles, repo links
```

To change the diagram, edit `data/architecture.ts`. Positions use a fixed grid (`COL` / `ROW`). Scenario steps reference
node and edge ids, and any edge can be animated in reverse for responses.

## Deploy (static)

The build is plain static files with relative asset paths (`base: "./"`), so it works on any static host.

**Vercel**: import the repo and set **Root Directory** to `showcase`. `vercel.json` sets the build command
(`npm run build`) and output (`dist`).

**Cloudflare Pages**: root directory `showcase`, build command `npm run build`, output directory `dist`.
`public/_redirects` provides an SPA fallback.

**Any other host**: run `npm run build` and upload `showcase/dist/`.

The showcase is independent of the main app. It has its own `package.json` and lockfile, imports nothing from
`frontend/` or `backend/`, and building or deploying it does not affect them.
