/** Layer a component belongs to. Drives node colour and shape. */
export type NodeKind = "frontend" | "backend" | "ai" | "external";

/**
 * How the component exists in the real repository.
 * - implemented: in the code and on the active request path
 * - fallback: implemented, used only when the primary path is unavailable
 * - dormant: implemented in the code but not called by the current frontend
 */
export type ImplStatus = "implemented" | "fallback" | "dormant";

export type FlowId = "questions" | "resume" | "session" | "feedback" | "history";

export interface SourceRef {
  /** Repository-relative path. */
  path: string;
  /** Optional 1-indexed line anchor. */
  line?: number;
  label?: string;
}

export interface ArchNode {
  id: string;
  kind: NodeKind;
  group: GroupId;
  title: string;
  subtitle: string;
  /** One-line responsibility shown on hover. */
  responsibility: string;
  /** Longer bullets shown in the detail panel. */
  details: string[];
  tech: string[];
  status: ImplStatus;
  flows: FlowId[];
  sources: SourceRef[];
  position: { x: number; y: number };
}

export type GroupId = "browser" | "fastapi" | "processing" | "external";

export interface ArchGroup {
  id: GroupId;
  title: string;
  caption: string;
  kind: NodeKind;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface ArchEdge {
  id: string;
  source: string;
  target: string;
  /** Short label drawn on the canvas. */
  label?: string;
  protocol: string;
  format: string;
  description: string;
  sample?: string;
  status: ImplStatus;
  flows: FlowId[];
  sourceHandle?: "r" | "b" | "l" | "t";
  targetHandle?: "r" | "b" | "l" | "t";
}

export interface PayloadSample {
  label: string;
  direction: "request" | "response" | "internal" | "event";
  body: string;
}

export interface PlaybackStep {
  id: string;
  title: string;
  description: string;
  nodes: string[];
  edges?: { id: string; reverse?: boolean }[];
  payload?: PayloadSample;
  source?: SourceRef;
}

export interface Scenario {
  id: FlowId;
  title: string;
  summary: string;
  steps: PlaybackStep[];
  /** Optional alternate branch, e.g. Gemini configured vs local templates. */
  variants?: { id: string; label: string; steps: PlaybackStep[] }[];
}
