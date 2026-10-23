import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Square } from "lucide-react";
import type { FlowId, PayloadSample, PlaybackStep, Scenario } from "../../lib/types";
import type { Playback } from "../../hooks/usePlayback";
import { guessLanguage } from "../../lib/code";
import { scenarios } from "../../data/scenarios";
import { CodeBlock } from "../ui/CodeBlock";
import { Button, SourceLink } from "../ui/primitives";

const DIRECTION: Record<PayloadSample["direction"], string> = {
  request: "Request →",
  response: "← Response",
  internal: "Internal",
  event: "Event",
};

export function ScenarioPicker({ onPick }: { onPick: (id: FlowId) => void }) {
  return (
    <ol className="border-t border-ink">
      {scenarios.map((s, i) => (
        <li key={s.id} className="border-b border-hair">
          <button type="button" onClick={() => onPick(s.id)} className="group grid w-full grid-cols-[1.75rem_1fr_auto] gap-x-2 py-3 text-left hover:bg-desk">
            <span className="pl-1 font-mono text-[14px] text-ink-3 tnum">{i + 1}.</span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold group-hover:underline group-hover:underline-offset-4">{s.title}</span>
              <span className="mt-0.5 block font-mono text-[12.5px] leading-[18px] text-ink-2">{s.summary}</span>
            </span>
            <Play className="mr-1 mt-1 h-4 w-4 text-ink-3 group-hover:text-ink" aria-hidden />
          </button>
        </li>
      ))}
    </ol>
  );
}

export function PlaybackPanel({
  scenario,
  steps,
  variant,
  onVariant,
  playback,
  onClose,
}: {
  scenario: Scenario;
  steps: PlaybackStep[];
  variant: string | null;
  onVariant: (id: string) => void;
  playback: Playback;
  onClose: () => void;
}) {
  const { index, playing, started, atEnd } = playback;
  const step = started ? steps[index] : null;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the active step visible by scrolling only this panel, never the page.
  useEffect(() => {
    const box = scrollRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-step="${index}"]`);
    if (!box || !el) return;
    const top = el.offsetTop; // box is position:relative, so this is relative to the box
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
    }
  }, [index]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-ink px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[17px] font-bold leading-snug">{scenario.title}</h3>
          <button type="button" onClick={onClose} className="shrink-0 text-[13px] text-ink-2 underline decoration-hair-2 underline-offset-4 hover:text-ink">
            All flows
          </button>
        </div>

        {scenario.variants && (
          <div role="radiogroup" aria-label="Branch" className="mt-3 grid grid-cols-2 border border-ink">
            {scenario.variants.map((v, i) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={variant === v.id}
                onClick={() => onVariant(v.id)}
                className={`px-2 py-2 text-[13px] ${i > 0 ? "border-l border-ink" : ""} ${variant === v.id ? "bg-ink font-semibold text-sheet" : "text-ink-2 hover:bg-desk"}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5">
          <Button
            variant="primary"
            onClick={playback.toggle}
            className="flex-1"
            ariaLabel={playing ? "Pause playback" : started && !atEnd ? "Resume playback" : "Play architecture flow"}
          >
            {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {playing ? "Pause" : started && !atEnd ? "Resume" : atEnd ? "Replay flow" : "Play architecture flow"}
          </Button>
          <Button onClick={playback.prev} disabled={!started || index === 0} ariaLabel="Previous step" title="Previous step" className="w-10 px-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={playback.next} disabled={atEnd} ariaLabel="Next step" title="Next step" className="w-10 px-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={playback.restart} ariaLabel="Restart" title="Restart" className="w-10 px-0">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button onClick={playback.stop} disabled={!started} ariaLabel="Stop and clear" title="Stop" className="w-10 px-0">
            <Square className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="mt-3 flex h-[5px] border border-ink" aria-hidden>
          {steps.map((s, i) => (
            <span key={s.id} className={`flex-1 transition-colors duration-300 ${i > 0 ? "border-l border-ink/30" : ""} ${i <= index ? "bg-ink" : ""}`} />
          ))}
        </div>
        <p className="mt-2 font-mono text-[12.5px] italic text-ink-3" aria-live="polite">
          {started ? `(Step ${index + 1} of ${steps.length}.)` : `(${steps.length} steps. Scripted and deterministic; no network requests.)`}
        </p>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step ? (
            <motion.div
              key={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-3 border-b border-ink px-4 py-4"
            >
              <h4 className="text-[16px] font-bold leading-snug">{step.title}</h4>
              <p className="text-[14px] leading-[21px] text-ink-2">{step.description}</p>
              {step.payload && <PayloadView payload={step.payload} />}
              {step.source && <SourceLink source={step.source} />}
            </motion.div>
          ) : (
            <motion.p key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-ink px-4 py-4 text-[14px] leading-[21px] text-ink-2">
              {scenario.summary}. Press play to step through each stage. The marked components and moving packets follow the real code
              path.
            </motion.p>
          )}
        </AnimatePresence>

        <ol className="py-1" aria-label="Steps">
          {steps.map((s, i) => (
            <li key={s.id} data-step={i}>
              <button
                type="button"
                onClick={() => playback.goTo(i)}
                aria-current={i === index ? "step" : undefined}
                className={`grid w-full grid-cols-[1.75rem_1fr] px-4 py-[7px] text-left text-[14px] leading-[20px] ${
                  i === index ? "bg-bluewash font-semibold text-blue" : i < index ? "text-ink hover:bg-desk" : "text-ink-3 hover:bg-desk hover:text-ink"
                }`}
              >
                <span className="font-mono tnum">{i + 1}.</span>
                <span>{s.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function PayloadView({ payload }: { payload: PayloadSample }) {
  return (
    <div>
      <p className="mb-1.5 flex flex-wrap items-baseline gap-x-3 text-[13px]">
        <span className="font-semibold">{DIRECTION[payload.direction]}</span>
        <span className="text-ink-2">{payload.label}</span>
        <span className="ml-auto font-mono text-[12px] italic text-ink-3">(example)</span>
      </p>
      <CodeBlock code={payload.body} language={guessLanguage(payload.body)} maxHeight="max-h-72" />
    </div>
  );
}

export function PlaybackIntro({ onPlay, onPick }: { onPlay: () => void; onPick: (id: FlowId) => void }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <h3 className="text-[17px] font-bold">Watch a request move through the system</h3>
      <p className="mt-2 text-[14px] leading-[21px] text-ink-2">
        Each scenario replays a real code path: the components involved, the protocol on each hop, and a representative payload. The
        events are scripted. Nothing is sent over the network.
      </p>
      <Button variant="primary" className="mt-4 w-full" onClick={onPlay}>
        <Play className="h-4 w-4" aria-hidden /> Play architecture flow
      </Button>
      <p className="mb-2 mt-6 flex items-center gap-1.5 text-[14px] font-semibold text-ink-2">
        Or choose a scenario <ArrowRight className="h-3 w-3" aria-hidden />
      </p>
      <ScenarioPicker onPick={onPick} />
    </div>
  );
}
