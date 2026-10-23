import type { ImplStatus, NodeKind } from "./types";

/*
 * Layers are told apart by the shape of their frame, not by colour:
 * browser = plain box, FastAPI = double rule, in-process AI = rounded, external = dashed.
 */
export const kindStyles: Record<NodeKind, { label: string; frame: string; swatch: string }> = {
  frontend: { label: "Browser", frame: "border border-ink", swatch: "border border-ink" },
  backend: { label: "FastAPI", frame: "border-[3px] border-double border-ink", swatch: "border-[3px] border-double border-ink" },
  ai: { label: "AI / parsing", frame: "border border-ink rounded-[14px]", swatch: "border border-ink rounded-full" },
  external: { label: "External service", frame: "border border-dashed border-ink-2", swatch: "border border-dashed border-ink-2" },
};

/** Implementation status is printed, with a matching line style for connections. */
export const statusStyles: Record<ImplStatus, { label: string; line: string }> = {
  implemented: { label: "Implemented", line: "border-solid border-ink" },
  fallback: { label: "Fallback path", line: "border-dashed border-ink" },
  dormant: { label: "In code, not called", line: "border-dotted border-ink-3" },
};
