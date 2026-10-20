# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three co-equal audiences, each served by its own practice mode, with no single primary user:

- **Job seekers** — upload a resume, get role-specific questions generated from it, and rehearse Interview Prep sessions with transcript-backed feedback.
- **General speakers** — anyone wanting lower-stakes speaking reps (warmups, stories, everyday communication) via Free Talk.
- **Pitch/sales professionals** — practicing concise positioning, value articulation, and follow-up answers for investor/demo/sales contexts via Pitch Practice.

## Product Purpose

TalkItOut AI is a speaking-coaching platform that runs live practice sessions (audio, with optional video) across three modes — Free Talk, Interview Prep, Pitch Practice — and scores the user's delivery. Interview Prep sessions can be seeded by an uploaded resume (PDF/DOCX), which the backend parses into structured profile data used to generate role-specific questions.

Success is a user who leaves a session with concrete, specific feedback on their delivery (pace, clarity, filler words, confidence signals) they can act on next time — not just a pass/fail transcript.

## Positioning

The differentiator is **real-time in-session coaching**, not a post-hoc report: the AI panel surfaces live tips and metrics (pace, clarity, filler-word count) *while the user is speaking*, alongside mode-specific live aids (a 60s depleting countdown in Pitch Practice, skip/next question controls in Interview Prep). A generic "record and get a score afterward" practice app cannot truthfully claim this — the coaching happens during the session, not only after it.

## Operating Context

- Session flow is linear per mode: **Landing → Mode selection (Interview Type) → Session Room**.
- Interview Prep can optionally start from a resume upload (`GetStarted` flow: choose → upload → analyze → generate questions).
- Sessions run through WebRTC/WebSocket audio (and optionally video) streaming to the backend for live transcription and scoring; a per-session results socket delivers live metrics.
- Users can create an account (Supabase-backed) to view session history and score progression over time (`Account` page, `ScoreProgressChart`); theme preference is saved locally and applies across landing pages, resume flow, and the interview studio (`Settings` page).
- Pricing is tiered (Free / Basic / higher tiers) gating session volume and which modes/features are available.

## Capabilities and Constraints

**Confirmed capabilities:**
- Resume parsing (PDF/DOCX) → structured profile data → role-specific question generation.
- Three live practice modes with mode-specific live aids (tips, countdown timer, question skip/next).
- Live speech transcription and post-session scoring: pace, clarity, filler words, confidence.
- Video-based presence scoring is functional but lower-fidelity than speech scoring (see constraints below).
- Supabase-backed accounts with saved session history and a score-progression chart.
- Locally-saved theme preference, applied app-wide.

**Known technical constraints (durable — do not silently "fix" without checking both sides of the contract):**
- Resume upload has a hardcoded URL that should read from `VITE_API_BASE` instead.
- The video-feedback request/response schema is not fully aligned between frontend and backend.
- Some real-time (WebRTC/WebSocket) backend dependencies are not fully pinned in `requirements.txt`.
- `WS /ws/results/{session_id}` currently only allows origin `http://localhost:3000`.
- `run_video_pipeline()` only emits a basic status message; real video scoring instead comes from client-collected frames posted to `/video/feedback`.
- Browser `FaceDetector` API support is inconsistent, so video-feedback quality varies by browser.
- All frontend/backend API contracts (speech feedback, video feedback, question generation, resume parse) must be updated on both sides together — see `CLAUDE.md`'s API Contracts table.

## Evidence on Hand

- Landing-page stats ("12K+ Sessions completed", "94% Reported improvement", "48h Avg. to noticeable change") are **real, approximate figures** — preserve them as evidence rather than treating them as placeholder copy, but do not invent additional precision beyond what's already stated.
- No named customer testimonials, case studies, or press mentions exist yet — future work must not fabricate these.
- Pricing tiers (Free/Basic/and higher) are implemented in `Pricing.tsx` with real feature-gating copy, not placeholder.

## Product Principles

1. **Coach during, not just after.** Live, in-session feedback is the core mechanism; post-session reports supplement it but never replace it.
2. **One session flow, three lenses.** Free Talk, Interview Prep, and Pitch Practice share the same session-room mechanics (recording, live metrics, AI panel) but differ in prompts, pacing aids, and stakes — new mode-specific work should extend this shared shell rather than fork it.
3. **Resume-personalization is a real input, not a gimmick.** When a resume is available, question generation should visibly use it; the flow must degrade gracefully (generic questions) when no resume is provided.
4. **Contract discipline over speed.** Because frontend and backend evolve together in a prototype, changes to any request/response shape update both sides in the same pass.
5. **Preserve real evidence, invent nothing.** Stats and pricing on the landing/pricing pages reflect real product facts; extend them with real data only, never fabricated numbers or testimonials.
