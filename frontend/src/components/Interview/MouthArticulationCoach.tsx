import type { FeedbackStatus, RecordMode, VisionFrame } from "../../types/interview";

type MouthArticulationCoachProps = {
  isLive: boolean;
  recordMode: RecordMode;
  videoFeedback: unknown;
  videoStatus: FeedbackStatus;
  visionFrames: VisionFrame[];
};

type MouthMetrics = {
  articulationRate: number | null;
  movementDelta: number | null;
  openness: number | null;
  sampleCount: number;
  source: "live" | "session" | "empty";
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

const asFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const clampPercent = (value: number | null) => {
  if (value === null) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value * 100)));
};

const mean = (values: number[]) =>
  values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : null;

const buildLiveMetrics = (frames: VisionFrame[]): MouthMetrics => {
  const mouthFrames = frames
    .filter((frame) => frame.face_present && typeof frame.mouth_open_ratio === "number")
    .slice(-45);
  const opennessValues = mouthFrames
    .map((frame) => frame.mouth_open_ratio)
    .filter((value): value is number => typeof value === "number");
  const movementValues = mouthFrames
    .map((frame) => frame.mouth_movement_delta)
    .filter((value): value is number => typeof value === "number");
  const articulationValues = mouthFrames
    .map((frame) => frame.articulation_active)
    .filter((value): value is boolean => typeof value === "boolean")
    .map((value) => (value ? 1 : 0));

  return {
    articulationRate: mean(articulationValues),
    movementDelta: mean(movementValues),
    openness: mean(opennessValues),
    sampleCount: opennessValues.length,
    source: opennessValues.length > 0 ? "live" : "empty",
  };
};

const buildSessionMetrics = (videoFeedback: unknown): MouthMetrics => {
  const videoData = asRecord(videoFeedback);
  const metrics = asRecord(videoData?.metrics);

  if (!metrics) {
    return {
      articulationRate: null,
      movementDelta: null,
      openness: null,
      sampleCount: 0,
      source: "empty",
    };
  }

  const sampleCount = asFiniteNumber(metrics.mouth_frame_count) ?? 0;

  return {
    articulationRate: asFiniteNumber(metrics.articulation_active_rate),
    movementDelta: asFiniteNumber(metrics.avg_mouth_movement_delta),
    openness: asFiniteNumber(metrics.avg_mouth_open_ratio),
    sampleCount,
    source: sampleCount > 0 ? "session" : "empty",
  };
};

const formatPercent = (value: number | null) => {
  const percent = clampPercent(value);
  return percent === null ? "--" : `${percent}%`;
};

const getTone = (metrics: MouthMetrics) => {
  if (metrics.sampleCount === 0) {
    return "muted";
  }

  if (
    (metrics.openness !== null && metrics.openness < 0.12) ||
    (metrics.movementDelta !== null && metrics.movementDelta < 0.018) ||
    (metrics.articulationRate !== null && metrics.articulationRate < 0.35)
  ) {
    return "warn";
  }

  return "good";
};

const getMessage = (metrics: MouthMetrics) => {
  if (metrics.sampleCount === 0) {
    return "Mouth tracking is waiting for enough camera face samples.";
  }

  if (metrics.openness !== null && metrics.openness < 0.12) {
    return "Mouth openness is low. Open a bit wider on vowels.";
  }

  if (
    (metrics.movementDelta !== null && metrics.movementDelta < 0.018) ||
    (metrics.articulationRate !== null && metrics.articulationRate < 0.35)
  ) {
    return "Mouth articulation looks subtle. Engage your jaw and lips more while speaking.";
  }

  return "Mouth movement looks clear and active.";
};

const toneClasses = {
  good: {
    bar: "bg-emerald-400",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
  },
  muted: {
    bar: "bg-[var(--accent)]",
    dot: "bg-[var(--accent)]",
    text: "theme-text-muted",
  },
  warn: {
    bar: "bg-yellow-400",
    dot: "bg-yellow-400",
    text: "text-yellow-200",
  },
};

function MouthMetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">
      <p className="theme-text-dim text-[11px] uppercase tracking-wide">{label}</p>
      <p className="theme-text-primary mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

export default function MouthArticulationCoach({
  isLive,
  recordMode,
  videoFeedback,
  videoStatus,
  visionFrames,
}: MouthArticulationCoachProps) {
  if (recordMode === "audio") {
    return null;
  }

  const liveMetrics = buildLiveMetrics(visionFrames);
  const sessionMetrics = videoStatus === "ready" ? buildSessionMetrics(videoFeedback) : null;
  const metrics =
    isLive || !sessionMetrics || sessionMetrics.sampleCount === 0 ? liveMetrics : sessionMetrics;
  const tone = getTone(metrics);
  const classes = toneClasses[tone];
  const opennessPercent = clampPercent(metrics.openness) ?? 0;
  const articulationPercent = clampPercent(metrics.articulationRate);
  const sourceLabel =
    metrics.source === "session"
      ? "Session mouth metrics"
      : metrics.source === "live"
        ? "Live mouth metrics"
        : "Mouth metrics";

  return (
    <div className="theme-panel-soft rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="theme-text-dim text-xs uppercase tracking-wide">Mouth articulation</p>
          <p className="theme-text-primary mt-1 text-sm font-semibold">{sourceLabel}</p>
        </div>
        <span className="theme-chip shrink-0 rounded-full px-2 py-1 text-[10px] uppercase tracking-wide">
          {metrics.sampleCount > 0 ? `${metrics.sampleCount} samples` : "Waiting"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MouthMetricTile label="Openness" value={formatPercent(metrics.openness)} />
        <MouthMetricTile
          label="Articulation"
          value={articulationPercent === null ? "--" : `${articulationPercent}%`}
        />
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${classes.bar}`}
          style={{ width: `${opennessPercent}%` }}
        />
      </div>

      <div className="mt-3 flex items-start gap-2">
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${classes.dot}`} />
        <p className={`text-sm leading-snug ${classes.text}`}>{getMessage(metrics)}</p>
      </div>
    </div>
  );
}
