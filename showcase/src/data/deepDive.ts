import type { SourceRef } from "../lib/types";

export type StatusTag = "implemented" | "fallback" | "dormant" | "removed" | "gap";

export interface StatusRow {
  item: string;
  tag: StatusTag;
  note: string;
  source?: SourceRef;
}

export const implementationStatus: StatusRow[] = [
  {
    item: "Question generation (Gemini + templates)",
    tag: "implemented",
    note: "Live endpoint. Gemini is optional, and the deterministic template bank always works.",
    source: { path: "backend/app/questions/question_generator.py", line: 182 },
  },
  {
    item: "Resume parsing (PDF/DOCX)",
    tag: "implemented",
    note: "pdfplumber / python-docx text extraction, heading-based sections, spaCy NER for the name.",
    source: { path: "backend/app/parsers/resume_parser.py", line: 43 },
  },
  {
    item: "Live transcription over WS /asr",
    tag: "implemented",
    note: "WhisperLiveKit with faster-whisper base. Browser SpeechRecognition is the fallback.",
    source: { path: "backend/app/api/realtime.py", line: 91 },
  },
  {
    item: "Speech, answer & video scoring",
    tag: "implemented",
    note: "Runs in the browser (clientFeedback.ts), a TypeScript port of the Python scorers.",
    source: { path: "frontend/src/feedback/clientFeedback.ts", line: 862 },
  },
  {
    item: "Auth, history, recordings",
    tag: "implemented",
    note: "Supabase Auth, RLS-scoped tables and view, private storage bucket.",
    source: { path: "supabase/schema.sql" },
  },
  {
    item: "Browser SpeechRecognition",
    tag: "fallback",
    note: "Used when the backend socket is unreachable.",
    source: { path: "frontend/src/components/Interview/useWhisper.tsx", line: 109 },
  },
  {
    item: "POST /speech/feedback · /video/feedback",
    tag: "dormant",
    note: "Still served by FastAPI, but the frontend no longer calls them.",
    source: { path: "backend/app/api/feedback.py", line: 15 },
  },
  {
    item: "WS /ws/results/{session_id}",
    tag: "dormant",
    note: "Origin-checked socket with TTL reaper. No current frontend consumer.",
    source: { path: "backend/app/api/realtime.py", line: 117 },
  },
  {
    item: "WebRTC (aiortc) · POST /webrtc/offer",
    tag: "removed",
    note: "Removed in commit ae39624 in favour of WebSocket PCM streaming. The README still describes it.",
  },
  {
    item: "Resume-personalised questions",
    tag: "gap",
    note: "Product docs describe it, but parsed resume data is not passed to /questions/generate yet.",
    source: { path: "frontend/src/pages/GetStarted.tsx", line: 37 },
  },
  {
    item: "Word timestamps in post-session scoring",
    tag: "gap",
    note: "/asr sends timed words, but useWhisper forwards only text, so pause/WPM features are unavailable after the session.",
    source: { path: "frontend/src/components/Interview/useWhisper.tsx", line: 174 },
  },
];

export interface ApiRow {
  method: "GET" | "POST" | "WS";
  path: string;
  request: string;
  response: string;
  caller: string;
  status: StatusTag;
  source: SourceRef;
}

export const apiRows: ApiRow[] = [
  {
    method: "POST",
    path: "/questions/generate",
    request: "QuestionRequest { role?, company?, call_type, num_questions (1–30), asked_questions[] }",
    response: "QuestionResponse { questions[{category, question, rationale?}], warnings[], used_inputs[] }",
    caller: "QuestionGenerator.tsx",
    status: "implemented",
    source: { path: "backend/app/api/questions.py", line: 12 },
  },
  {
    method: "POST",
    path: "/parse-resume/",
    request: "multipart/form-data { file: .pdf | .docx, filePath }",
    response: "ParseResponse { success, filename, data?: ResumeData, error? }",
    caller: "GetStarted.tsx",
    status: "implemented",
    source: { path: "backend/app/api/resumes.py", line: 16 },
  },
  {
    method: "POST",
    path: "/parse-resumes-batch/",
    request: "multipart/form-data { files[] }",
    response: "ParseResponse[]",
    caller: "none (API only)",
    status: "dormant",
    source: { path: "backend/app/api/resumes.py" },
  },
  {
    method: "WS",
    path: "/asr",
    request: "binary Int16 PCM @ 16 kHz",
    response: 'text { type: "asr", text, segment_start, segment_end, words[] }',
    caller: "useWhisper.tsx",
    status: "implemented",
    source: { path: "backend/app/api/realtime.py", line: 91 },
  },
  {
    method: "WS",
    path: "/ws/results/{session_id}",
    request: 'text { type: "ping" }',
    response: 'text { type: "pong" | "session_event", … }',
    caller: "none currently",
    status: "dormant",
    source: { path: "backend/app/api/realtime.py", line: 117 },
  },
  {
    method: "POST",
    path: "/speech/feedback",
    request: "SpeechSample { text? | words[]? | segments[]? | question_responses[]? }",
    response: "SpeechFeedbackResponse { score, metrics, feedback[], warnings[], response_* }",
    caller: "none (scoring moved client-side)",
    status: "dormant",
    source: { path: "backend/app/api/feedback.py", line: 15 },
  },
  {
    method: "POST",
    path: "/video/feedback",
    request: "VideoSample { frames[] }",
    response: "VideoFeedbackResponse { score, metrics, feedback[], warnings[] }",
    caller: "none (scoring moved client-side)",
    status: "dormant",
    source: { path: "backend/app/api/feedback.py", line: 76 },
  },
  {
    method: "GET",
    path: "/health",
    request: "—",
    response: '{ "status": "healthy" }',
    caller: "ops / container checks",
    status: "implemented",
    source: { path: "backend/app/api/core.py" },
  },
];

export interface Snippet {
  id: string;
  title: string;
  caption: string;
  language: "ts" | "py" | "sql";
  code: string;
  source: SourceRef;
}

export const snippets: Snippet[] = [
  {
    id: "asr-server",
    title: "Per-connection streaming ASR",
    caption: "The receive loop feeds audio while a background task pushes transcript deltas back on the same socket.",
    language: "py",
    source: { path: "backend/app/api/realtime.py", line: 91 },
    code: `@router.websocket("/asr")
async def asr(ws: WebSocket) -> None:
    await ws.accept()

    ap = AudioProcessor(
        transcription_engine=TranscriptionEngine(model="base", diarization=False, lan="en")
    )
    gen = await ap.create_tasks()
    task = asyncio.create_task(send_results(ws, gen))

    try:
        while True:
            chunk = await ws.receive_bytes()
            await ap.process_audio(chunk)
    except WebSocketDisconnect:
        logger.info("ASR client disconnected")
    finally:
        task.cancel()`,
  },
  {
    id: "asr-client",
    title: "Socket first, browser ASR second",
    caption: "The hook hides which engine is running. Callers only see onTranscript.",
    language: "ts",
    source: { path: "frontend/src/components/Interview/useWhisper.tsx", line: 297 },
    code: `// Try WebSocket ASR first; fall back to browser SpeechRecognition
const wsOk = await startWSAsr(stream);
if (!wsOk && shouldRunRef.current) {
  // Release owned stream before switching to browser SR (it uses its own mic)
  if (ownedStreamRef.current) {
    ownedStreamRef.current.getTracks().forEach((t) => t.stop());
    ownedStreamRef.current = null;
  }
  startBrowserSR(options);
}`,
  },
  {
    id: "dedupe",
    title: "Turning cumulative transcripts into deltas",
    caption: "Streaming engines revise earlier text. Only words ending after the last sent word go on the wire.",
    language: "py",
    source: { path: "backend/app/parsers/video_parser/helpers.py", line: 11 },
    code: `for w in line_words:
    w_text = getattr(w, "word", None) or getattr(w, "text", None)
    w_start = getattr(w, "start", None)
    w_end = getattr(w, "end", None)
    if w_text is None or w_start is None or w_end is None:
        continue
    if w_end <= last_sent_word_end:
        continue
    word_items.append({"word": w_text, "start": float(w_start), "end": float(w_end)})`,
  },
  {
    id: "gemini-fallback",
    title: "LLM with a deterministic floor",
    caption: "Gemini is an enhancement, not a dependency. Every failure mode lands on the template bank with a warning.",
    language: "py",
    source: { path: "backend/app/questions/question_generator.py", line: 182 },
    code: `if api_key:
    llm_questions, llm_warnings = _generate_questions_with_gemini(
        request=request, api_key=api_key,
        model=settings.gemini_model, api_url=settings.gemini_api_url,
    )
    warnings.extend(llm_warnings)
    if llm_questions:
        return llm_questions[: request.num_questions], warnings, used_inputs
else:
    warnings.append("GEMINI_API_KEY not set. Falling back to local templates.")

template_questions = _build_template_questions(request, call_type, role_key, used_inputs)`,
  },
  {
    id: "scoring",
    title: "Explainable scoring model",
    caption: "Hand-tuned linear weights and a logistic squash. Deterministic, free to run, and every point is traceable to a feature.",
    language: "ts",
    source: { path: "frontend/src/feedback/clientFeedback.ts", line: 237 },
    code: `const SPEECH_MODEL_WEIGHTS: Record<string, number> = {
  filler_rate: -3.5,
  unique_word_ratio: 1.2,
  avg_sentence_length: -0.03,
  sentence_length_std: -0.02,
  pause_rate_per_min: -0.08,
  long_pause_ratio: -1.2,
  speaking_rate_wpm: 0.01,
  repetition_rate: -2.5,
};

const logisticScore = (rawScore: number) => 100 / (1 + Math.exp(-rawScore));`,
  },
  {
    id: "rls",
    title: "Ownership enforced by the database",
    caption: "The browser talks to Supabase directly. Row Level Security is the access-control layer.",
    language: "sql",
    source: { path: "supabase/schema.sql", line: 246 },
    code: `create policy "Users can view their own sessions"
  on public.interview_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);`,
  },
];

export interface Decision {
  title: string;
  choice: string;
  why: string[];
  cost: string[];
}

export const decisions: Decision[] = [
  {
    title: "WebSocket PCM instead of WebRTC",
    choice: "The aiortc WebRTC path was removed. Audio now goes over a single WebSocket as raw 16 kHz Int16 PCM.",
    why: [
      "No SDP/ICE negotiation, STUN/TURN servers or aiortc native dependencies.",
      "One protocol for audio up and transcripts down, and it is easy to proxy.",
      "Raw PCM needs no codec decode before inference.",
    ],
    cost: [
      "TCP head-of-line blocking: a lost packet stalls the stream instead of being dropped.",
      "Uncompressed audio is 256 kbit/s (16,000 samples × 16 bits) per user.",
      "No built-in jitter buffer or echo cancellation beyond what getUserMedia provides.",
    ],
  },
  {
    title: "Scoring moved into the browser",
    choice: "speech_feedback.py, response_feedback.py and video_feedback.py were ported to clientFeedback.ts.",
    why: [
      "Feedback appears with no network round trip and keeps working when the backend is down.",
      "Server only spends compute on what needs Python: Whisper and resume parsing.",
      "Video measurements never leave the device for scoring.",
    ],
    cost: [
      "Two implementations of the same model that must be kept in sync, or the old endpoints removed.",
      "Scoring logic is visible to the client, which is acceptable for coaching but not for assessment.",
    ],
  },
  {
    title: "One question per request",
    choice: "The client requests num_questions: 1 and sends asked_questions every time.",
    why: [
      "The server stays stateless. There is no session store for question history.",
      "Follow-up questions can use everything asked so far.",
    ],
    cost: ["One extra round trip per question, and the template bank can run out mid-session."],
  },
  {
    title: "Heuristics before LLMs",
    choice: "Scoring uses explainable feature models. The LLM is used only to generate questions.",
    why: [
      "Deterministic: the same transcript always gives the same score.",
      "Free to run and easy to tune, and each suggestion maps to a measured feature.",
    ],
    cost: ["Cannot judge content as deeply as a model-graded rubric would."],
  },
  {
    title: "Backend-less persistence",
    choice: "The browser writes to Supabase directly. RLS policies enforce ownership.",
    why: ["No CRUD endpoints to build or secure in FastAPI.", "Auth, storage and Postgres come from one provider."],
    cost: [
      "Multi-step writes need client-side compensation (a session is deleted if its answers insert fails).",
      "Business rules that must be trusted cannot live only in the client.",
    ],
  },
];

export const realtimeChallenges: { title: string; body: string; source?: SourceRef }[] = [
  {
    title: "Cumulative vs incremental transcripts",
    body: "Streaming Whisper re-emits and revises earlier words as more context arrives. send_results tracks the last emitted word end and, when word timings are missing, diffs against the previous line and interpolates timestamps.",
    source: { path: "backend/app/parsers/video_parser/helpers.py", line: 11 },
  },
  {
    title: "Audio capture on the main thread",
    body: "ScriptProcessorNode is deprecated and runs on the main thread, so heavy UI work can delay audio callbacks. AudioWorklet is the natural upgrade path.",
    source: { path: "frontend/src/components/Interview/useWhisper.tsx", line: 234 },
  },
  {
    title: "Model instance per connection",
    body: "Each /asr socket constructs its own AudioProcessor. That is simple and isolated, but memory and CPU grow linearly with concurrent speakers, so capacity planning is per connection, not per request.",
    source: { path: "backend/app/api/realtime.py", line: 91 },
  },
  {
    title: "Graceful degradation",
    body: "A 4-second connect timeout decides between server ASR and the Web Speech API. Feedback is computed client-side, so a session still produces results with the backend offline.",
    source: { path: "frontend/src/components/Interview/useWhisper.tsx", line: 297 },
  },
  {
    title: "Browser capability variance",
    body: "FaceDetector is not available in every browser, so video metrics may be missing. Smile probability is always null, and mouth metrics come from a pixel heuristic on a lower-face crop.",
    source: { path: "frontend/src/components/Interview/LocalMediaRecorder.tsx", line: 370 },
  },
  {
    title: "Lost timing information",
    body: "The server sends word-level timestamps, but the client keeps only the text. Forwarding words[] into useFeedbackRequests would turn on the pause and speaking-rate features that already exist in the model.",
    source: { path: "frontend/src/components/Interview/useWhisper.tsx", line: 174 },
  },
];

export const deployment: { title: string; body: string }[] = [
  {
    title: "Containers today",
    body: "docker-compose builds the FastAPI image (python:3.11-slim with ffmpeg and the spaCy model) and an nginx image serving the Vite build. A named volume caches Whisper weights across restarts.",
  },
  {
    title: "Scaling the realtime tier",
    body: "/asr is stateful and CPU-heavy. It scales horizontally by concurrent connections behind a proxy that supports WebSocket upgrades and long idle timeouts. GPU nodes are an option for faster-whisper.",
  },
  {
    title: "Stateless HTTP tier",
    body: "/questions/generate and /parse-resume/ hold no session state and can run on any instance. Resume parsing is CPU-bound and benefits from a separate worker pool.",
  },
  {
    title: "Static frontend",
    body: "The SPA (and this showcase) is static. VITE_* variables are baked in at build time, so each environment needs its own build or a runtime config file.",
  },
  {
    title: "Configuration",
    body: "CORS_ALLOW_ORIGINS and WS_ALLOWED_ORIGINS come from the environment. They must include the deployed frontend origin, or browsers will block requests and /ws/results will close with code 1008.",
  },
];

export const security: { title: string; body: string; kind: "strength" | "risk" }[] = [
  {
    kind: "strength",
    title: "Secrets stay server-side",
    body: "GEMINI_API_KEY is read from the backend environment only. The browser holds just the Supabase publishable key, which is safe because RLS enforces access.",
  },
  {
    kind: "strength",
    title: "Row Level Security on every table",
    body: "Select, insert, update and delete policies all check auth.uid() = user_id. The summaries view is security_invoker, so it inherits them.",
  },
  {
    kind: "strength",
    title: "Private recordings",
    body: "The session-recordings bucket is private, scoped by user folder, and read only through time-limited signed URLs.",
  },
  {
    kind: "strength",
    title: "Minimal data in transit",
    body: "Video frames are reduced to numeric measurements on-device. Resumes are parsed in memory and not written to disk by the API.",
  },
  {
    kind: "risk",
    title: "Unauthenticated /asr socket",
    body: "/ws/results checks the Origin header, but /asr accepts any connection. Because each socket starts a Whisper engine, an origin check, an auth token and connection limits are the obvious hardening steps.",
  },
  {
    kind: "risk",
    title: "Upload size not enforced",
    body: "file_handler.py defines MAX_FILE_SIZE (10 MB), but validate_file only checks the extension, and the whole upload is read into memory.",
  },
  {
    kind: "risk",
    title: "Debug logging of request fields",
    body: "The resume route prints the client-sent filePath. Structured logging that excludes user-supplied values would be preferable in production.",
  },
];
