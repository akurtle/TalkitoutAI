import type { PlaybackStep, Scenario } from "../lib/types";

/*
 * Deterministic, hand-authored playback of real request paths.
 * Payload shapes follow the Pydantic models and TypeScript types in the repository.
 * Values are examples and are not captured from a live run.
 */

const questionIntro: PlaybackStep[] = [
  {
    id: "q-build",
    title: "Setup form builds a QuestionRequest",
    description:
      "QuestionGenerator validates that a role is present, then asks for exactly one question. Previously asked questions travel with every request so the server can de-duplicate.",
    nodes: ["qgen"],
    payload: {
      label: "QuestionRequest (frontend)",
      direction: "internal",
      body: `{
  "role": "Backend Engineer",
  "company": "Acme",
  "call_type": "interview",
  "num_questions": 1,
  "asked_questions": []
}`,
    },
    source: { path: "frontend/src/components/Interview/QuestionGenerator.tsx", line: 346 },
  },
  {
    id: "q-post",
    title: "POST /questions/generate",
    description: "Plain JSON over HTTP. fetchWithLoopbackFallback retries the alternate loopback host if the first fetch throws a TypeError.",
    nodes: ["qgen", "apiQuestions"],
    edges: [{ id: "e-qgen-api" }],
    payload: {
      label: "HTTP request",
      direction: "request",
      body: `POST /questions/generate HTTP/1.1
Content-Type: application/json

{ "role": "Backend Engineer", "company": "Acme",
  "call_type": "interview", "num_questions": 1, "asked_questions": [] }`,
    },
    source: { path: "frontend/src/network.ts" },
  },
  {
    id: "q-validate",
    title: "Router validates and delegates",
    description: "FastAPI parses the body into QuestionRequest (num_questions is bounded 1–30) and calls generate_questions().",
    nodes: ["apiQuestions", "generator"],
    edges: [{ id: "e-api-generator" }],
    source: { path: "backend/app/api/questions.py", line: 12 },
  },
  {
    id: "q-normalise",
    title: "Normalise call type and detect role",
    description: "Keyword matching maps free-text input onto internal categories. These choices are echoed back in used_inputs.",
    nodes: ["generator"],
    payload: {
      label: "Derived inputs",
      direction: "internal",
      body: `_normalize_call_type("interview")  → "interview"
_detect_role("Backend Engineer")   → "backend"

used_inputs = ["call_type:interview", "role:backend"]`,
    },
    source: { path: "backend/app/questions/question_generator.py", line: 95 },
  },
];

const templateBranch: PlaybackStep[] = [
  {
    id: "q-templates",
    title: "No GEMINI_API_KEY → local templates",
    description:
      "The generator records a warning and builds the role-specific bank (technical → system design → behavioural, plus a company question). _filter_new_questions drops anything already asked.",
    nodes: ["generator", "templates"],
    edges: [{ id: "e-generator-templates" }],
    payload: {
      label: "Template selection",
      direction: "internal",
      body: `INTERVIEW_ROLE_TECHNICAL_QUESTIONS["backend"][0]
→ "How do you design APIs for backward compatibility?"

warnings.append("GEMINI_API_KEY not set. Falling back to local templates.")`,
    },
    source: { path: "backend/app/questions/question_generator.py", line: 140 },
  },
  {
    id: "q-respond",
    title: "QuestionResponse returns to the browser",
    description: "The warning is part of the contract. The UI can show the user that template questions were used.",
    nodes: ["apiQuestions", "qgen"],
    edges: [
      { id: "e-api-generator", reverse: true },
      { id: "e-qgen-api", reverse: true },
    ],
    payload: {
      label: "HTTP 200 · QuestionResponse",
      direction: "response",
      body: `{
  "questions": [
    { "category": "technical",
      "question": "How do you design APIs for backward compatibility?",
      "rationale": null }
  ],
  "warnings": ["GEMINI_API_KEY not set. Falling back to local templates."],
  "used_inputs": ["call_type:interview", "role:backend", "company:Acme"]
}`,
    },
    source: { path: "backend/app/questions/models.py" },
  },
  {
    id: "q-render",
    title: "Question rendered; next one fetched on demand",
    description:
      "When the user presses Next, the same request is sent again with asked_questions populated, until the bank is exhausted and the session ends.",
    nodes: ["qgen"],
    payload: {
      label: "Next request",
      direction: "internal",
      body: `{ …, "num_questions": 1,
  "asked_questions": ["How do you design APIs for backward compatibility?"] }`,
    },
  },
];

const geminiBranch: PlaybackStep[] = [
  {
    id: "q-gemini-call",
    title: "GEMINI_API_KEY set → call Gemini",
    description:
      "A strict-JSON prompt is sent with urllib. 429/5xx and network errors are retried up to 3 times with exponential backoff. The key stays on the server.",
    nodes: ["generator", "gemini"],
    edges: [{ id: "e-generator-gemini" }],
    payload: {
      label: "generateContent request",
      direction: "request",
      body: `POST …/models/gemini-1.5-flash:generateContent?key=•••
{
  "contents": [
    { "role": "user", "parts": [{ "text": "You generate interview/sales/presentation coaching questions. Return ONLY valid JSON … Return exactly 1 question(s)." }] },
    { "role": "user", "parts": [{ "text": "{\\"role\\": \\"Backend Engineer\\", \\"company\\": \\"Acme\\", …}" }] }
  ],
  "generationConfig": { "temperature": 0.4, "maxOutputTokens": 256 }
}`,
    },
    source: { path: "backend/app/questions/question_generator.py", line: 222 },
  },
  {
    id: "q-gemini-parse",
    title: "Extract JSON from the model reply",
    description:
      "Markdown fences are stripped and the outermost {…} is parsed. Results are filtered against asked_questions. If parsing fails, a warning is added and the template path runs instead.",
    nodes: ["generator", "gemini"],
    edges: [{ id: "e-generator-gemini", reverse: true }],
    payload: {
      label: "Model text → QuestionItem[]",
      direction: "response",
      body: `\`\`\`json
{ "questions": [ { "category": "technical",
  "question": "How would you design Acme's order API so mobile clients on old versions keep working?" } ] }
\`\`\`
→ _extract_json() → QuestionItem(category="technical", question="…")`,
    },
    source: { path: "backend/app/questions/question_generator.py", line: 268 },
  },
  {
    id: "q-gemini-respond",
    title: "QuestionResponse returns to the browser",
    description: "Same contract as the template path, so the frontend does not branch on the source.",
    nodes: ["apiQuestions", "qgen"],
    edges: [
      { id: "e-api-generator", reverse: true },
      { id: "e-qgen-api", reverse: true },
    ],
    payload: {
      label: "HTTP 200 · QuestionResponse",
      direction: "response",
      body: `{
  "questions": [ { "category": "technical",
    "question": "How would you design Acme's order API so mobile clients on old versions keep working?",
    "rationale": null } ],
  "warnings": [],
  "used_inputs": ["call_type:interview", "role:backend"]
}`,
    },
  },
];

export const scenarios: Scenario[] = [
  {
    id: "questions",
    title: "Generate interview questions",
    summary: "React → FastAPI → Gemini or local templates → QuestionResponse",
    steps: [...questionIntro, ...templateBranch],
    variants: [
      { id: "templates", label: "No API key (templates)", steps: [...questionIntro, ...templateBranch] },
      { id: "gemini", label: "Gemini configured", steps: [...questionIntro, ...geminiBranch] },
    ],
  },
  {
    id: "session",
    title: "Process live interview audio",
    summary: "Mic → PCM16 WebSocket → WhisperLiveKit → word deltas → live tips",
    steps: [
      {
        id: "s-start",
        title: "Controller starts transcription",
        description:
          "useMockInterviewController hands its MediaStream to useWhisperWS.start(). If no stream exists, the hook requests one with getUserMedia.",
        nodes: ["controller", "whisper"],
        edges: [{ id: "e-controller-whisper" }],
        source: { path: "frontend/src/hooks/useMockInterviewController.ts", line: 87 },
      },
      {
        id: "s-pcm",
        title: "Float32 audio → Int16 PCM in the browser",
        description: "A 16 kHz AudioContext feeds a ScriptProcessor. Each 4096-sample buffer is clamped and scaled to Int16.",
        nodes: ["whisper"],
        payload: {
          label: "onaudioprocess (excerpt)",
          direction: "internal",
          body: `const samples = e.inputBuffer.getChannelData(0);
const pcm = new Int16Array(samples.length);
for (let i = 0; i < samples.length; i++) {
  pcm[i] = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
}
ws.send(pcm.buffer);`,
        },
        source: { path: "frontend/src/components/Interview/useWhisper.tsx", line: 234 },
      },
      {
        id: "s-ws",
        title: "Binary frames stream to WS /asr",
        description: "The socket must open within 4 s. After that, every audio callback sends one binary frame with no container format.",
        nodes: ["whisper", "wsAsr"],
        edges: [{ id: "e-whisper-ws" }],
        payload: {
          label: "WebSocket frames",
          direction: "request",
          body: `GET /asr  Upgrade: websocket
→ binary  ArrayBuffer(8192)   // 4096 × Int16 LE
→ binary  ArrayBuffer(8192)
→ …`,
        },
      },
      {
        id: "s-engine",
        title: "AudioProcessor buffers and transcribes",
        description: "Each connection gets its own WhisperLiveKit AudioProcessor with the faster-whisper base English model.",
        nodes: ["wsAsr", "whisperEngine"],
        edges: [{ id: "e-ws-engine" }],
        payload: {
          label: "Server setup (realtime.py)",
          direction: "internal",
          body: `ap = AudioProcessor(
    transcription_engine=TranscriptionEngine(model="base", diarization=False, lan="en")
)
gen = await ap.create_tasks()
task = asyncio.create_task(send_results(ws, gen))
...
await ap.process_audio(chunk)`,
        },
        source: { path: "backend/app/api/realtime.py", line: 91 },
      },
      {
        id: "s-delta",
        title: "Cumulative lines → new-word deltas",
        description:
          "Engine output repeats earlier text as it refines it. send_results forwards only words ending after last_sent_word_end, interpolating timings when the engine gives none.",
        nodes: ["whisperEngine", "sendResults"],
        edges: [{ id: "e-engine-send" }],
        payload: {
          label: "Engine line → delta",
          direction: "internal",
          body: `line.text = "I led the migration of our billing service"
last_sent_word_end = 4.9   // "…migration" already sent

→ new words: ["of", "our", "billing", "service"]`,
        },
        source: { path: "backend/app/parsers/video_parser/helpers.py", line: 11 },
      },
      {
        id: "s-push",
        title: "Transcript message returns over the socket",
        description: "A JSON text frame travels back on the same WebSocket. The hook forwards msg.text through onTranscript.",
        nodes: ["sendResults", "wsAsr", "whisper"],
        edges: [
          { id: "e-send-ws" },
          { id: "e-whisper-ws", reverse: true },
        ],
        payload: {
          label: "WebSocket text frame",
          direction: "response",
          body: `{
  "type": "asr",
  "text": "of our billing service",
  "segment_start": 3.2,
  "segment_end": 6.1,
  "words": [
    { "word": "of", "start": 4.9, "end": 5.1 },
    { "word": "our", "start": 5.1, "end": 5.3 },
    { "word": "billing", "start": 5.3, "end": 5.7 },
    { "word": "service", "start": 5.7, "end": 6.1 }
  ]
}`,
        },
        source: { path: "backend/app/parsers/video_parser/helpers.py", line: 82 },
      },
      {
        id: "s-live",
        title: "Live coaching from the transcript",
        description:
          "The controller appends { text, isFinal, ts }. useLiveSpeechMetrics recomputes pace and filler tips while the user is still talking.",
        nodes: ["whisper", "controller", "liveMetrics"],
        edges: [
          { id: "e-controller-whisper", reverse: true },
          { id: "e-controller-live" },
        ],
        payload: {
          label: "LiveSpeechMetrics (example)",
          direction: "event",
          body: `{
  "wpm": 148,
  "paceStatus": "good",
  "fillerCount": 3,
  "fillerRate": 2.4,
  "tips": [ { "id": "pace-good", "level": "good", "text": "Pace is steady." } ]
}`,
        },
        source: { path: "frontend/src/hooks/useLiveSpeechMetrics.ts", line: 4 },
      },
      {
        id: "s-vision",
        title: "In parallel: client-side vision sampling",
        description: "When video is on, LocalMediaRecorder samples FaceDetector every 800 ms. Only numeric measurements reach the controller.",
        nodes: ["recorder", "controller"],
        edges: [{ id: "e-recorder-controller" }],
        payload: {
          label: "VisionFrame",
          direction: "event",
          body: `{ "type": "frame", "source": "client",
  "frame": { "face_present": true, "looking_at_camera": true,
    "smile_prob": null, "head_yaw": 4.1, "head_pitch": -2.3,
    "mouth_open_ratio": 0.21, "mouth_movement_delta": 0.024,
    "articulation_active": true } }`,
        },
        source: { path: "frontend/src/components/Interview/LocalMediaRecorder.tsx", line: 413 },
      },
      {
        id: "s-fallback",
        title: "Resilience: browser SpeechRecognition fallback",
        description:
          "If the backend is unreachable or the mic stream cannot be routed, the same hook switches to the Web Speech API. Callers receive the same onTranscript events.",
        nodes: ["whisper", "browserSR", "controller"],
        edges: [{ id: "e-whisper-sr" }],
        source: { path: "frontend/src/components/Interview/useWhisper.tsx", line: 297 },
      },
    ],
  },
  {
    id: "resume",
    title: "Analyze a resume",
    summary: "PDF/DOCX → multipart POST → pdfplumber/docx + spaCy → ParseResponse",
    steps: [
      {
        id: "r-select",
        title: "User selects a PDF or DOCX",
        description: "GetStarted keeps the File and wraps it in FormData together with a filePath field.",
        nodes: ["resumeUi"],
        source: { path: "frontend/src/pages/GetStarted.tsx", line: 37 },
      },
      {
        id: "r-upload",
        title: "Multipart upload to /parse-resume/",
        description: "The raw document bytes go to FastAPI in one request.",
        nodes: ["resumeUi", "apiResume"],
        edges: [{ id: "e-resume-api" }],
        payload: {
          label: "HTTP request",
          direction: "request",
          body: `POST /parse-resume/ HTTP/1.1
Content-Type: multipart/form-data; boundary=----b

------b
Content-Disposition: form-data; name="file"; filename="jordan_lee.pdf"
Content-Type: application/pdf

%PDF-1.7 …
------b
Content-Disposition: form-data; name="filePath"

blob:http://localhost:3000/…`,
        },
      },
      {
        id: "r-validate",
        title: "Validate extension",
        description: "Only .pdf and .docx are accepted. Anything else returns HTTP 400 before parsing starts.",
        nodes: ["apiResume"],
        source: { path: "backend/app/utils/file_handler.py", line: 6 },
      },
      {
        id: "r-text",
        title: "Extract raw text in memory",
        description: "pdfplumber concatenates page text. python-docx joins paragraphs. Nothing is written to disk.",
        nodes: ["apiResume", "resumeParser"],
        edges: [{ id: "e-api-parser" }],
        source: { path: "backend/app/parsers/resume_parser.py", line: 78 },
      },
      {
        id: "r-sections",
        title: "Detect sections by heading",
        description:
          "Lines are matched against normalised heading sets (configurable via env). Inline 'Skills: a | b' headings and bullet or pipe lists are split into items.",
        nodes: ["resumeParser"],
        payload: {
          label: "_extract_sections() result",
          direction: "internal",
          body: `{
  "skills":     ["Python", "FastAPI", "PostgreSQL", "Docker"],
  "experience": ["Software Engineer, Northwind — Jan 2023 – Present", "…"],
  "education":  ["B.Sc. Computer Science, Memorial University"]
}`,
        },
        source: { path: "backend/app/parsers/resume_parser.py", line: 95 },
      },
      {
        id: "r-fields",
        title: "NER and regex field extraction",
        description: "spaCy PERSON entities in the first 500 characters give the name. Email and phone use regex. Empty sections fall back to keyword heuristics.",
        nodes: ["resumeParser"],
        source: { path: "backend/app/parsers/resume_parser.py", line: 151 },
      },
      {
        id: "r-respond",
        title: "ParseResponse returns to the UI",
        description: "The Analysis step renders the structured profile. This data is not yet used to seed question generation.",
        nodes: ["apiResume", "resumeUi"],
        edges: [
          { id: "e-api-parser", reverse: true },
          { id: "e-resume-api", reverse: true },
        ],
        payload: {
          label: "HTTP 200 · ParseResponse",
          direction: "response",
          body: `{
  "success": true,
  "filename": "jordan_lee.pdf",
  "data": {
    "name": "Jordan Lee",
    "email": "jordan.lee@example.com",
    "phone": "+1 709 555 0142",
    "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
    "education": [{ "text": "B.Sc. Computer Science, Memorial University" }],
    "experience": [{ "title": "Software Engineer", "company": "Northwind", "dates": "Jan 2023 – Present" }],
    "total_experience": null
  },
  "error": null
}`,
        },
        source: { path: "backend/app/models.py" },
      },
    ],
  },
  {
    id: "feedback",
    title: "Generate interview feedback",
    summary: "Transcript + frames → client-side scoring → FeedbackPanel → Supabase",
    steps: [
      {
        id: "f-collect",
        title: "Session ends; collect this session's data",
        description:
          "useFeedbackRequests slices transcripts and frames recorded since markSessionStart(), and pairs each non-empty answer with its question.",
        nodes: ["controller", "recorder"],
        payload: {
          label: "requestFeedback() inputs",
          direction: "internal",
          body: `sessionText = "So, um, at Northwind I led the migration of our billing service…"
questionResponses = [
  { index: 0, category: "behavioral",
    question: "Tell me about a time you had to handle conflicting priorities.",
    answer_text: "So, um, at Northwind…" }
]
sessionFrames = VisionFrame[]   // when video was enabled`,
        },
        source: { path: "frontend/src/hooks/useFeedbackRequests.ts", line: 131 },
      },
      {
        id: "f-features",
        title: "Speech feature extraction (in the browser)",
        description:
          "No network call. The TypeScript port extracts the same features as speech_feedback.py. Only plain text is passed today (word timestamps from /asr are dropped in useWhisper), so pause and WPM features are 0 and a warning is returned. Live pace comes from useLiveSpeechMetrics.",
        nodes: ["controller", "scoring"],
        edges: [{ id: "e-controller-scoring" }],
        payload: {
          label: "Feature vector (example)",
          direction: "internal",
          body: `{
  "filler_rate": 0.031,
  "unique_word_ratio": 0.58,
  "avg_sentence_length": 17.2,
  "sentence_length_std": 6.4,
  "pause_rate_per_min": 0,
  "long_pause_ratio": 0,
  "speaking_rate_wpm": 0,
  "repetition_rate": 0.012
}`,
        },
        source: { path: "frontend/src/feedback/clientFeedback.ts", line: 237 },
      },
      {
        id: "f-model",
        title: "Linear model → logistic score",
        description: "Weighted features plus a bias of 0.2 are passed through 100 / (1 + e^-x), which keeps the score in 0–100.",
        nodes: ["scoring"],
        payload: {
          label: "Scoring math (actual weights)",
          direction: "internal",
          body: `raw = 0.2
    + (-3.5)  * filler_rate
    + ( 1.2)  * unique_word_ratio
    + (-0.03) * avg_sentence_length
    + (-0.02) * sentence_length_std
    + (-0.08) * pause_rate_per_min
    + (-1.2)  * long_pause_ratio
    + ( 0.01) * speaking_rate_wpm
    + (-2.5)  * repetition_rate

score = 100 / (1 + Math.exp(-raw))`,
        },
        source: { path: "frontend/src/feedback/clientFeedback.ts", line: 281 },
      },
      {
        id: "f-answers",
        title: "Per-answer quality review",
        description:
          "Each answer is scored on relevance, completeness, specificity and structure, with category-aware expectations (e.g. behavioural answers should run 55–190 words and show STAR markers).",
        nodes: ["scoring"],
        payload: {
          label: "QuestionResponseReview (shape)",
          direction: "internal",
          body: `{
  "index": 0, "score": …, "summary": "…",
  "strengths": ["…"], "improvements": ["…"],
  "dimension_scores": {
    "relevance": …, "completeness": …,
    "specificity": …, "structure": …
  }
}`,
        },
        source: { path: "frontend/src/feedback/clientFeedback.ts", line: 706 },
      },
      {
        id: "f-video",
        title: "Video presence score from frames",
        description: "Face presence, gaze rate, head-movement variability and articulation go through a second linear model.",
        nodes: ["recorder", "scoring"],
        source: { path: "frontend/src/feedback/clientFeedback.ts", line: 1067 },
      },
      {
        id: "f-panel",
        title: "Results rendered in FeedbackPanel",
        description: "Speech, response and video results return synchronously to the controller and appear immediately.",
        nodes: ["scoring", "controller"],
        edges: [{ id: "e-controller-scoring", reverse: true }],
        payload: {
          label: "SpeechFeedbackResult (shape)",
          direction: "response",
          body: `{
  "score": …, "metrics": { … }, "feedback": ["…"], "warnings": [],
  "response_score": …, "response_feedback": ["…"],
  "question_reviews": [ … ]
}`,
        },
      },
      {
        id: "f-overall",
        title: "Overall score and persistence",
        description:
          "If signed in, sessionStore blends available scores (speech 35 %, video 30 %, response 35 % when all three exist) and inserts the session row.",
        nodes: ["controller", "sessionStore", "supabaseDb"],
        edges: [{ id: "e-controller-store" }, { id: "e-store-db" }],
        payload: {
          label: "computeOverallScore",
          direction: "request",
          body: `all three   → 0.35·speech + 0.30·video + 0.35·response
speech+video → 0.55·speech + 0.45·video
speech+resp  → 0.45·speech + 0.55·response
video+resp   → 0.45·video  + 0.55·response
one score    → that score`,
        },
        source: { path: "frontend/src/sessionStore.ts", line: 13 },
      },
      {
        id: "f-answers-insert",
        title: "Answers inserted with compensation",
        description:
          "One interview_session_answers row is written per question. If that insert fails, the parent session row is deleted so history never shows half-saved sessions.",
        nodes: ["sessionStore", "supabaseDb"],
        edges: [{ id: "e-store-db" }],
        source: { path: "frontend/src/sessionStore.ts", line: 95 },
      },
      {
        id: "f-recording",
        title: "Recording upload (best effort)",
        description: "The MediaRecorder blob goes to the private session-recordings bucket. If the upload fails, the user gets a warning and the session stays saved.",
        nodes: ["sessionStore", "supabaseStorage"],
        edges: [{ id: "e-store-storage" }],
        payload: {
          label: "Storage object",
          direction: "request",
          body: `bucket: session-recordings
path:   {userId}/{sessionId}/recording.webm
upsert: false`,
        },
        source: { path: "frontend/src/sessionStore.ts", line: 54 },
      },
    ],
  },
  {
    id: "history",
    title: "Sign in and load history",
    summary: "Supabase Auth → JWT → RLS-scoped summaries view → progress chart",
    steps: [
      {
        id: "h-signin",
        title: "Sign in with email or Google",
        description: "Auth.tsx calls signInWithPassword, signUp or signInWithOAuth on the Supabase client.",
        nodes: ["authUi", "supabaseAuth"],
        edges: [{ id: "e-auth-supabase" }],
        source: { path: "frontend/src/pages/Auth.tsx", line: 70 },
      },
      {
        id: "h-session",
        title: "JWT session returned and persisted",
        description: "AuthProvider listens to onAuthStateChange. Protected routes render once a user is present.",
        nodes: ["supabaseAuth", "authUi"],
        edges: [{ id: "e-auth-supabase", reverse: true }],
        payload: {
          label: "Auth event",
          direction: "response",
          body: `onAuthStateChange("SIGNED_IN", {
  user: { id: "8f3c…", email: "…" },
  access_token: "eyJhbGciOi…",  // sent on later requests
  refresh_token: "…"
})`,
        },
        source: { path: "frontend/src/auth.tsx", line: 42 },
      },
      {
        id: "h-list",
        title: "Query the summaries view",
        description: "listInterviewSessions selects up to 20 rows from interview_session_summaries, newest first.",
        nodes: ["authUi", "sessionStore", "supabaseDb"],
        edges: [{ id: "e-auth-store" }, { id: "e-store-db" }],
        payload: {
          label: "supabase-js query",
          direction: "request",
          body: `supabase.from("interview_session_summaries")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(20)`,
        },
        source: { path: "frontend/src/sessionStore.ts", line: 202 },
      },
      {
        id: "h-rls",
        title: "Row Level Security enforces ownership",
        description:
          "The view is security_invoker, so the underlying table policy (auth.uid() = user_id) applies. The .eq() filter is a convenience. Access control is enforced by the database.",
        nodes: ["supabaseDb"],
        payload: {
          label: "schema.sql",
          direction: "internal",
          body: `create policy "Users can view their own sessions"
  on public.interview_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);`,
        },
        source: { path: "supabase/schema.sql", line: 246 },
      },
      {
        id: "h-render",
        title: "History list and score progression",
        description: "Rows return to the Account page, which renders the session list, per-session details and the ScoreProgressChart.",
        nodes: ["supabaseDb", "sessionStore", "authUi"],
        edges: [
          { id: "e-store-db", reverse: true },
          { id: "e-auth-store", reverse: true },
        ],
        payload: {
          label: "StoredInterviewSessionSummary[] (example)",
          direction: "response",
          body: `[
  { "id": "…", "session_type": "interview", "record_mode": "both",
    "role": "Backend Engineer", "question_count": 3,
    "speech_score": 72.4, "video_score": 68.1,
    "response_score": 70.2, "overall_score": 70.34,
    "has_recording": true, "created_at": "2026-05-04T14:12:09Z" }
]`,
        },
      },
      {
        id: "h-signed",
        title: "Recording playback via signed URL",
        description: "Selecting a session with a recording requests a time-limited signed URL, so the bucket never needs to be public.",
        nodes: ["sessionStore", "supabaseStorage"],
        edges: [{ id: "e-store-storage" }],
        source: { path: "frontend/src/sessionStore.ts" },
      },
    ],
  },
];

export const scenarioById = (id: string) => scenarios.find((s) => s.id === id);
