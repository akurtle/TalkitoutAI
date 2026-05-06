import type { StoredInterviewSessionSummary } from "../../types/session";

const VIEWBOX_W = 700;
const VIEWBOX_H = 150;
const PAD = { top: 16, right: 16, bottom: 30, left: 32 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;

type LineKey = "overall_score" | "speech_score" | "video_score" | "response_score";

const LINES: { key: LineKey; label: string; color: string; width: number; opacity: number }[] = [
  { key: "overall_score", label: "Overall", color: "#a78bfa", width: 2.5, opacity: 0.95 },
  { key: "speech_score", label: "Speech", color: "#34d399", width: 1.5, opacity: 0.55 },
  { key: "response_score", label: "Responses", color: "#fb923c", width: 1.5, opacity: 0.55 },
  { key: "video_score", label: "Video", color: "#60a5fa", width: 1.5, opacity: 0.55 },
];

const xOf = (i: number, total: number) =>
  PAD.left + (total <= 1 ? PLOT_W / 2 : (i / (total - 1)) * PLOT_W);

const yOf = (score: number) => PAD.top + PLOT_H * (1 - score / 100);

const buildPoints = (
  sessions: StoredInterviewSessionSummary[],
  key: LineKey
): string => {
  const pts = sessions
    .map((s, i) => {
      const v = s[key];
      return typeof v === "number" ? `${xOf(i, sessions.length).toFixed(1)},${yOf(v).toFixed(1)}` : null;
    })
    .filter(Boolean);
  return pts.join(" ");
};

const avgOf = (vals: (number | null | undefined)[]): number | null => {
  const nums = vals.filter((v): v is number => typeof v === "number");
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
};

const scoreColor = (score: number) =>
  score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#fb923c";

type Props = { sessions: StoredInterviewSessionSummary[] };

export default function ScoreProgressChart({ sessions }: Props) {
  const chronological = [...sessions]
    .filter((s) => s.overall_score != null || s.speech_score != null || s.video_score != null)
    .reverse()
    .slice(-20);

  const recent5 = sessions.slice(0, 5);
  const avgSpeech = avgOf(recent5.map((s) => s.speech_score));
  const avgVideo = avgOf(recent5.map((s) => s.video_score));
  const avgResponse = avgOf(recent5.map((s) => s.response_score));
  const avgOverall = avgOf(recent5.map((s) => s.overall_score));

  const dimensions = [
    { label: "Speech fluency", score: avgSpeech, tip: "Use fewer filler words and maintain a steady pace." },
    { label: "Response quality", score: avgResponse, tip: "Add specific examples, metrics, and clearer structure." },
    { label: "Video presence", score: avgVideo, tip: "Improve eye contact, posture, and facial engagement." },
  ]
    .filter((d) => d.score !== null)
    .sort((a, b) => (a.score ?? 100) - (b.score ?? 100));

  const weakest = dimensions[0] ?? null;

  const gridY = [0, 25, 50, 75, 100];

  return (
    <div className="theme-panel rounded-2xl p-5 space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="theme-text-primary text-base font-semibold">Score progress</h3>
          <p className="theme-text-muted text-xs mt-0.5">Last {chronological.length} sessions</p>
        </div>
        {avgOverall !== null && (
          <p className="theme-text-muted text-xs">
            Recent average:{" "}
            <span style={{ color: scoreColor(avgOverall) }} className="font-semibold">
              {avgOverall.toFixed(1)}
            </span>
          </p>
        )}
      </div>

      {chronological.length < 2 ? (
        <p className="theme-text-dim text-sm">
          Complete at least 2 sessions to see your progress chart.
        </p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
            className="w-full"
            aria-label="Score progress over sessions"
          >
            {gridY.map((v) => {
              const y = yOf(v);
              return (
                <g key={v}>
                  <line
                    x1={PAD.left}
                    y1={y}
                    x2={VIEWBOX_W - PAD.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.left - 5}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={9}
                    fill="rgba(255,255,255,0.28)"
                  >
                    {v}
                  </text>
                </g>
              );
            })}

            {LINES.map((line) => {
              const pts = buildPoints(chronological, line.key);
              if (!pts) return null;
              return (
                <polyline
                  key={line.key}
                  points={pts}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={line.width}
                  strokeOpacity={line.opacity}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}

            {chronological.map((session, i) => {
              const x = xOf(i, chronological.length);
              return LINES.map((line) => {
                const v = session[line.key];
                if (typeof v !== "number") return null;
                const y = yOf(v);
                const r = line.key === "overall_score" ? 4 : 2.5;
                return (
                  <circle
                    key={`${session.id}-${line.key}`}
                    cx={x}
                    cy={y}
                    r={r}
                    fill={line.color}
                    fillOpacity={line.key === "overall_score" ? 1 : 0.7}
                  >
                    <title>{`${line.label}: ${v.toFixed(1)}`}</title>
                  </circle>
                );
              });
            })}

            {chronological.map((session, i) => {
              const x = xOf(i, chronological.length);
              const label = new Date(session.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              return (
                <text
                  key={`xlabel-${session.id}`}
                  x={x}
                  y={VIEWBOX_H - PAD.bottom + 14}
                  textAnchor="middle"
                  fontSize={8}
                  fill="rgba(255,255,255,0.28)"
                >
                  {label}
                </text>
              );
            })}
          </svg>

          <div className="flex flex-wrap gap-4">
            {LINES.map((line) => (
              <div key={line.key} className="flex items-center gap-1.5">
                <span
                  style={{ backgroundColor: line.color }}
                  className="inline-block h-2 w-5 rounded-full"
                />
                <span className="theme-text-dim text-xs">{line.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {dimensions.length > 0 && (
        <div className="theme-border border-t pt-4 space-y-3">
          <p className="theme-text-primary text-sm font-semibold">Recent averages</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {dimensions.map((d, idx) => (
              <div key={d.label} className="theme-panel-soft rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="theme-text-dim text-[11px] uppercase tracking-wide">{d.label}</p>
                  {idx === 0 && (
                    <span className="text-[10px] rounded-full px-2 py-0.5 bg-orange-500/15 text-orange-300 border border-orange-500/25">
                      focus area
                    </span>
                  )}
                </div>
                <p
                  style={{ color: scoreColor(d.score!) }}
                  className="mt-1 text-xl font-bold"
                >
                  {d.score!.toFixed(1)}
                </p>
                {idx === 0 && (
                  <p className="theme-text-muted text-xs mt-1 leading-4">{d.tip}</p>
                )}
              </div>
            ))}
          </div>
          {weakest && (
            <p className="theme-text-muted text-xs">
              Focus area:{" "}
              <span className="theme-text-secondary font-medium">{weakest.label}</span> is your
              lowest dimension across recent sessions.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
