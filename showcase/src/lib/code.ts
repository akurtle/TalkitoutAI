export type CodeLanguage = "ts" | "py" | "sql" | "json" | "text";

/** Best-effort language detection for payload excerpts. */
export const guessLanguage = (body: string): CodeLanguage => {
  const t = body.trimStart();
  if (t.startsWith("{") || t.startsWith("[")) return "json";
  if (/^(def |async def |@router|ap = |_normalize|line\.text|INTERVIEW_|warnings\.)/m.test(t)) return "py";
  if (/^create policy/i.test(t)) return "sql";
  if (/^(const |supabase\.|onAuthStateChange|sessionText|raw = )/m.test(t)) return "ts";
  return "text";
};
