import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { edgeById, edges, flowMeta, nodeById } from "../../data/architecture";
import { CodeBlock } from "../ui/CodeBlock";
import { KindMark, SourceLink, StatusMark } from "../ui/primitives";

export type Selection = { type: "node"; id: string } | { type: "edge"; id: string } | null;

export function DetailPanel({
  selection,
  onSelect,
  onClose,
}: {
  selection: NonNullable<Selection>;
  onSelect: (s: Selection) => void;
  onClose: () => void;
}) {
  return (
    <motion.aside
      key={`${selection.type}-${selection.id}`}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      aria-label={selection.type === "node" ? "Component entry" : "Connection entry"}
      className="absolute inset-x-2 bottom-2 z-20 max-h-[72%] overflow-y-auto border border-ink bg-sheet shadow-[0_18px_40px_-24px_rgb(23_25_28/0.6)] sm:inset-x-auto sm:bottom-3 sm:right-3 sm:top-3 sm:max-h-none sm:w-[372px]"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink bg-sheet px-4 py-2.5">
        <p className="text-[14px] font-semibold text-ink-2">{selection.type === "node" ? "Component" : "Connection"}</p>
        <button type="button" onClick={onClose} aria-label="Close entry" className="p-1 text-ink-2 hover:bg-desk hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-4 py-4">
        {selection.type === "node" ? <NodeDetail id={selection.id} onSelect={onSelect} /> : <EdgeDetail id={selection.id} onSelect={onSelect} />}
      </div>
    </motion.aside>
  );
}

function Label({ children }: { children: string }) {
  return <p className="mb-1.5 text-[14px] font-semibold text-ink-2">{children}</p>;
}

function NodeDetail({ id, onSelect }: { id: string; onSelect: (s: Selection) => void }) {
  const node = nodeById(id);
  if (!node) return null;
  const connections = edges.filter((e) => e.source === id || e.target === id);

  return (
    <div className="space-y-5">
      <div>
        <h3 className={`text-[1.35rem] font-bold leading-tight tracking-[-0.01em] ${node.kind === "backend" ? "font-mono text-[1.1rem]" : ""}`}>{node.title}</h3>
        <p className="mt-0.5 text-[14px] text-ink-3">{node.subtitle}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          <KindMark kind={node.kind} />
          <StatusMark status={node.status} />
        </div>
      </div>
      <p className="text-[15px] leading-[22px]">{node.responsibility}</p>
      <ol className="space-y-2.5 text-[14px] leading-[21px] text-ink-2">
        {node.details.map((d, i) => (
          <li key={d} className="grid grid-cols-[1.5rem_1fr]">
            <span className="font-mono text-ink-3 tnum">{i + 1}.</span>
            {d}
          </li>
        ))}
      </ol>
      <p className="text-[13px] text-ink-2">
        <span className="font-semibold text-ink">Built with</span> {node.tech.join(", ")}.
      </p>
      {node.flows.length > 0 && (
        <p className="text-[13px] text-ink-2">
          <span className="font-semibold text-ink">Appears in</span> {node.flows.map((f) => flowMeta[f].label.toLowerCase()).join(", ")}.
        </p>
      )}
      {connections.length > 0 && (
        <div>
          <Label>Connections</Label>
          <ul className="border-t border-hair">
            {connections.map((e) => {
              const other = nodeById(e.source === id ? e.target : e.source);
              const outgoing = e.source === id;
              const Icon = outgoing ? ArrowRight : ArrowLeft;
              return (
                <li key={e.id} className="border-b border-hair">
                  <button
                    type="button"
                    onClick={() => onSelect({ type: "edge", id: e.id })}
                    className="flex w-full items-center gap-2 py-2 text-left text-[14px] hover:bg-desk"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-label={outgoing ? "to" : "from"} />
                    <span className="truncate">{other?.title}</span>
                    <span className="ml-auto shrink-0 font-mono text-[11.5px] text-ink-3">{e.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div>
        <Label>Source</Label>
        <div className="space-y-1">
          {node.sources.map((s) => (
            <div key={s.path + (s.line ?? "")}>
              <SourceLink source={s} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EdgeDetail({ id, onSelect }: { id: string; onSelect: (s: Selection) => void }) {
  const edge = edgeById(id);
  if (!edge) return null;
  const from = nodeById(edge.source);
  const to = nodeById(edge.target);

  return (
    <div className="space-y-5">
      <div>
        <p className="flex flex-wrap items-center gap-2 text-[1.1rem] font-bold leading-tight">
          <button type="button" onClick={() => onSelect({ type: "node", id: edge.source })} className="underline decoration-hair-2 underline-offset-4 hover:decoration-ink">
            {from?.title}
          </button>
          <ArrowRight className="h-4 w-4 text-ink-3" aria-label="to" />
          <button type="button" onClick={() => onSelect({ type: "node", id: edge.target })} className="underline decoration-hair-2 underline-offset-4 hover:decoration-ink">
            {to?.title}
          </button>
        </p>
        <div className="mt-3">
          <StatusMark status={edge.status} />
        </div>
      </div>
      <dl className="divide-y divide-hair border-y border-hair text-[14px]">
        <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-2">
          <dt className="text-ink-3">Protocol</dt>
          <dd className="font-mono">{edge.protocol}</dd>
        </div>
        <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-2">
          <dt className="text-ink-3">Data format</dt>
          <dd className="font-mono text-[13px]">{edge.format}</dd>
        </div>
      </dl>
      <p className="text-[15px] leading-[22px] text-ink-2">{edge.description}</p>
      {edge.sample && (
        <div>
          <Label>Representative payload</Label>
          <CodeBlock code={edge.sample} language={edge.sample.trimStart().startsWith("{") ? "json" : "text"} maxHeight="max-h-56" />
        </div>
      )}
    </div>
  );
}
