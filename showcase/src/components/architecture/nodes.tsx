import { memo, useState } from "react";
import { Handle, NodeToolbar, Position, type Node, type NodeProps } from "@xyflow/react";
import type { ArchGroup, ArchNode } from "../../lib/types";
import { kindStyles } from "../../lib/styles";
import { NODE_WIDTH } from "../../data/architecture";

export type NodeVisual = "idle" | "focus" | "active" | "visited" | "dim";

export type ArchNodeData = { node: ArchNode; visual: NodeVisual; selected: boolean };
export type GroupNodeData = { group: ArchGroup; dim: boolean };

export type ArchFlowNode = Node<ArchNodeData, "arch">;
export type GroupFlowNode = Node<GroupNodeData, "layer">;

const SIDES = [
  { id: "t", pos: Position.Top },
  { id: "r", pos: Position.Right },
  { id: "b", pos: Position.Bottom },
  { id: "l", pos: Position.Left },
] as const;

function ArchNodeViewBase({ data }: NodeProps<ArchFlowNode>) {
  const { node, visual, selected } = data;
  const [hover, setHover] = useState(false);
  const k = kindStyles[node.kind];
  const dormant = node.status === "dormant";

  const state =
    visual === "active"
      ? "bg-bluewash"
      : visual === "visited"
        ? "bg-sheet"
        : visual === "dim"
          ? "bg-sheet opacity-30"
          : "bg-sheet";

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ width: NODE_WIDTH }}
      className={`relative cursor-pointer px-3 py-2.5 transition-[background-color,opacity] duration-300 ${k.frame} ${state} ${
        dormant ? "!border-dotted" : ""
      } ${visual === "active" ? "!border-blue" : ""} ${selected ? "outline-2 outline-offset-4 outline-blue" : ""}`}
    >
      <NodeToolbar isVisible={hover && visual !== "dim"} position={Position.Top} offset={8}>
        <div className="max-w-[260px] border border-ink bg-sheet px-3 py-2 text-[12.5px] leading-[18px] text-ink shadow-[0_8px_20px_-12px_rgb(23_25_28/0.5)]">
          {node.responsibility}
          <span className="mt-1 block font-mono text-[11px] italic text-ink-3">(Click for the full entry.)</span>
        </div>
      </NodeToolbar>

      {SIDES.map((s) => (
        <Handle key={`s-${s.id}`} id={`s-${s.id}`} type="source" position={s.pos} isConnectable={false} />
      ))}
      {SIDES.map((s) => (
        <Handle key={`t-${s.id}`} id={`t-${s.id}`} type="target" position={s.pos} isConnectable={false} />
      ))}

      <p className={`truncate leading-tight ${node.kind === "backend" ? "font-mono text-[13px] font-bold" : "text-[14px] font-semibold"} ${visual === "active" ? "text-blue" : "text-ink"}`}>
        {node.title}
      </p>
      <p className="mt-0.5 truncate text-[12px] text-ink-3">{node.subtitle}</p>
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-ink-3">{k.label}</span>
        {node.status !== "implemented" && (
          <span className="font-mono text-[11px] italic text-ink-2">({node.status === "fallback" ? "fallback" : "not called"})</span>
        )}
      </div>
    </div>
  );
}

export const ArchNodeView = memo(ArchNodeViewBase);

function GroupNodeViewBase({ data }: NodeProps<GroupFlowNode>) {
  const { group, dim } = data;
  return (
    <div
      style={{ width: group.size.width, height: group.size.height }}
      className={`pointer-events-none border ${group.kind === "external" ? "border-dashed border-hair-2" : "border-hair-2"} transition-opacity duration-300 ${
        dim ? "opacity-45" : ""
      }`}
    >
      <div className="border-b border-hair px-5 pb-3 pt-4">
        <p className="text-[15px] font-semibold text-ink">{group.title}</p>
        <p className="mt-0.5 text-[12px] text-ink-3">{group.caption}</p>
      </div>
    </div>
  );
}

export const GroupNodeView = memo(GroupNodeViewBase);
