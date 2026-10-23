import { useState } from "react";
import { ArrowRight, Repeat, RotateCcw } from "lucide-react";
import type { FlowId } from "../../lib/types";
import { annotate, countKinds, interviewData, type SampleQuestion, type TokenKind } from "../../data/interview";
import { Button, Pleading } from "../ui/primitives";
import type { SimConfig } from "./InterviewSimulation";

/* Editor's marks on the record: fillers struck in red, structure underlined in blue, specifics set bold. */
const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: "",
  filler: "text-red line-through decoration-red decoration-[1.5px]",
  detail: "font-bold",
  structure: "underline decoration-blue decoration-[1.5px] underline-offset-[5px]",
};

const LEGEND: { kind: Exclude<TokenKind, "plain">; sample: string; label: string; hint: string }[] = [
  { kind: "filler", sample: "um", label: "Filler, struck", hint: "FILLER_WORDS and FILLER_PHRASES" },
  { kind: "structure", sample: "first", label: "Structure or topic marker", hint: "TRANSITION, BEHAVIORAL and similar marker sets" },
  { kind: "detail", sample: "shipped", label: "Specific detail", hint: "DETAIL_MARKERS and numbers" },
];

export function FeedbackStage({
  config,
  questions,
  onRestart,
  onRetry,
  onExploreFlow,
}: {
  config: SimConfig;
  questions: SampleQuestion[];
  onRestart: () => void;
  onRetry: () => void;
  onExploreFlow: (flow: FlowId) => void;
}) {
  const fb = interviewData.feedback[config.mode];
  const stats = countKinds(questions);
  const per100 = stats.words ? (stats.counts.filler / stats.words) * 100 : 0;
  const [openQ, setOpenQ] = useState(0);
  const dims = [
    { label: "Communication clarity", value: fb.dimensions.clarity },
    { label: "Answer structure", value: fb.dimensions.structure },
    { label: "Relevance", value: fb.dimensions.relevance },
  ];

  return (
    <div>
      <p className="border-b border-hair px-4 py-3 font-mono text-[13px] italic leading-5 text-ink-2 sm:px-6">
        (Illustrative results. These scores are pre-written examples, not output from a real-time model. Filler counts and marks are
        computed on this page from the sample transcript, using the real scorer’s word lists.)
      </p>

      <div className="grid border-b border-ink lg:grid-cols-[300px_minmax(0,1fr)]">
        <section aria-labelledby="overall-h" className="border-b border-hair px-4 py-6 sm:px-6 lg:border-b-0 lg:border-r lg:border-hair">
          <h3 id="overall-h" className="text-[14px] font-semibold text-ink-2">
            Findings
          </h3>
          <ol className="mt-3 space-y-3 text-[15px] leading-[22px]">
            <li className="grid grid-cols-[1.5rem_1fr]">
              <span className="text-ink-3 tnum">1.</span>
              <span>
                The overall score is <strong className="font-bold tnum">{fb.overall}</strong> of 100.{" "}
                <span className="font-mono text-[13px] italic text-ink-3">(Illustrative.)</span>
              </span>
            </li>
            <li className="grid grid-cols-[1.5rem_1fr]">
              <span className="text-ink-3 tnum">2.</span>
              <span>Scored by dimension:</span>
            </li>
          </ol>
          <table className="ml-6 mt-2 w-[calc(100%-1.5rem)] text-[14px]">
            <tbody>
              {dims.map((d) => (
                <tr key={d.label} className="border-t border-hair last:border-b">
                  <th scope="row" className="py-[7px] pr-3 text-left font-normal text-ink-2">
                    {d.label}
                  </th>
                  <td className="py-[7px] text-right font-semibold tnum">{d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="grid sm:grid-cols-2">
          <section aria-labelledby="filler-h" className="border-b border-hair px-4 py-6 sm:border-b-0 sm:border-r sm:px-6">
            <h3 id="filler-h" className="text-[14px] font-semibold text-ink-2">
              Index of fillers
            </h3>
            <p className="mt-2 text-[15px]">
              <span className="text-[28px] font-semibold text-red tnum">{stats.counts.filler}</span>{" "}
              <span className="text-ink-2">
                in {stats.words} words, {per100.toFixed(1)} per hundred
              </span>
            </p>
            <table className="mt-3 w-full font-mono text-[14px]">
              <tbody>
                {stats.fillers.map(([word, n]) => (
                  <tr key={word} className="border-t border-hair">
                    <td className="py-[5px]">“{word}”</td>
                    <td className="py-[5px] text-right font-sans tnum">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[13px] leading-5 text-ink-3">
              The real scorer flags filler rates above 5% of words. Its word list ignores context, so “like email” counts too, both
              here and in the app.
            </p>
          </section>

          <section aria-labelledby="sugg-h" className="px-4 py-6 sm:px-6">
            <h3 id="sugg-h" className="text-[14px] font-semibold text-ink-2">
              Recommendations
            </h3>
            <ol className="mt-3 space-y-3">
              {fb.suggestions.map((s, i) => (
                <li key={s} className="grid grid-cols-[1.5rem_1fr] text-[15px] leading-[22px]">
                  <span className="font-mono text-ink-3 tnum">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <section aria-labelledby="ann-h">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-hair px-4 pt-5 sm:px-6">
          <h3 id="ann-h" className="pb-3 text-[15px] font-semibold">
            The marked record
          </h3>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 pb-3 text-[13px] text-ink-2">
            {LEGEND.map((l) => (
              <li key={l.kind} title={l.hint} className="flex items-baseline gap-1.5">
                <span className={`font-mono ${TOKEN_CLASS[l.kind]}`}>{l.sample}</span>
                {l.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-6 overflow-x-auto border-b border-hair px-4 sm:px-6" role="tablist" aria-label="Answers">
          {questions.map((q, i) => (
            <button
              key={q.id + i}
              type="button"
              role="tab"
              aria-selected={openQ === i}
              onClick={() => setOpenQ(i)}
              className={`-mb-px shrink-0 border-b-2 py-3 text-[14px] ${
                openQ === i ? "border-ink font-semibold text-ink" : "border-transparent text-ink-3 hover:text-ink"
              }`}
            >
              Answer {i + 1}
            </button>
          ))}
        </div>
        {questions[openQ] && (
          <div role="tabpanel" className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <Pleading>
              <div data-grid className="px-4 py-[14px] font-mono text-[15px] leading-[28px] sm:px-0 sm:pr-8 sm:text-[16px]">
                <p className="grid grid-cols-[2.25rem_1fr] font-bold">
                  <span>Q.</span>
                  <span>{questions[openQ].question}</span>
                </p>
                <p className="grid grid-cols-[2.25rem_1fr]">
                  <span className="font-bold">A.</span>
                  <span>
                    {questions[openQ].segments.map((seg, si) => (
                      <span key={si}>
                        {annotate(seg.text).map((tok, ti) =>
                          tok.kind === "plain" ? (
                            <span key={ti}>{tok.text}</span>
                          ) : (
                            <mark key={ti} className={`bg-transparent text-inherit ${TOKEN_CLASS[tok.kind]}`}>
                              {tok.text}
                            </mark>
                          )
                        )}{" "}
                      </span>
                    ))}
                  </span>
                </p>
              </div>
            </Pleading>
            <div className="divide-y divide-hair border-t border-ink bg-paper lg:border-l lg:border-t-0">
              <div className="px-4 py-5 sm:px-6">
                <p className="text-[14px] font-semibold text-ink-2">Strength</p>
                <p className="mt-1.5 text-[15px] leading-[22px]">{questions[openQ].annotation.strength}</p>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <p className="text-[14px] font-semibold text-ink-2">Try next time</p>
                <p className="mt-1.5 text-[15px] leading-[22px]">{questions[openQ].annotation.improvement}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2 border-t border-ink px-4 py-4 sm:px-6">
        <Button variant="primary" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Restart with a new setup
        </Button>
        <Button onClick={onRetry}>
          <Repeat className="h-4 w-4" aria-hidden /> Replay this session
        </Button>
        <button
          type="button"
          onClick={() => onExploreFlow("feedback")}
          className="ml-auto inline-flex items-center gap-1.5 text-[14px] font-semibold text-blue underline decoration-blue/30 underline-offset-4 hover:decoration-blue"
        >
          How real feedback is computed <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
