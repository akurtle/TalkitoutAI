import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type Edge, type EdgeProps } from "@xyflow/react";
import type { ArchEdge } from "../../lib/types";

export type EdgeVisual = "idle" | "focus" | "active" | "visited" | "dim";

export type PacketEdgeData = {
  edge: ArchEdge;
  visual: EdgeVisual;
  reverse: boolean;
  showLabel: boolean;
  selected: boolean;
};

export type PacketFlowEdge = Edge<PacketEdgeData, "packet">;

const INK = "#17191c";
const BLUE = "#2c56a0";

const STROKE: Record<EdgeVisual, string> = {
  idle: "rgb(23 25 28 / 0.45)",
  focus: "rgb(23 25 28 / 0.8)",
  active: BLUE,
  visited: "rgb(44 86 160 / 0.5)",
  dim: "rgb(23 25 28 / 0.1)",
};

function PacketEdgeBase({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<PacketFlowEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 0,
    offset: 22,
  });
  if (!data) return null;
  const { edge, visual, reverse, showLabel, selected } = data;
  // Short vertical hops: set the label beside the line, not above it, so it never lands on a node border.
  const vertical = Math.abs(sourceX - targetX) < 12;
  const labelTransform = vertical
    ? `translate(8px, -50%) translate(${labelX}px, ${labelY}px)`
    : `translate(-50%, calc(-100% - 7px)) translate(${labelX}px, ${labelY}px)`;
  const isFallback = edge.status === "fallback";
  const isDormant = edge.status === "dormant";
  const stroke = selected ? BLUE : STROKE[visual];
  const width = visual === "active" || selected ? 2 : visual === "focus" || visual === "visited" ? 1.4 : 1;
  const dash = isDormant ? "1 4" : isFallback ? "6 4" : visual === "focus" ? "6 4" : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={18}
        className={visual === "focus" && !isFallback && !isDormant ? "edge-flowing" : undefined}
        style={{
          stroke,
          strokeWidth: width,
          strokeDasharray: dash,
          strokeLinecap: isDormant ? "round" : undefined,
          transition: "stroke 300ms",
        }}
        markerEnd={`url(#arrow-${visual === "active" || selected ? "active" : visual === "dim" ? "dim" : "idle"})`}
      />
      {visual === "active" && (
        <g aria-hidden>
          {[0, 0.5].map((delay) => (
            <rect key={delay} x={-6} y={-6} width={12} height={12} fill={reverse ? "#fbfbf9" : BLUE} stroke={BLUE} strokeWidth={2}>
              <animateMotion
                dur="1.6s"
                begin={`${delay}s`}
                repeatCount="indefinite"
                path={path}
                keyPoints={reverse ? "1;0" : "0;1"}
                keyTimes="0;1"
                calcMode="linear"
                rotate="auto"
              />
            </rect>
          ))}
        </g>
      )}
      {showLabel && edge.label && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: labelTransform }}
            className={`nodrag nopan pointer-events-none narrow absolute whitespace-nowrap border bg-sheet px-1 py-px text-[11.5px] font-medium ${
              visual === "active" || selected ? "border-blue text-blue" : "border-hair text-ink-2"
            }`}
          >
            {edge.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const PacketEdge = memo(PacketEdgeBase);

/** Arrow markers referenced by edges. Rendered once beside the canvas. */
export function EdgeMarkers() {
  const markers = [
    { id: "arrow-idle", color: INK },
    { id: "arrow-active", color: BLUE },
    { id: "arrow-dim", color: "rgb(23 25 28 / 0.15)" },
  ];
  return (
    <svg className="absolute h-0 w-0" aria-hidden>
      <defs>
        {markers.map((m) => (
          <marker key={m.id} id={m.id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0.5 L 9 5 L 0 9.5" fill="none" stroke={m.color} strokeWidth="1.6" />
          </marker>
        ))}
      </defs>
    </svg>
  );
}
