import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { groups, nodes } from "../../data/architecture";
import {
  apiRows,
  decisions,
  deployment,
  implementationStatus,
  realtimeChallenges,
  security,
  snippets,
  type StatusTag,
} from "../../data/deepDive";
import { kindStyles } from "../../lib/styles";
import { CodeBlock } from "../ui/CodeBlock";
import { SourceLink } from "../ui/primitives";

const TABS = [
  { id: "status", label: "What’s real" },
  { id: "components", label: "Components" },
  { id: "api", label: "API & sockets" },
  { id: "code", label: "Code" },
  { id: "decisions", label: "Trade-offs" },
  { id: "realtime", label: "Real-time" },
  { id: "deploy", label: "Deployment" },
  { id: "security", label: "Security" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* Status is typed in the record's inks: plain, struck in red when removed, blue when it diverges from the docs. */
const TAG: Record<StatusTag, { label: string; cls: string }> = {
  implemented: { label: "Implemented", cls: "text-ink" },
  fallback: { label: "Fallback", cls: "text-ink-2 italic" },
  dormant: { label: "In code, unused", cls: "text-ink-3" },
  removed: { label: "Removed", cls: "text-red" },
  gap: { label: "Gap vs. docs", cls: "text-blue" },
};

function Tag({ tag }: { tag: StatusTag }) {
  return <span className={`shrink-0 text-[14px] font-semibold ${TAG[tag].cls}`}>{TAG[tag].label}</span>;
}

export function DeepDive({ onOpenArchitecture }: { onOpenArchitecture: () => void }) {
  const [tab, setTab] = useState<TabId>("status");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="border border-ink bg-sheet">
      <div role="tablist" aria-label="Findings topics" className="flex gap-6 overflow-x-auto border-b border-ink px-4 sm:px-6">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`relative -mb-px shrink-0 border-b-2 py-3 text-[14px] transition-colors ${
              tab === t.id ? "border-ink font-semibold text-ink" : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="px-4 py-6 sm:px-6 sm:py-8"
        >
          {tab === "status" && <StatusTab />}
          {tab === "components" && <ComponentsTab onOpenArchitecture={onOpenArchitecture} />}
          {tab === "api" && <ApiTab />}
          {tab === "code" && <CodeTab />}
          {tab === "decisions" && <DecisionsTab />}
          {tab === "realtime" && <NumberedFindings items={realtimeChallenges} />}
          {tab === "deploy" && <NumberedFindings items={deployment} />}
          {tab === "security" && <SecurityTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Intro({ children }: { children: ReactNode }) {
  return <p className="mb-6 max-w-[62ch] text-[16px] leading-[26px] text-ink-2">{children}</p>;
}

function StatusTab() {
  return (
    <>
      <Intro>Reading the code directly turns up a few differences from the README and product docs. This record follows the code.</Intro>

      <div className="mb-8 grid gap-6 border-y border-ink py-5 md:grid-cols-2 md:gap-10">
        <Redline commit="ae39624" title="Changed backend to use websockets" struck="Browser → WebRTC (aiortc) → server media pipeline" inserted="Browser → Int16 PCM over WS /asr → WhisperLiveKit" />
        <Redline commit="a53c79e" title="Optimizing Processing" struck="Transcript → POST /speech/feedback → Python scorer" inserted="Transcript → clientFeedback.ts in the browser" />
      </div>

      <table className="block w-full text-left md:table">
        <thead className="sr-only">
          <tr>
            <th>Item</th>
            <th>Status</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody className="block align-top md:table-row-group">
          {implementationStatus.map((row) => (
            <tr key={row.item} className="block border-b border-hair py-3.5 md:table-row md:py-0">
              <th scope="row" className={`block text-[15px] font-semibold md:table-cell md:w-[32%] md:py-3.5 md:pr-6 ${row.tag === "removed" ? "text-red line-through decoration-red" : ""}`}>
                {row.item}
              </th>
              <td className="block pt-1 md:table-cell md:w-[13%] md:py-3.5 md:pr-6">
                <Tag tag={row.tag} />
              </td>
              <td className="block min-w-0 pt-1 md:table-cell md:py-3.5">
                <p className="text-[14px] leading-[21px] text-ink-2">{row.note}</p>
                {row.source && (
                  <div className="mt-1">
                    <SourceLink source={row.source} compact />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Redline({ commit, title, struck, inserted }: { commit: string; title: string; struck: string; inserted: string }) {
  return (
    <div>
      <p className="font-mono text-[13px] text-ink-3">
        commit {commit} · <span className="text-ink-2">“{title}”</span>
      </p>
      <p className="mt-2 font-mono text-[15px] leading-[24px] text-red line-through decoration-red">{struck}</p>
      <p className="mt-1 font-mono text-[15px] leading-[24px] underline decoration-ink decoration-[1.5px] underline-offset-[5px]">{inserted}</p>
    </div>
  );
}

function ComponentsTab({ onOpenArchitecture }: { onOpenArchitecture: () => void }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <p className="max-w-[62ch] text-[16px] leading-[26px] text-ink-2">
          The real architecture, layer by layer. Entries with a dotted frame exist in the code but are not on the current request path.
        </p>
        <button
          type="button"
          onClick={onOpenArchitecture}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-blue underline decoration-blue/30 underline-offset-4 hover:decoration-blue"
        >
          Open Exhibit A <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div className="grid border-t border-ink md:grid-cols-2 xl:grid-cols-4">
        {groups.map((g, gi) => (
          <section key={g.id} className={`border-b border-hair py-4 md:px-4 ${gi % 2 === 1 ? "md:border-l" : ""} xl:border-b-0 ${gi > 0 ? "xl:border-l" : ""} ${gi === 0 ? "md:pl-0" : ""}`}>
            <h3 className="flex items-center gap-2 text-[15px] font-bold">
              <span className={`h-3 w-4 bg-sheet ${kindStyles[g.kind].swatch}`} aria-hidden />
              {g.title}
            </h3>
            <p className="mt-0.5 text-[13px] text-ink-3">{g.caption}</p>
            <ul className="mt-3 space-y-3">
              {nodes
                .filter((n) => n.group === g.id)
                .map((n) => (
                  <li key={n.id} className={n.status === "dormant" ? "border-l border-dotted border-ink-3 pl-2.5" : ""}>
                    <p className={`text-[14px] font-semibold ${n.kind === "backend" ? "font-mono text-[13px]" : ""}`}>{n.title}</p>
                    <p className="mt-0.5 text-[13px] leading-[19px] text-ink-2">{n.responsibility}</p>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function ApiTab() {
  return (
    <>
      <Intro>
        Contracts are Pydantic models on the server and TypeScript types on the client. The project rules require changing both sides in
        the same pass.
      </Intro>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-[14px]">
          <thead className="border-y border-ink text-[14px] font-semibold text-ink-2">
            <tr>
              <th className="py-2.5 pr-6 font-semibold">Endpoint</th>
              <th className="py-2.5 pr-6 font-semibold">Request</th>
              <th className="py-2.5 pr-6 font-semibold">Response</th>
              <th className="py-2.5 font-semibold">Called by</th>
            </tr>
          </thead>
          <tbody className="align-top">
            {apiRows.map((r) => (
              <tr key={r.method + r.path} className="border-b border-hair">
                <td className="py-3 pr-6">
                  <p className="font-mono text-[14px]">
                    <span className="font-bold">{r.method}</span> {r.path}
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                    <Tag tag={r.status} />
                    <SourceLink source={{ ...r.source, label: "source" }} compact />
                  </div>
                </td>
                <td className="py-3 pr-6 font-mono text-[13px] leading-[20px] text-ink-2">{r.request}</td>
                <td className="py-3 pr-6 font-mono text-[13px] leading-[20px] text-ink-2">{r.response}</td>
                <td className="py-3 text-[14px] text-ink-2">{r.caller}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CodeTab() {
  const [active, setActive] = useState(snippets[0].id);
  const snip = snippets.find((s) => s.id === active)!;
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <ol className="flex gap-4 overflow-x-auto border-b border-hair lg:block lg:border-b-0 lg:border-t lg:border-ink" aria-label="Code excerpts">
        {snippets.map((s, i) => (
          <li key={s.id} className="shrink-0 lg:border-b lg:border-hair">
            <button
              type="button"
              onClick={() => setActive(s.id)}
              aria-pressed={active === s.id}
              className={`grid w-full grid-cols-[1.5rem_1fr] py-2.5 text-left text-[14px] ${active === s.id ? "font-semibold text-ink" : "text-ink-3 hover:text-ink"}`}
            >
              <span className="font-mono tnum">{i + 1}.</span>
              <span>
                {s.title}
                <span className="mt-0.5 hidden font-mono text-[12px] font-normal text-ink-3 lg:block">{s.source.path.split("/").pop()}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="min-w-0">
        <p className="mb-3 max-w-[62ch] text-[15px] leading-[23px] text-ink-2">{snip.caption}</p>
        <CodeBlock code={snip.code} language={snip.language} maxHeight="max-h-[26rem]" />
        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <SourceLink source={snip.source} />
          <span className="shrink-0 font-mono text-[12px] italic text-ink-3">(Excerpt, unmodified.)</span>
        </div>
      </div>
    </div>
  );
}

function DecisionsTab() {
  return (
    <div className="border-t border-ink">
      {decisions.map((d, i) => (
        <article key={d.title} className="grid gap-4 border-b border-hair py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
          <div>
            <h3 className="grid grid-cols-[1.75rem_1fr] text-[17px] font-bold leading-snug">
              <span className="font-mono text-ink-3 tnum">{i + 1}.</span>
              {d.title}
            </h3>
            <p className="mt-1.5 pl-7 text-[14px] leading-[21px] text-ink-2">{d.choice}</p>
          </div>
          <div className="pl-7 lg:pl-0">
            <p className="text-[14px] font-semibold text-ink-2">Gains</p>
            <ul className="mt-1.5 space-y-1.5 text-[14px] leading-[21px]">
              {d.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
          <div className="pl-7 lg:pl-0">
            <p className="text-[14px] font-semibold text-ink-2">Costs</p>
            <ul className="mt-1.5 space-y-1.5 text-[14px] leading-[21px]">
              {d.cost.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </article>
      ))}
    </div>
  );
}

function NumberedFindings({ items }: { items: { title: string; body: string; source?: { path: string; line?: number } }[] }) {
  return (
    <ol className="grid gap-x-10 border-t border-ink md:grid-cols-2">
      {items.map((c, i) => (
        <li key={c.title} className="grid grid-cols-[1.75rem_1fr] border-b border-hair py-4">
          <span className="font-mono text-[15px] text-ink-3 tnum">{i + 1}.</span>
          <div>
            <h3 className="text-[16px] font-bold leading-snug">{c.title}</h3>
            <p className="mt-1 max-w-[60ch] text-[14px] leading-[21px] text-ink-2">{c.body}</p>
            {c.source && (
              <div className="mt-1.5">
                <SourceLink source={c.source} compact />
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function SecurityColumn({ title, items }: { title: string; items: typeof security }) {
  return (
    <section>
      <h3 className={`border-b border-ink pb-2 text-[14px] font-semibold text-ink-2`}>{title}</h3>
      <ul>
        {items.map((s) => (
          <li key={s.title} className="border-b border-hair py-3.5">
            <p className="text-[15px] font-bold">{s.title}</p>
            <p className="mt-1 text-[14px] leading-[21px] text-ink-2">{s.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SecurityTab() {
  const strengths = security.filter((s) => s.kind === "strength");
  const risks = security.filter((s) => s.kind === "risk");
  return (
    <>
      <Intro>What the current design protects well, and the hardening a production deployment would add.</Intro>
      <div className="grid gap-8 md:grid-cols-2 md:gap-10">
        <SecurityColumn title="What holds" items={strengths} />
        <SecurityColumn title="What production would add" items={risks} />
      </div>
    </>
  );
}
