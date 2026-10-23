import raw from "./interview.json";

export type ModeId = "behavioral" | "technical" | "presentation";
export type RoleId = "backend" | "frontend" | "ml";
export type LevelId = "junior" | "mid" | "senior";

export interface TranscriptSegment {
  /** Seconds from the start of the answer on the simulated clock. */
  t: number;
  text: string;
}

export interface SampleQuestion {
  id: string;
  category: string;
  question: string;
  segments: TranscriptSegment[];
  annotation: { strength: string; improvement: string };
}

export interface ModeFeedback {
  overall: number;
  dimensions: { clarity: number; structure: number; relevance: number };
  suggestions: string[];
}

interface InterviewData {
  roles: { id: RoleId; label: string; hint: string }[];
  modes: { id: ModeId; label: string; hint: string; callType: string }[];
  levels: { id: LevelId; label: string; prefix: string }[];
  questions: {
    behavioral: SampleQuestion[];
    technical: Record<RoleId, SampleQuestion[]>;
    presentation: SampleQuestion[];
  };
  feedback: Record<ModeId, ModeFeedback>;
}

export const interviewData = raw as InterviewData;

export const getQuestions = (mode: ModeId, role: RoleId): SampleQuestion[] =>
  mode === "technical" ? interviewData.questions.technical[role] : interviewData.questions[mode];

/** Role text as the real QuestionRequest would carry it. Level folds into the free-text role. */
export const roleText = (role: RoleId, level: LevelId) => {
  const label = interviewData.roles.find((r) => r.id === role)?.label ?? role;
  const prefix = interviewData.levels.find((l) => l.id === level)?.prefix ?? "";
  return prefix ? `${prefix} ${label}` : label;
};

/*
 * Vocabularies mirrored from frontend/src/feedback/clientFeedback.ts so the
 * annotations highlight the same words the real scoring module counts.
 */
const FILLER_WORDS = new Set(["um", "uh", "erm", "like", "actually", "basically", "literally", "well", "so", "right", "okay", "ok"]);
const FILLER_PHRASES = new Set(["you know", "kind of", "sort of"]);
const DETAIL_MARKERS = new Set(["because", "example", "impact", "improved", "increased", "launched", "metric", "outcome", "reduced", "result", "shipped"]);
const STRUCTURE_MARKERS = new Set([
  "after", "before", "finally", "first", "next", "then",
  "challenge", "learned", "managed", "owned", "resolved", "situation", "task",
  "api", "cache", "database", "latency", "queue", "retry", "scaling", "throughput", "tradeoff",
  "audience", "goal", "message", "objection", "story", "takeaway",
]);

export type TokenKind = "plain" | "filler" | "detail" | "structure";
export interface AnnotatedToken {
  text: string;
  kind: TokenKind;
}

const normalise = (word: string) => word.toLowerCase().replace(/[^a-z0-9']/g, "");

/** Split a segment into display tokens (words keep trailing punctuation and spacing). */
export const annotate = (text: string): AnnotatedToken[] => {
  const parts = text.split(/(\s+)/);
  const words = parts.map(normalise);
  const out: AnnotatedToken[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.trim()) {
      out.push({ text: part, kind: "plain" });
      continue;
    }
    const w = words[i];
    const nextWord = words[i + 2];
    // A comma directly after the first word ("you, know") breaks the phrase.
    if (nextWord && FILLER_PHRASES.has(`${w} ${nextWord}`) && !/[,.]$/.test(part)) {
      out.push({ text: `${part}${parts[i + 1]}${parts[i + 2]}`, kind: "filler" });
      i += 2;
      continue;
    }
    let kind: TokenKind = "plain";
    if (FILLER_WORDS.has(w)) kind = "filler";
    else if (DETAIL_MARKERS.has(w) || /\d/.test(w)) kind = "detail";
    else if (STRUCTURE_MARKERS.has(w)) kind = "structure";
    out.push({ text: part, kind });
  }
  return out;
};

export const countKinds = (questions: SampleQuestion[]) => {
  const counts: Record<TokenKind, number> = { plain: 0, filler: 0, detail: 0, structure: 0 };
  const fillers = new Map<string, number>();
  for (const q of questions) {
    for (const s of q.segments) {
      for (const tok of annotate(s.text)) {
        counts[tok.kind] += tok.kind === "plain" && !tok.text.trim() ? 0 : 1;
        if (tok.kind === "filler") {
          const label = tok.text.toLowerCase().replace(/[^a-z' ]/g, "").trim();
          fillers.set(label, (fillers.get(label) ?? 0) + 1);
        }
      }
    }
  }
  const words = questions.reduce(
    (sum, q) => sum + q.segments.reduce((s, seg) => s + seg.text.split(/\s+/).filter(Boolean).length, 0),
    0
  );
  return { counts, fillers: [...fillers.entries()].sort((a, b) => b[1] - a[1]), words };
};
