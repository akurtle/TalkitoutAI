import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronRight, FastForward, Pause, Play } from "lucide-react";
import type { FlowId } from "../../lib/types";
import { annotate, roleText, type SampleQuestion } from "../../data/interview";
import { useInterval } from "../../hooks/useInterval";
import { Button, Pleading } from "../ui/primitives";
import type { SimConfig } from "./InterviewSimulation";

/** Simulated seconds advanced per tick. Playback runs faster than real time so the demo stays short. */
const TICK_MS = 100;
const SIM_SECONDS_PER_TICK = 0.25;
const TAIL_SECONDS = 6;

const formatClock = (s: number) => {
  const whole = Math.floor(s);
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
};

/** Words of each segment revealed at simulated time `clock`. */
function revealed(question: SampleQuestion, clock: number) {
  const segs = question.segments;
  return segs.map((seg, i) => {
    const start = seg.t;
    const end = segs[i + 1]?.t ?? seg.t + TAIL_SECONDS;
    const words = seg.text.split(" ");
    if (clock < start) return { words: 0, total: words.length };
    const p = Math.min(1, (clock - start) / ((end - start) * 0.85));
    return { words: Math.max(1, Math.ceil(p * words.length)), total: words.length };
  });
}

export function SessionStage({
  config,
  questions,
  onFinish,
  onExit,
  onExploreFlow,
}: {
  config: SimConfig;
  questions: SampleQuestion[];
  onFinish: () => void;
  onExit: () => void;
  onExploreFlow: (flow: FlowId) => void;
}) {
  const [index, setIndex] = useState(0);
  const [clock, setClock] = useState(0);
  const [elapsedBefore, setElapsedBefore] = useState(0);
  const [paused, setPaused] = useState(false);

  const question = questions[index];
  const answerEnd = question.segments[question.segments.length - 1].t + TAIL_SECONDS;
  const answerDone = clock >= answerEnd;
  const isLast = index === questions.length - 1;

  useInterval(() => setClock((c) => Math.min(answerEnd, c + SIM_SECONDS_PER_TICK)), paused || answerDone ? null : TICK_MS);

  const reveal = useMemo(() => revealed(question, clock), [question, clock]);
  const visibleText = question.segments
    .map((s, i) => s.text.split(" ").slice(0, reveal[i].words).join(" "))
    .filter(Boolean)
    .join(" ");

  const live = useMemo(() => {
    const tokens = annotate(visibleText).filter((t) => t.text.trim());
    const fillers = tokens.filter((t) => t.kind === "filler").length;
    const words = visibleText.split(/\s+/).filter(Boolean).length;
    const speakingSeconds = Math.max(0, clock - question.segments[0].t);
    const wpm = speakingSeconds >= 8 && words >= 15 ? Math.round(words / (speakingSeconds / 60)) : null;
    return { fillers, words, wpm };
  }, [visibleText, clock, question]);

  const next = () => {
    if (isLast) {
      onFinish();
      return;
    }
    setElapsedBefore((e) => e + clock);
    setIndex((i) => i + 1);
    setClock(0);
    setPaused(false);
  };

  const listening = !paused && !answerDone;
  const note =
    live.fillers >= 3
      ? "Several filler words so far. A short silent pause usually reads as more confident."
      : live.words < 15
        ? "Pace appears after 15 words, the same threshold the real hook uses."
        : "Delivery is steady. Keep the structure clear while wrapping up.";

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-hair px-4 py-3 sm:px-6">
          <p className="text-[14px] text-ink-2">
            Question <span className="font-semibold text-ink tnum">{index + 1}</span> of {questions.length}
            <span className="text-ink-3"> · {question.category.replace("_", " ")} · {roleText(config.role, config.level)}</span>
          </p>
          <p className="font-mono text-[13px] text-ink-2 tnum" title="Simulated clock">
            {formatClock(elapsedBefore + clock)} elapsed · answer {formatClock(clock)} <span className="italic text-ink-3">(simulated clock)</span>
          </p>
        </div>

        <Pleading className="min-h-[392px]">
          <div data-grid className="px-4 py-[14px] font-mono text-[15px] leading-[28px] sm:px-0 sm:pr-8 sm:text-[16px]" aria-live="polite">
            <p className={`text-[13px] italic ${listening ? "text-ink" : "text-ink-3"}`}>
              {listening
                ? "(Recording. Demo mode: no microphone or camera is accessed.)"
                : paused
                  ? "(Recording paused.)"
                  : "(Answer concluded.)"}
            </p>

            <AnimatePresence mode="wait">
              <motion.p
                key={question.id + index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-[2.25rem_1fr] font-bold"
              >
                <span>Q.</span>
                <span className="text-pretty">{question.question}</span>
              </motion.p>
            </AnimatePresence>

            {question.segments.map((seg, i) => {
              const r = reveal[i];
              if (r.words === 0) return null;
              const text = seg.text.split(" ").slice(0, r.words).join(" ");
              const typing = r.words < r.total && listening;
              return (
                <p key={i} className="group grid grid-cols-[2.25rem_1fr_auto] gap-x-3">
                  <span className="font-bold">{i === 0 ? "A." : ""}</span>
                  <span>
                    {text}
                    {typing && <span className="caret ml-0.5 inline-block h-[18px] w-[2px] translate-y-[3px] bg-ink" aria-hidden />}
                  </span>
                  <span className="hidden text-[12px] text-ink-3 tnum sm:inline">{formatClock(seg.t)}</span>
                </p>
              );
            })}
            {reveal[0].words === 0 && <p className="italic text-ink-3">(Witness is preparing to answer.)</p>}
          </div>
        </Pleading>

        <div className="flex flex-wrap items-center gap-2 border-t border-ink px-4 py-4 sm:px-6">
          <Button onClick={() => setPaused((p) => !p)} disabled={answerDone} ariaPressed={paused}>
            {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button onClick={() => setClock(answerEnd)} disabled={answerDone}>
            <FastForward className="h-4 w-4" aria-hidden /> Finish answer
          </Button>
          <Button variant={answerDone ? "primary" : "secondary"} onClick={next}>
            {isLast ? "End session, read findings" : "Next question"}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button variant="ghost" onClick={onExit} className="ml-auto">
            Exit
          </Button>
        </div>
      </div>

      <aside className="border-t border-ink bg-paper lg:border-l lg:border-t-0">
        <div className="border-b border-hair px-4 py-5 sm:px-6">
          <h3 className="text-[14px] font-semibold text-ink-2">Input level</h3>
          <LevelStrip active={listening} />
        </div>

        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-[14px] font-semibold text-ink-2">Reporter’s notes, live</h3>
          <dl className="mt-3 divide-y divide-hair border-y border-hair">
            <Row label="Words" value={String(live.words)} />
            <Row label="Fillers" value={String(live.fillers)} flag={live.fillers >= 3} />
            <Row label="Pace" value={live.wpm ? `${live.wpm} wpm` : "—"} />
          </dl>
          <p className="mt-3 text-[14px] leading-[21px] text-ink">{note}</p>
          <p className="mt-3 font-mono text-[12.5px] italic leading-5 text-ink-3">
            (Simulated. In the app, useLiveSpeechMetrics derives these from the streamed transcript while the user is speaking.)
          </p>
        </div>

        <button
          type="button"
          onClick={() => onExploreFlow("session")}
          className="group flex w-full items-start justify-between gap-3 border-t border-ink px-4 py-5 text-left hover:bg-desk sm:px-6"
        >
          <span>
            <span className="block text-[15px] font-semibold">How the real audio pipeline works</span>
            <span className="mt-1 block font-mono text-[13px] text-ink-2">Mic → PCM16 → WS /asr → WhisperLiveKit → word deltas</span>
          </span>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
      </aside>
    </div>
  );
}

function Row({ label, value, flag }: { label: string; value: string; flag?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-[7px]">
      <dt className="text-[14px] text-ink-2">{label}</dt>
      <dd className={`text-[18px] font-semibold tnum ${flag ? "text-red" : "text-ink"}`}>{value}</dd>
    </div>
  );
}

/** Decorative, deterministic level strip. No audio is captured. */
function LevelStrip({ active }: { active: boolean }) {
  const bars = 40;
  return (
    <div className="mt-3 flex h-12 items-center gap-[3px] border-y border-hair" aria-hidden>
      {Array.from({ length: bars }, (_, i) => {
        const base = 0.2 + 0.8 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6));
        return (
          <motion.span
            key={i}
            className="w-[2px] bg-ink"
            animate={active ? { height: [`${base * 25}%`, `${base * 90}%`, `${base * 40}%`] } : { height: "4%" }}
            transition={active ? { duration: 0.9 + (i % 5) * 0.12, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } : { duration: 0.3 }}
          />
        );
      })}
    </div>
  );
}
