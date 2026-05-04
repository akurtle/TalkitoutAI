import type { ReactElement, RefObject } from "react";
import { AUDIENCE_STYLE_PRESETS } from "./audienceStyles";
import type { AudienceStyleId, ConnectionStatus, SessionType } from "../../types/interview";

export const formatCallClock = (elapsedMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (value: number) => value.toString().padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
};

type RenderSceneProps = {
  status: ConnectionStatus;
  videoRef: RefObject<HTMLVideoElement | null> | RefObject<HTMLVideoElement>;
  onLeave: () => void;
};

export const renderTeamsScene = ({
  status,
  elapsedLabel,
  videoRef,
  onLeave,
}: RenderSceneProps & { elapsedLabel: string }): ReactElement => (
  <div className="absolute inset-0 flex flex-col">
    <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Microsoft Teams</p>
        <p className="text-sm text-white/90">
          {status === "connected"
            ? "Live meeting"
            : status === "paused"
              ? "Meeting paused"
              : "Preparing your room..."}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-300">
        <span>{elapsedLabel}</span>
        <button
          type="button"
          onClick={onLeave}
          className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white transition hover:bg-white/15"
        >
          Leave
        </button>
      </div>
    </div>

    <div className="relative flex-1 overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
      />
      <div className="pointer-events-none absolute right-4 top-4 grid gap-3">
        <div className="theme-panel-soft rounded-3xl border border-white/10 bg-black/50 px-4 py-3 text-xs text-white/90 backdrop-blur">
          <p className="font-semibold">You</p>
          <p className="mt-1 text-slate-300 text-[11px]">Live camera preview</p>
        </div>
        <div className="theme-panel-soft rounded-3xl border border-white/10 bg-black/50 px-4 py-3 text-xs text-white/90 backdrop-blur">
          <p className="font-semibold">Meeting controls</p>
          <p className="mt-1 text-slate-300 text-[11px]">Microphone, camera, raise hand</p>
        </div>
      </div>
    </div>
  </div>
);

type RenderMeetSceneProps = RenderSceneProps;

export const renderMeetScene = ({
  status,
  videoRef,
  onLeave,
}: RenderMeetSceneProps): ReactElement => (
  <div className="absolute inset-0 flex flex-col">
    <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Google Meet</p>
        <p className="text-sm text-white/90">
          {status === "connected"
            ? "Meeting in progress"
            : status === "paused"
              ? "Meeting paused"
              : "Starting the room..."}
        </p>
      </div>
      <button
        type="button"
        onClick={onLeave}
        className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white transition hover:bg-white/15"
      >
        Leave
      </button>
    </div>

    <div className="relative flex-1 overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
      />
      <div className="absolute bottom-6 left-6 rounded-3xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white/90 backdrop-blur">
        <p className="font-semibold">Call in progress</p>
        <p className="mt-1 text-slate-300 text-xs">Your voice is being captured for transcription and feedback.</p>
      </div>
    </div>
  </div>
);

const attendeeInitials = ["AM", "RK", "SJ", "TP", "NL", "DV", "KC", "HR", "IB", "ZW", "MO", "LS"];
const attendeeColors = [
  "from-emerald-300 to-teal-500",
  "from-sky-300 to-blue-500",
  "from-amber-300 to-orange-500",
  "from-rose-300 to-pink-500",
  "from-violet-300 to-purple-500",
  "from-cyan-300 to-indigo-500",
];

function renderAudiencePerson(index: number, compact = false): ReactElement {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`rounded-full bg-gradient-to-br ${attendeeColors[index % attendeeColors.length]} ${
          compact ? "h-5 w-5" : "h-7 w-7"
        }`}
      />
      <div
        className={`mt-1 rounded-t-full bg-white/12 ${compact ? "h-4 w-8" : "h-6 w-12"}`}
      />
    </div>
  );
}

function renderTheaterAudience(): ReactElement {
  return (
    <div className="absolute inset-x-0 bottom-0 px-4 pb-6 sm:px-8">
      <div className="mx-auto mb-5 h-1.5 w-32 rounded-full bg-amber-200/60 shadow-[0_0_28px_rgba(251,191,36,0.45)]" />
      <div className="space-y-3">
        {[8, 10, 12].map((count, row) => (
          <div
            key={`theater-row-${row}`}
            className="mx-auto flex max-w-[760px] justify-center gap-2 rounded-[28px] border border-white/8 bg-black/20 px-4 py-2 backdrop-blur-sm"
            style={{ width: `${72 + row * 10}%` }}
          >
            {Array.from({ length: count }).map((_, index) => (
              <div key={`${row}-${index}`}>{renderAudiencePerson(index + row * 4, row < 2)}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderBoardroomAudience(): ReactElement {
  return (
    <div className="absolute inset-0 flex items-end justify-center px-8 pb-8">
      <div className="relative h-[58%] w-full max-w-4xl rounded-[42px] border border-cyan-200/15 bg-gradient-to-b from-slate-900/55 to-slate-950/80 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-x-[18%] bottom-[10%] h-[42%] rounded-[50%] border border-cyan-200/20 bg-cyan-950/55 shadow-[inset_0_0_45px_rgba(34,211,238,0.08)]" />
        {[
          "left-[13%] top-[22%]",
          "left-[30%] top-[11%]",
          "left-[48%] top-[9%]",
          "right-[28%] top-[13%]",
          "right-[12%] top-[25%]",
          "left-[23%] bottom-[17%]",
          "right-[23%] bottom-[17%]",
        ].map((position, index) => (
          <div key={position} className={`absolute ${position}`}>
            {renderAudiencePerson(index)}
          </div>
        ))}
        <div className="absolute left-1/2 top-[28%] -translate-x-1/2 rounded-full border border-cyan-200/20 bg-black/35 px-4 py-2 text-xs text-cyan-100">
          Stakeholder panel
        </div>
      </div>
    </div>
  );
}

function renderClassroomAudience(): ReactElement {
  return (
    <div className="absolute inset-x-0 bottom-0 px-5 pb-7 sm:px-10">
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={`classroom-${index}`}
            className="rounded-2xl border border-emerald-200/12 bg-slate-950/35 px-3 py-3 backdrop-blur-sm"
          >
            <div className="mx-auto mb-2 h-3 w-16 rounded-full bg-emerald-100/12" />
            {renderAudiencePerson(index, true)}
            <div className="mt-2 h-2 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function renderWebinarAudience(): ReactElement {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-5 py-7">
      <div className="grid w-full max-w-5xl grid-cols-3 gap-3 sm:grid-cols-4">
        {attendeeInitials.map((initials, index) => (
          <div
            key={initials}
            className="min-h-20 rounded-2xl border border-white/10 bg-black/35 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${attendeeColors[index % attendeeColors.length]} text-xs font-bold text-slate-950`}
              >
                {initials}
              </div>
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                Live
              </span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/12" />
            <div className="mt-2 h-2 w-2/3 rounded-full bg-white/8" />
          </div>
        ))}
      </div>
    </div>
  );
}

function renderAudienceByStyle(style: AudienceStyleId): ReactElement {
  if (style === "boardroom") {
    return renderBoardroomAudience();
  }

  if (style === "classroom") {
    return renderClassroomAudience();
  }

  if (style === "webinar-grid") {
    return renderWebinarAudience();
  }

  return renderTheaterAudience();
}

export const renderAudienceScene = (
  status: ConnectionStatus,
  label: string,
  sessionType: SessionType,
  audienceStyle: AudienceStyleId
): ReactElement => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.15),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.55))]" />
    <div className="absolute left-5 top-5 z-10 rounded-3xl border border-white/10 bg-black/50 px-5 py-4 text-white/90 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-300">{label}</p>
      <p className="mt-2 text-sm font-semibold">
        {sessionType === "interview" ? "Interview practice" : "Pitch rehearsal"}
      </p>
      <p className="mt-1 text-xs text-slate-300">
        {status === "connected"
          ? `${AUDIENCE_STYLE_PRESETS[audienceStyle].label} active`
          : status === "paused"
            ? "Audience paused"
            : "Preparing the audience..."}
      </p>
    </div>
    <div className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
      No self-view
    </div>
    {renderAudienceByStyle(audienceStyle)}
  </div>
);

export const renderPlatformScene = (
  status: ConnectionStatus,
  label: string,
  sessionType: SessionType,
  controlClassName: string
): ReactElement => (
  <div className="absolute inset-0 flex flex-col">
    <div className="absolute right-6 top-6 rounded-3xl border border-white/10 bg-black/50 p-4 text-sm text-white/90 backdrop-blur">
      <p className="font-semibold">{label}</p>
      <p className="mt-1 text-slate-300 text-xs">{sessionType === "interview" ? "Interview session" : "Pitch session"}</p>
    </div>
    <div className="absolute bottom-6 left-6 rounded-3xl border border-white/10 bg-black/50 p-4 text-xs text-white/90 backdrop-blur">
      <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${controlClassName}`}>
        {status === "connected" ? "Live" : status === "paused" ? "Paused" : "Ready"}
      </div>
    </div>
  </div>
);
