import type { AudienceStyleId, AudienceStylePreset } from "../../types/interview";

export const AUDIENCE_STYLE_PRESETS: Record<AudienceStyleId, AudienceStylePreset> = {
  theater: {
    id: "theater",
    label: "Theater crowd",
    shortLabel: "Theater",
    description: "Rows of attendees in a dim auditorium.",
    helperText: "Best for keynote pressure and larger pitch rehearsals.",
    accentClassName: "bg-amber-400/20 text-amber-100 border-amber-300/35",
  },
  boardroom: {
    id: "boardroom",
    label: "Executive panel",
    shortLabel: "Panel",
    description: "A close group of decision-makers around a conference table.",
    helperText: "Useful for stakeholder updates, interviews, and investor conversations.",
    accentClassName: "bg-cyan-400/20 text-cyan-100 border-cyan-300/35",
  },
  classroom: {
    id: "classroom",
    label: "Learning room",
    shortLabel: "Class",
    description: "A training-room audience with desks and attentive listeners.",
    helperText: "Good for demos, walkthroughs, and teaching-style explanations.",
    accentClassName: "bg-emerald-400/20 text-emerald-100 border-emerald-300/35",
  },
  "webinar-grid": {
    id: "webinar-grid",
    label: "Webinar attendees",
    shortLabel: "Webinar",
    description: "A remote attendee grid with cameras, initials, and reactions.",
    helperText: "Matches a hosted webinar where you present to a virtual audience.",
    accentClassName: "bg-fuchsia-400/20 text-fuchsia-100 border-fuchsia-300/35",
  },
};

export const AUDIENCE_STYLE_OPTIONS = Object.values(AUDIENCE_STYLE_PRESETS);

export const isAudienceStyleId = (
  value: string | null | undefined
): value is AudienceStyleId =>
  Boolean(value && value in AUDIENCE_STYLE_PRESETS);
