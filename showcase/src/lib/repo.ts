import type { SourceRef } from "./types";

export const REPO_URL = "https://github.com/akurtle/TalkitoutAI";
const BLOB_BASE = `${REPO_URL}/blob/main`;

export const sourceUrl = (ref: SourceRef) =>
  `${BLOB_BASE}/${ref.path}${ref.line ? `#L${ref.line}` : ""}`;

export const sourceLabel = (ref: SourceRef) =>
  ref.label ?? `${ref.path}${ref.line ? `:${ref.line}` : ""}`;

export const DEMO_NOTICE_LEAD =
  "Interactive architecture demonstration. Backend execution and AI responses are simulated for portfolio purposes.";
export const DEMO_NOTICE_TAIL = "The full implementation is available on GitHub.";
export const DEMO_NOTICE = `${DEMO_NOTICE_LEAD} ${DEMO_NOTICE_TAIL}`;
