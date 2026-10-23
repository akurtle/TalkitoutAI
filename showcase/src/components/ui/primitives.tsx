import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import type { ImplStatus, NodeKind, SourceRef } from "../../lib/types";
import { kindStyles, statusStyles } from "../../lib/styles";
import { sourceLabel, sourceUrl } from "../../lib/repo";

/**
 * Numbered pleading paper: line numbers down the left margin and the red double rule.
 * Numbers repeat every 28 lines, as on a real sheet.
 */
export function Pleading({ children, className = "", tone = "sheet" }: { children: ReactNode; className?: string; tone?: "sheet" | "paper" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState(28);
  const [offset, setOffset] = useState(0);

  // Register the numerals with the text: the first [data-grid] line inside sets the phase of the 28px grid.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const anchor = el.querySelector<HTMLElement>("[data-grid]");
      const top = anchor
        ? anchor.getBoundingClientRect().top - el.getBoundingClientRect().top + parseFloat(getComputedStyle(anchor).paddingTop || "0")
        : 0;
      const phase = ((top % 28) + 28) % 28;
      setOffset(phase);
      setLines(Math.max(1, Math.floor((el.clientHeight - phase) / 28)));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative ${tone === "sheet" ? "bg-sheet" : ""} ${className}`}>
      <div aria-hidden style={{ paddingTop: offset }} className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 select-none overflow-hidden sm:block">
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="block pr-3 text-right font-mono text-[11px] leading-[28px] text-ink-3/70 tnum">
            {(i % 28) + 1}
          </span>
        ))}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[54px] hidden w-[4px] border-x border-red/80 sm:block" />
      <div className="sm:pl-[78px]">{children}</div>
    </div>
  );
}

/** A reporter's parenthetical. Used for every state the old design rendered as a badge. */
export function Paren({ children, className = "", tone = "ink" }: { children: ReactNode; className?: string; tone?: "ink" | "red" | "blue" }) {
  const color = tone === "red" ? "text-red" : tone === "blue" ? "text-blue" : "text-ink-3";
  return <span className={`font-mono text-[13px] italic ${color} ${className}`}>({children})</span>;
}

export function StatusMark({ status, className = "" }: { status: ImplStatus; className?: string }) {
  const s = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-2 text-[13px] text-ink-2 ${className}`}>
      <span className={`w-5 border-t-2 ${s.line}`} aria-hidden />
      {s.label}
    </span>
  );
}

export function KindMark({ kind }: { kind: NodeKind }) {
  const k = kindStyles[kind];
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-ink-2">
      <span className={`h-3 w-4 bg-sheet ${k.swatch}`} aria-hidden />
      {k.label}
    </span>
  );
}

export function SourceLink({ source, compact = false }: { source: SourceRef; compact?: boolean }) {
  return (
    <a
      href={sourceUrl(source)}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex max-w-full items-baseline gap-1 font-mono text-[13px] text-blue underline decoration-blue/30 hover:decoration-blue"
    >
      <span className={compact ? "truncate" : "break-all"}>{sourceLabel(source)}</span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 translate-y-[2px] opacity-60 group-hover:opacity-100" aria-hidden />
    </a>
  );
}

/** Section opener: a heavy rule, a wide heading, a lede. No eyebrow. */
export function SectionHeading({ id, title, aside, children }: { id: string; title: string; aside?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-10 border-t-[3px] border-ink pt-5 md:mb-14">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h2 id={id} className="wide text-balance text-[2rem] font-[750] leading-[1.02] tracking-[-0.025em] sm:text-[2.75rem] md:text-[3.25rem]">
          {title}
        </h2>
        {aside && <div className="text-[14px] text-ink-3">{aside}</div>}
      </div>
      {children && <div className="mt-5 max-w-[62ch] text-pretty text-[17px] leading-[28px] text-ink-2">{children}</div>}
    </header>
  );
}

export function Button({
  children,
  onClick,
  variant = "secondary",
  disabled,
  className = "",
  ariaLabel,
  ariaPressed,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  title?: string;
}) {
  const base =
    "inline-flex min-h-10 items-center justify-center gap-2 text-[14px] font-semibold transition-[background-color,color,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-35 active:translate-y-px";
  const variants = {
    primary: "bg-ink px-4 text-sheet hover:bg-ink-2",
    secondary: "border border-ink bg-sheet px-3.5 text-ink hover:bg-desk",
    ghost: "px-2 text-ink-2 underline decoration-hair-2 underline-offset-4 hover:text-ink hover:decoration-ink",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      title={title}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
