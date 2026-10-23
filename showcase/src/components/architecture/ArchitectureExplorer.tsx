import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import {
  Background,
  BackgroundVariant,
  ControlButton,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  type EdgeChange,
  type EdgeTypes,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react";
import { AnimatePresence } from "motion/react";
import { Crosshair, RotateCcw } from "lucide-react";
import type { FlowId, PlaybackStep } from "../../lib/types";
import { NODE_WIDTH, edges as archEdges, flowMeta, groups, nodeById, nodes as archNodes } from "../../data/architecture";
import { scenarioById } from "../../data/scenarios";
import { usePlayback } from "../../hooks/usePlayback";
import { kindStyles, statusStyles } from "../../lib/styles";
import { ArchNodeView, GroupNodeView, type ArchFlowNode, type GroupFlowNode, type NodeVisual } from "./nodes";
import { EdgeMarkers, PacketEdge, type EdgeVisual, type PacketFlowEdge } from "./PacketEdge";
import { DetailPanel, type Selection } from "./DetailPanel";
import { PlaybackIntro, PlaybackPanel } from "./PlaybackPanel";

export interface ExplorerHandle {
  focusFlow: (flow: FlowId, autoplay?: boolean) => void;
}

const nodeTypes: NodeTypes = { arch: ArchNodeView, layer: GroupNodeView };
const edgeTypes: EdgeTypes = { packet: PacketEdge };

const FLOW_CHIPS: (FlowId | "all")[] = ["all", "questions", "session", "resume", "feedback", "history"];

export function ArchitectureExplorer({ ref }: { ref?: Ref<ExplorerHandle> }) {
  return (
    <ReactFlowProvider>
      <ExplorerInner handleRef={ref} />
    </ReactFlowProvider>
  );
}

function ExplorerInner({ handleRef }: { handleRef?: Ref<ExplorerHandle> }) {
  const [flow, setFlow] = useState<FlowId | "all">("all");
  const [variant, setVariant] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  // Following the active step is on by default: at fitted zoom the labels are too small to read.
  const [follow, setFollow] = useState(true);
  const { fitView, setCenter } = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);

  const scenario = flow === "all" ? null : scenarioById(flow) ?? null;
  const steps: PlaybackStep[] = useMemo(() => {
    if (!scenario) return [];
    const v = scenario.variants?.find((x) => x.id === variant) ?? scenario.variants?.[0];
    return v ? v.steps : scenario.steps;
  }, [scenario, variant]);

  const playback = usePlayback(steps.length);
  const step = playback.started ? steps[playback.index] : null;

  const flowNodeIds = useMemo(() => new Set(steps.flatMap((s) => s.nodes)), [steps]);
  const flowEdgeIds = useMemo(() => new Set(steps.flatMap((s) => (s.edges ?? []).map((e) => e.id))), [steps]);

  const fitTo = useCallback(
    (ids: string[] | null, opts?: { padding?: number; maxZoom?: number }) => {
      window.requestAnimationFrame(() =>
        fitView({
          nodes: ids && ids.length ? ids.map((id) => ({ id })) : undefined,
          padding: opts?.padding ?? 0.12,
          maxZoom: opts?.maxZoom ?? 1.1,
          duration: 550,
        })
      );
    },
    [fitView]
  );

  const chooseFlow = useCallback(
    (next: FlowId | "all", autoplay = false) => {
      setFlow(next);
      setVariant(null);
      setSelection(null);
      playback.stop();
      const sc = next === "all" ? null : scenarioById(next);
      const ids = sc ? [...new Set((sc.variants?.[0]?.steps ?? sc.steps).flatMap((s) => s.nodes))] : null;
      fitTo(ids, { padding: 0.18 });
      if (autoplay && sc) window.setTimeout(() => playback.restart(), 650);
    },
    [fitTo, playback]
  );

  useImperativeHandle(handleRef, () => ({ focusFlow: (f, autoplay = true) => chooseFlow(f, autoplay) }), [chooseFlow]);

  // Follow mode: keep the active step's components in view. This only drives the viewport, not React state.
  // Camera: fly to a set of components and hold them at reading size.
  // Close-up for single parts; wider hops fit both ends without dropping below reading size.
  const flyTo = useCallback(
    (ids: string[], closeUp = 1.45) => {
      const pts = ids.map(nodeById).filter((n) => n !== undefined);
      if (!pts.length) return;
      const xs = pts.map((n) => n.position.x);
      const ys = pts.map((n) => n.position.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs) + NODE_WIDTH;
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys) + 90;
      const box = canvasRef.current?.getBoundingClientRect();
      const width = box?.width ?? 800;
      const height = box?.height ?? 600;
      const fit = Math.min(width / (maxX - minX + 140), height / (maxY - minY + 200));
      // Hops across lanes ease out just enough to keep both ends whole; 0.8 still renders labels at ~11px.
      const zoom = Math.max(0.8, Math.min(closeUp, fit));
      window.requestAnimationFrame(() => setCenter((minX + maxX) / 2, (minY + maxY) / 2 + 14, { zoom, duration: 900 }));
    },
    [setCenter]
  );

  // Follow mode: the camera tracks each playback step.
  useEffect(() => {
    if (!follow || !step) return;
    flyTo(step.nodes);
  }, [follow, step, flyTo]);

  const reset = () => {
    chooseFlow("all");
  };

  // ── Derive React Flow nodes/edges from playback + filter state ────────────
  const visitedNodes = useMemo(() => {
    const set = new Set<string>();
    if (playback.started) steps.slice(0, playback.index).forEach((s) => s.nodes.forEach((n) => set.add(n)));
    return set;
  }, [steps, playback.started, playback.index]);

  const visitedEdges = useMemo(() => {
    const set = new Set<string>();
    if (playback.started) steps.slice(0, playback.index).forEach((s) => s.edges?.forEach((e) => set.add(e.id)));
    return set;
  }, [steps, playback.started, playback.index]);

  const rfNodes = useMemo(() => {
    const nodeVisual = (id: string): NodeVisual => {
      if (flow === "all") return "idle";
      if (step?.nodes.includes(id)) return "active";
      if (visitedNodes.has(id)) return "visited";
      return flowNodeIds.has(id) ? "focus" : "dim";
    };
    const layer: GroupFlowNode[] = groups.map((g) => ({
      id: `group-${g.id}`,
      type: "layer",
      position: g.position,
      data: { group: g, dim: flow !== "all" && !archNodes.some((n) => n.group === g.id && flowNodeIds.has(n.id)) },
      selectable: false,
      draggable: false,
      focusable: false,
      zIndex: -1,
    }));
    const arch: ArchFlowNode[] = archNodes.map((n) => ({
      id: n.id,
      type: "arch",
      position: n.position,
      data: { node: n, visual: nodeVisual(n.id), selected: selection?.type === "node" && selection.id === n.id },
      selected: selection?.type === "node" && selection.id === n.id,
      draggable: false,
      ariaLabel: `${n.title}: ${n.responsibility}`,
    }));
    return [...layer, ...arch];
  }, [flow, step, visitedNodes, flowNodeIds, selection]);

  const rfEdges = useMemo<PacketFlowEdge[]>(() => {
    return archEdges.map((e) => {
      const activeRef = step?.edges?.find((x) => x.id === e.id);
      let visual: EdgeVisual = "idle";
      if (flow !== "all") {
        visual = activeRef ? "active" : visitedEdges.has(e.id) ? "visited" : flowEdgeIds.has(e.id) ? "focus" : "dim";
      }
      const selected = selection?.type === "edge" && selection.id === e.id;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: `s-${e.sourceHandle ?? "r"}`,
        targetHandle: `t-${e.targetHandle ?? "l"}`,
        type: "packet",
        selected,
        zIndex: visual === "active" || selected ? 2 : 0,
        ariaLabel: `${e.protocol} from ${e.source} to ${e.target}`,
        data: {
          edge: e,
          visual,
          reverse: Boolean(activeRef?.reverse),
          showLabel: selected || visual === "active" || (flow !== "all" && visual !== "dim"),
          selected,
        },
      };
    });
  }, [flow, step, visitedEdges, flowEdgeIds, selection]);

  const onNodesChange = useCallback((changes: NodeChange<ArchFlowNode | GroupFlowNode>[]) => {
    const sel = changes.find((c) => c.type === "select" && c.selected);
    if (sel && "id" in sel && !sel.id.startsWith("group-")) setSelection({ type: "node", id: sel.id });
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange<PacketFlowEdge>[]) => {
    const sel = changes.find((c) => c.type === "select" && c.selected);
    if (sel && "id" in sel) setSelection({ type: "edge", id: sel.id });
  }, []);

  return (
    <div className="border border-ink bg-sheet">
      {/* Toolbar: flow filter as an index of proceedings, plus the legend */}
      <div className="flex flex-col gap-3 border-b border-ink px-4 pt-3 lg:flex-row lg:items-end lg:justify-between">
        <div role="tablist" aria-label="Filter by flow" className="-mb-px flex gap-5 overflow-x-auto">
          {FLOW_CHIPS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={flow === f}
              onClick={() => chooseFlow(f)}
              className={`shrink-0 border-b-2 pb-2.5 text-[14px] transition-colors ${
                flow === f ? "border-ink font-semibold text-ink" : "border-transparent text-ink-3 hover:text-ink"
              }`}
            >
              {flowMeta[f].short}
            </button>
          ))}
        </div>
        <Legend />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Canvas */}
        <div className="relative flex h-[600px] flex-col border-b border-ink bg-paper sm:h-[680px] lg:h-[780px] lg:border-b-0 lg:border-r">
          <div className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 border-b border-hair px-4 py-2" aria-live="polite">
            {step ? (
              <span className="min-w-0 truncate text-[13px] font-semibold text-blue">
                <span className="font-mono tnum">
                  {playback.index + 1}/{steps.length}
                </span>{" "}
                {step.title}
              </span>
            ) : (
              <span className="text-[13px] text-ink-3">Drag to pan. Pinch or use the controls to zoom. Click any component or connection.</span>
            )}
            {flow !== "all" && <span className="ml-auto font-mono text-[12.5px] italic text-ink-3">(Simulated execution.)</span>}
          </div>
          <div ref={canvasRef} className="relative min-h-0 flex-1">
            <EdgeMarkers />
            <ReactFlow<ArchFlowNode | GroupFlowNode, PacketFlowEdge>
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, n) => {
                if (n.id.startsWith("group-")) return;
                setSelection({ type: "node", id: n.id });
                flyTo([n.id], 1.3);
              }}
              onEdgeClick={(_, e) => setSelection({ type: "edge", id: e.id })}
              onPaneClick={() => setSelection(null)}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              zoomOnScroll={false}
              panOnScroll={false}
              preventScrolling={false}
              zoomOnDoubleClick={false}
              minZoom={0.15}
              maxZoom={1.75}
              fitView
              fitViewOptions={{ padding: 0.06 }}
              colorMode="light"
              proOptions={{ hideAttribution: false }}
            >
              <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="rgb(23 25 28 / 0.14)" />
              <Controls showInteractive={false} position="bottom-left" aria-label="Canvas controls">
                <ControlButton onClick={reset} title="Reset view and filters" aria-label="Reset view and filters">
                  <RotateCcw />
                </ControlButton>
                <ControlButton
                  onClick={() => setFollow((f) => !f)}
                  title={follow ? "Stop following active step" : "Follow active step"}
                  aria-label={follow ? "Stop following active step" : "Follow active step"}
                  aria-pressed={follow}
                  className={follow ? "!bg-bluewash !text-blue" : ""}
                >
                  <Crosshair />
                </ControlButton>
              </Controls>
            </ReactFlow>

            <LaneRuler />

            {/* The exhibit sticker: hidden while the camera is following a step, so it never covers a component */}
            <div
              aria-hidden
              className={`pointer-events-none absolute bottom-3 right-3 border-2 border-blue bg-sheet px-3 py-2 text-center text-blue ${
                step && follow ? "hidden" : "hidden sm:block"
              }`}
            >
              <p className="wide text-[16px] font-[850] leading-none tracking-[0.02em]">EXHIBIT A</p>
              <p className="mt-1.5 font-mono text-[12px] leading-none">TalkitoutAI · system</p>
            </div>

            <AnimatePresence>
              {selection && <DetailPanel selection={selection} onSelect={setSelection} onClose={() => setSelection(null)} />}
            </AnimatePresence>
          </div>
        </div>

        {/* Side panel */}
        <div className="flex min-h-0 flex-col lg:h-[780px]">
          {scenario ? (
            <PlaybackPanel
              scenario={scenario}
              steps={steps}
              variant={variant ?? scenario.variants?.[0]?.id ?? null}
              onVariant={(v) => {
                setVariant(v);
                playback.stop();
              }}
              playback={playback}
              onClose={() => chooseFlow("all")}
            />
          ) : (
            <PlaybackIntro onPlay={() => chooseFlow("questions", true)} onPick={(id) => chooseFlow(id, true)} />
          )}
        </div>
      </div>
    </div>
  );
}

/** Pinned lane names that track the viewport, so a zoomed-in canvas never loses which lane is which. */
function LaneRuler() {
  const { x, y, zoom } = useViewport();
  // Group headers sit at the top of each lane; repeat the name only once that header has left the canvas.
  const labels = groups.flatMap((g) => {
    const left = g.position.x * zoom + x;
    const right = left + g.size.width * zoom;
    const headerVisible = g.position.y * zoom + y + 56 * zoom > 28;
    if (right <= 0 || headerVisible) return [];
    return [{ g, left: Math.max(0, left), width: right - Math.max(0, left) }];
  });
  if (!labels.length) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-7 overflow-hidden border-b border-hair bg-paper/90">
      {labels.map(({ g, left, width }) => (
        <span
          key={g.id}
          style={{ left, width }}
          className="absolute top-0 truncate border-l border-hair-2 px-2 text-[12px] font-semibold leading-7 text-ink-2"
        >
          {g.title}
        </span>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pb-3">
      {(["frontend", "backend", "ai", "external"] as const).map((k) => (
        <span key={k} className="inline-flex items-center gap-2 text-[13px] text-ink-2">
          <span className={`h-3 w-4 bg-sheet ${kindStyles[k].swatch}`} aria-hidden />
          {kindStyles[k].label}
        </span>
      ))}
      {(["fallback", "dormant"] as const).map((st) => (
        <span key={st} className="inline-flex items-center gap-2 text-[13px] text-ink-2">
          <span className={`w-5 border-t-2 ${statusStyles[st].line}`} aria-hidden />
          {statusStyles[st].label}
        </span>
      ))}
    </div>
  );
}
