import { ArrowRight, Play } from "lucide-react";
import type { FlowId } from "../../lib/types";
import { interviewData, roleText } from "../../data/interview";
import { CodeBlock } from "../ui/CodeBlock";
import { Button } from "../ui/primitives";
import type { SimConfig } from "./InterviewSimulation";

/** A form field as it would be printed: a ruled box ticked in ink. */
function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="border-t border-hair pt-[14px]">
      <legend className="float-left mb-2 w-full text-[14px] font-semibold text-ink-2">{label}</legend>
      <div role="radiogroup" aria-label={label} className="clear-left grid sm:grid-cols-3 sm:gap-x-6">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.id)}
              className="group flex items-start gap-3 py-[7px] text-left"
            >
              <span
                aria-hidden
                className={`mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center border transition-colors ${
                  active ? "border-ink bg-ink" : "border-ink-2 bg-sheet group-hover:border-ink"
                }`}
              >
                {active && <span className="h-[6px] w-[6px] bg-sheet" />}
              </span>
              <span>
                <span className={`block text-[15px] leading-6 ${active ? "font-semibold text-ink" : "text-ink-2 group-hover:text-ink"}`}>{o.label}</span>
                {o.hint && <span className="block text-[13px] leading-5 text-ink-3">{o.hint}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SetupStage({
  config,
  onChange,
  onStart,
  onExploreFlow,
}: {
  config: SimConfig;
  onChange: (c: SimConfig) => void;
  onStart: () => void;
  onExploreFlow: (flow: FlowId) => void;
}) {
  const mode = interviewData.modes.find((m) => m.id === config.mode)!;
  const request = {
    role: roleText(config.role, config.level),
    company: null,
    call_type: mode.callType,
    num_questions: 1,
    asked_questions: [],
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="space-y-5 px-4 py-6 sm:px-6">
        <Choice label="Interview role" value={config.role} options={interviewData.roles} onChange={(role) => onChange({ ...config, role })} />
        <Choice label="Practice type" value={config.mode} options={interviewData.modes} onChange={(m) => onChange({ ...config, mode: m })} />
        <Choice
          label="Sample experience level"
          value={config.level}
          options={interviewData.levels.map((l) => ({ id: l.id, label: l.label }))}
          onChange={(level) => onChange({ ...config, level })}
        />

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-ink pt-5">
          <Button variant="primary" onClick={onStart} className="px-5">
            <Play className="h-4 w-4" aria-hidden /> Start the examination
          </Button>
          <p className="text-[14px] text-ink-3">Three questions. Sample answers play back on their own.</p>
        </div>
      </div>

      <aside className="border-t border-ink bg-paper px-4 py-6 sm:px-6 lg:border-l lg:border-t-0">
        <h3 className="text-[15px] font-semibold">What the real app would send</h3>
        <p className="mt-2 max-w-[52ch] text-[14px] leading-[21px] text-ink-2">
          This setup becomes a <code className="font-mono text-ink">QuestionRequest</code> to{" "}
          <code className="font-mono text-ink">POST /questions/generate</code>, one question at a time. The backend has no
          experience field, so the level is folded into the free-text role.
        </p>
        <CodeBlock code={JSON.stringify(request, null, 2)} language="json" maxHeight="max-h-64" className="mt-4" />
        <p className="mt-3 text-[13px] leading-5 text-ink-3">
          Questions here come from the backend’s own template bank, stored as JSON. Nothing is sent.
        </p>
        <button
          type="button"
          onClick={() => onExploreFlow("questions")}
          className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-blue underline decoration-blue/30 underline-offset-4 hover:decoration-blue"
        >
          Trace this request in Exhibit A <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </aside>
    </div>
  );
}
