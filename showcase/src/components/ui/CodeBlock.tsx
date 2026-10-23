import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import type { CodeLanguage } from "../../lib/code";

const KEYWORDS: Record<CodeLanguage, string[]> = {
  ts: ["const", "let", "if", "else", "for", "return", "await", "async", "new", "export", "type", "function", "true", "false", "null", "Record", "string", "number"],
  py: ["def", "async", "await", "return", "if", "else", "elif", "for", "in", "try", "except", "finally", "while", "True", "False", "None", "not", "and", "or", "continue", "import", "from", "class"],
  sql: ["create", "policy", "on", "for", "select", "to", "using", "insert", "update", "delete", "from", "where", "table", "view", "with", "as"],
  json: ["true", "false", "null"],
  text: [],
};

/*
 * Single-pass tokenizer. Highlighting stays inside the record's two inks:
 * keywords bold, strings and numbers blue, comments italic grey.
 */
function highlight(code: string, lang: CodeLanguage): ReactNode[] {
  if (lang === "text") return [code];
  const kw = KEYWORDS[lang].join("|");
  const comment = lang === "py" ? "#[^\\n]*" : lang === "sql" ? "--[^\\n]*" : "\\/\\/[^\\n]*";
  const re = new RegExp(
    `(${comment})|("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*'|\`[^\`]*\`)|(\\b\\d+(?:\\.\\d+)?\\b)|(@[\\w.]+)|\\b(${kw})\\b`,
    "g"
  );
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [tok] = m;
    let cls = "";
    if (m[1]) cls = "italic text-ink-3";
    else if (m[2]) cls = lang === "json" && code[re.lastIndex] === ":" ? "text-ink font-bold" : "text-blue";
    else if (m[3]) cls = "text-blue";
    else if (m[4]) cls = "text-ink font-bold";
    else if (m[5]) cls = "font-bold";
    out.push(
      <span key={i++} className={cls}>
        {tok}
      </span>
    );
    last = re.lastIndex;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({
  code,
  language = "text",
  className = "",
  maxHeight = "max-h-80",
  copyable = true,
}: {
  code: string;
  language?: CodeLanguage;
  className?: string;
  maxHeight?: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={`group relative border border-hair bg-paper ${className}`}>
      {copyable && (
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="absolute right-1.5 top-1.5 z-10 border border-hair bg-sheet p-1.5 text-ink-3 opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
      <pre className={`overflow-auto px-4 py-3 font-mono text-[13px] leading-[21px] text-ink ${maxHeight}`}>
        <code>{highlight(code, language)}</code>
      </pre>
    </div>
  );
}
