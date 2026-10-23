import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { FlowId } from "../../lib/types";
import { getQuestions, type LevelId, type ModeId, type RoleId } from "../../data/interview";
import { SetupStage } from "./SetupStage";
import { SessionStage } from "./SessionStage";
import { FeedbackStage } from "./FeedbackStage";

export type Stage = "setup" | "session" | "feedback";

export interface SimConfig {
  role: RoleId;
  mode: ModeId;
  level: LevelId;
}

const STAGES: { id: Stage; part: string; label: string }[] = [
  { id: "setup", part: "Part I", label: "Setup" },
  { id: "session", part: "Part II", label: "Examination" },
  { id: "feedback", part: "Part III", label: "Findings" },
];

export function InterviewSimulation({ onExploreFlow }: { onExploreFlow: (flow: FlowId) => void }) {
  const [stage, setStage] = useState<Stage>("setup");
  const [config, setConfig] = useState<SimConfig>({ role: "backend", mode: "behavioral", level: "mid" });
  const [runId, setRunId] = useState(0);
  const questions = getQuestions(config.mode, config.role);
  const stageIndex = STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="border border-ink bg-sheet">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-ink px-4 py-3 sm:px-6">
        <ol className="flex flex-wrap items-baseline gap-x-6 gap-y-1" aria-label="Simulation progress">
          {STAGES.map((s, i) => {
            const state = i < stageIndex ? "done" : i === stageIndex ? "current" : "todo";
            return (
              <li
                key={s.id}
                aria-current={state === "current" ? "step" : undefined}
                className={`flex items-baseline gap-2 text-[14px] ${state === "todo" ? "text-ink-3" : "text-ink"}`}
              >
                <span className="text-[13px] text-ink-3">{s.part}</span>
                <span className={state === "current" ? "font-semibold underline decoration-ink decoration-2 underline-offset-[7px]" : ""}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="font-mono text-[12.5px] italic text-ink-3">(No microphone or camera access. Local JSON only.)</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${stage}-${runId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {stage === "setup" && (
            <SetupStage config={config} onChange={setConfig} onStart={() => setStage("session")} onExploreFlow={onExploreFlow} />
          )}
          {stage === "session" && (
            <SessionStage
              config={config}
              questions={questions}
              onFinish={() => setStage("feedback")}
              onExit={() => setStage("setup")}
              onExploreFlow={onExploreFlow}
            />
          )}
          {stage === "feedback" && (
            <FeedbackStage
              config={config}
              questions={questions}
              onRestart={() => {
                setRunId((n) => n + 1);
                setStage("setup");
              }}
              onRetry={() => {
                setRunId((n) => n + 1);
                setStage("session");
              }}
              onExploreFlow={onExploreFlow}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
