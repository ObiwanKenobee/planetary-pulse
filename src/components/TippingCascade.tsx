import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, X, Zap, ChevronRight, RotateCcw, AlertTriangle } from "lucide-react";

/* ─── Types ─── */
interface CascadeNode {
  id: string;
  label: string;
  region: string;
  icon: string;
  probability: number;
  delay: string;
  mechanic: string;
  color: string;         // text-* class
  accent: string;        // hsl value for SVG
  border: string;        // border-* class
  bg: string;            // bg-*/fill class
}

interface CascadeEdge {
  from: string;
  to: string;
  label: string;
}

interface CascadeChain {
  title: string;
  description: string;
  impact: { label: string; val: string }[];
  nodes: CascadeNode[];
  edges: CascadeEdge[];
}

/* ─── Chain data ─── */
const CASCADE_CHAINS: Record<string, CascadeChain> = {
  amazon: {
    title: "Amazon Savannification Cascade",
    description:
      "The Amazon produces ~20% of its own rainfall via transpiration. Deforestation beyond ~20–25% could trigger self-reinforcing dieback, drying the continent, disrupting monsoons, and releasing ~90 Gt CO₂ — igniting a global cascade.",
    impact: [
      { label: "CO₂ Released",   val: "+90 Gt"   },
      { label: "Temp Increase",  val: "+1.5°C"   },
      { label: "Systems Tipped", val: "6"         },
      { label: "Recovery ETA",   val: ">500 yr"  },
    ],
    nodes: [
      {
        id: "amz",       label: "Amazon Tipping",    region: "South America",  icon: "🌿",
        probability: 100, delay: "TRIGGER",
        mechanic: "Deforestation + drought cuts moisture recycling below the critical threshold. The forest cannot recover — it becomes a savanna.",
        color: "text-critical", accent: "hsl(0 85% 60%)", border: "border-critical/40", bg: "bg-critical/10",
      },
      {
        id: "sahel",     label: "Sahel Drying",       region: "West Africa",    icon: "🌵",
        probability: 74,  delay: "~5–15 yr",
        mechanic: "Amazon collapse shifts the ITCZ southward, reducing West African monsoon rainfall by 20–30%, accelerating Sahel desertification.",
        color: "text-warning", accent: "hsl(38 95% 55%)", border: "border-warning/40", bg: "bg-warning/10",
      },
      {
        id: "amoc",      label: "AMOC Slowdown",      region: "North Atlantic", icon: "🌊",
        probability: 68,  delay: "~10–30 yr",
        mechanic: "+90 Gt CO₂ raises global temperature, accelerating Greenland melt and freshening the North Atlantic — weakening thermohaline circulation.",
        color: "text-warning", accent: "hsl(38 95% 55%)", border: "border-warning/40", bg: "bg-warning/10",
      },
      {
        id: "arctic",    label: "Arctic Sea Ice Loss", region: "Polar",          icon: "🧊",
        probability: 82,  delay: "~8–20 yr",
        mechanic: "CO₂ pulse + AMOC reduction amplifies Arctic warming 3–4× the global mean. Summer sea ice collapses, triggering albedo feedback.",
        color: "text-critical", accent: "hsl(0 85% 60%)", border: "border-critical/40", bg: "bg-critical/10",
      },
      {
        id: "permafrost", label: "Permafrost Thaw",   region: "Siberia / Canada", icon: "🏔️",
        probability: 61,  delay: "~15–40 yr",
        mechanic: "Arctic warming unlocks 1,500 Gt of frozen carbon. CH₄ and CO₂ release adds an additional +0.3–0.5°C of warming.",
        color: "text-warning", accent: "hsl(38 95% 55%)", border: "border-warning/40", bg: "bg-warning/10",
      },
      {
        id: "gbr",       label: "Coral Bleaching",    region: "Indo-Pacific",   icon: "🪸",
        probability: 55,  delay: "~20–50 yr",
        mechanic: "Ocean warming (+0.5°C above 2024 baseline) combined with CO₂-driven acidification eliminates remaining heat-tolerant coral colonies.",
        color: "text-nominal", accent: "hsl(185 100% 50%)", border: "border-nominal/40", bg: "bg-nominal/10",
      },
    ],
    edges: [
      { from: "amz",       to: "sahel",     label: "ITCZ shift"        },
      { from: "amz",       to: "amoc",      label: "+90 Gt CO₂"        },
      { from: "amoc",      to: "arctic",    label: "heat redistribution"},
      { from: "arctic",    to: "permafrost",label: "albedo feedback"    },
      { from: "permafrost",to: "gbr",       label: "+CH₄ / +CO₂"       },
      { from: "amz",       to: "gbr",       label: "acidification"      },
    ],
  },

  wais: {
    title: "West Antarctic Ice Sheet Collapse",
    description:
      "The West Antarctic Ice Sheet sits on bedrock below sea level — making it uniquely vulnerable to marine ice sheet instability. Warm Circumpolar Deep Water eroding the Thwaites glacier base could trigger irreversible collapse.",
    impact: [
      { label: "Sea Level Rise",  val: "+3–5 m"      },
      { label: "Temp Increase",   val: "+0.5°C"       },
      { label: "Systems Tipped",  val: "5"            },
      { label: "Recovery ETA",    val: ">10,000 yr"  },
    ],
    nodes: [
      {
        id: "wais",   label: "WAIS Collapse",          region: "West Antarctica",  icon: "🧊",
        probability: 100, delay: "TRIGGER",
        mechanic: "Warm Circumpolar Deep Water intrudes beneath Thwaites glacier, triggering marine ice sheet instability and irreversible retreat from the bedrock depression.",
        color: "text-critical", accent: "hsl(0 85% 60%)", border: "border-critical/40", bg: "bg-critical/10",
      },
      {
        id: "slr",    label: "Sea Level Rise",          region: "Global Coastlines", icon: "🌊",
        probability: 95,  delay: "~100–500 yr",
        mechanic: "WAIS collapse contributes 3–5m of sea level rise. Coastal megacities, river deltas, and island nations face inundation — approximately 1 billion people displaced.",
        color: "text-critical", accent: "hsl(0 85% 60%)", border: "border-critical/40", bg: "bg-critical/10",
      },
      {
        id: "amoc2",  label: "AMOC Disruption",         region: "North Atlantic",    icon: "🌀",
        probability: 72,  delay: "~50–200 yr",
        mechanic: "Massive freshwater influx from WAIS melt freshens the North Atlantic, weakening thermohaline density gradients and slowing AMOC by 30–50%.",
        color: "text-warning", accent: "hsl(38 95% 55%)", border: "border-warning/40", bg: "bg-warning/10",
      },
      {
        id: "sahel2", label: "Sahel Monsoon Failure",   region: "West Africa",       icon: "🌵",
        probability: 58,  delay: "~100–300 yr",
        mechanic: "AMOC slowdown shifts the ITCZ southward, weakening the West African monsoon by 15–25% and causing widespread Sahel desertification and famine.",
        color: "text-warning", accent: "hsl(38 95% 55%)", border: "border-warning/40", bg: "bg-warning/10",
      },
      {
        id: "boreal", label: "Boreal Die-back",         region: "Canada / Siberia",  icon: "🌲",
        probability: 48,  delay: "~150–400 yr",
        mechanic: "AMOC collapse intensifies continental warming across the boreal belt, driving drought, beetle outbreaks, and megafires — converting ~1.5 Bha of forest to grassland.",
        color: "text-nominal", accent: "hsl(185 100% 50%)", border: "border-nominal/40", bg: "bg-nominal/10",
      },
    ],
    edges: [
      { from: "wais",  to: "slr",    label: "ice discharge"     },
      { from: "wais",  to: "amoc2",  label: "freshwater pulse"  },
      { from: "amoc2", to: "sahel2", label: "ITCZ southward"    },
      { from: "amoc2", to: "boreal", label: "continental heat"  },
      { from: "slr",   to: "amoc2",  label: "coastal erosion"   },
    ],
  },
};

/* ─── Layout helpers ─── */
const COLS = 3;

function nodeGridPos(idx: number, total: number): { col: number; row: number } {
  return { col: idx % COLS, row: Math.floor(idx / COLS) };
}

// Returns SVG percentage coordinates for center of a node card
function nodeCenter(idx: number): { x: number; y: number } {
  const CARD_W = 100 / COLS;       // % width per column
  const CARD_H = 36;               // % height per row (in SVG units where total height = rows * 36)
  const col = idx % COLS;
  const row = Math.floor(idx / COLS);
  return {
    x: col * CARD_W + CARD_W / 2,
    y: row * CARD_H + CARD_H / 2,
  };
}

function buildArrowPath(fromIdx: number, toIdx: number): string {
  const from = nodeCenter(fromIdx);
  const to   = nodeCenter(toIdx);
  const dx   = to.x - from.x;
  const dy   = to.y - from.y;
  const cx   = from.x + dx * 0.5;
  const cy   = from.y + dy * 0.5 - Math.abs(dx) * 0.25;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

/* ─── Component ─── */
interface TippingCascadeProps {
  open: boolean;
  onClose: () => void;
}

export default function TippingCascade({ open, onClose }: TippingCascadeProps) {
  const [triggered, setTriggered]     = useState(false);
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [chainKey, setChainKey]       = useState<"amazon" | "wais">("amazon");
  const timerRefs = useRef<number[]>([]);

  const chain      = CASCADE_CHAINS[chainKey];
  const firstNodeId = chain.nodes[0].id;
  const nodeMap    = Object.fromEntries(chain.nodes.map((n, i) => [n.id, i]));
  const rowCount   = Math.ceil(chain.nodes.length / COLS);
  const svgViewH   = rowCount * 36 + 4;

  // Keyboard close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset on chain/open change
  useEffect(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setTriggered(false);
    setActiveNodes(new Set([firstNodeId]));
    setActiveEdges(new Set());
    setSelectedNode(null);
  }, [open, chainKey, firstNodeId]);

  const runCascade = () => {
    setTriggered(true);
    const delays = [0, 900, 1600, 2300, 3100, 4000];
    chain.nodes.forEach((node, idx) => {
      if (idx === 0) return;
      const t = window.setTimeout(() => {
        setActiveNodes(prev => new Set([...prev, node.id]));
        // Activate edges pointing TO this node 300ms early
        chain.edges.forEach(edge => {
          if (edge.to === node.id) {
            const et = window.setTimeout(() => {
              setActiveEdges(prev => new Set([...prev, `${edge.from}-${edge.to}`]));
            }, Math.max(0, (delays[idx] ?? idx * 800) - 350));
            timerRefs.current.push(et);
          }
        });
      }, delays[idx] ?? idx * 800);
      timerRefs.current.push(t);
    });
  };

  const reset = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setTriggered(false);
    setActiveNodes(new Set([firstNodeId]));
    setActiveEdges(new Set());
    setSelectedNode(null);
  };

  const selectedNodeData = selectedNode ? chain.nodes.find(n => n.id === selectedNode) : null;
  const propagationPct   = triggered
    ? Math.round(((activeNodes.size - 1) / (chain.nodes.length - 1)) * 100)
    : 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="fixed inset-x-3 top-[4%] bottom-[4%] md:inset-x-[6%] lg:inset-x-[10%] z-50 panel-glass rounded-sm shadow-panel flex flex-col overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <GitBranch className="w-4 h-4 text-critical" />
                <div>
                  <div className="font-display text-[11px] tracking-[0.12em] text-foreground">TIPPING CASCADE SIMULATOR</div>
                  <div className="font-data text-[8px] text-muted-foreground/60 tracking-widest">domino chain · non-linear dynamics · planetary systems</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Chain selector */}
                <div className="flex gap-0.5 border border-border/40 rounded-sm p-0.5 bg-muted/20">
                  {(["amazon", "wais"] as const).map(key => (
                    <button
                      key={key}
                      onClick={() => setChainKey(key)}
                      className={`font-data text-[8px] tracking-widest rounded-sm px-3 py-1.5 transition-all ${
                        chainKey === key
                          ? "bg-critical/20 text-critical border border-critical/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }`}
                    >
                      {key === "amazon" ? "🌿 AMAZON" : "🧊 WAIS"}
                    </button>
                  ))}
                </div>

                {triggered ? (
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 font-data text-[9px] tracking-widest border border-muted/40 text-muted-foreground rounded-sm px-3 py-1.5 hover:bg-muted/30 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    RESET
                  </button>
                ) : (
                  <button
                    onClick={runCascade}
                    className="flex items-center gap-1.5 font-data text-[9px] tracking-widest border border-critical/40 text-critical bg-critical/8 rounded-sm px-3 py-1.5 hover:bg-critical/16 transition-colors"
                    style={{ animation: "pulse 2s ease-in-out infinite" }}
                  >
                    <Zap className="w-3 h-3" />
                    TRIGGER {chainKey === "amazon" ? "AMAZON" : "WAIS"} TIPPING
                  </button>
                )}

                <button onClick={onClose} className="p-1.5 rounded-sm hover:bg-muted/40 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 min-h-0 flex overflow-hidden">

              {/* Left: graph + description */}
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

                {/* Description */}
                <div className="shrink-0 px-5 pt-4 pb-3">
                  <p className="font-body text-xs text-muted-foreground/80 leading-relaxed">{chain.description}</p>
                </div>

                {/* Node grid + SVG arrows */}
                <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
                  <div className="relative">
                    {/* SVG arrow layer — positioned over cards */}
                    <svg
                      viewBox={`0 0 100 ${svgViewH}`}
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full pointer-events-none"
                      style={{ height: `${rowCount * (rowCount > 1 ? 156 : 120)}px`, zIndex: 1 }}
                    >
                      <defs>
                        <marker id="arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                          <path d="M 0 0 L 6 3 L 0 6 Z" fill="hsl(185 100% 50% / 0.7)" />
                        </marker>
                        <marker id="arrow-inactive" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                          <path d="M 0 0 L 6 3 L 0 6 Z" fill="hsl(220 20% 25%)" />
                        </marker>
                      </defs>
                      {chain.edges.map(edge => {
                        const fi = nodeMap[edge.from];
                        const ti = nodeMap[edge.to];
                        if (fi === undefined || ti === undefined) return null;
                        const key = `${edge.from}-${edge.to}`;
                        const isActive = activeEdges.has(key);
                        const fromNode = chain.nodes[fi];
                        return (
                          <g key={key}>
                            <path
                              d={buildArrowPath(fi, ti)}
                              fill="none"
                              stroke={isActive ? fromNode.accent : "hsl(220 20% 18%)"}
                              strokeWidth={isActive ? 0.7 : 0.35}
                              strokeDasharray={isActive ? undefined : "1.5 1.5"}
                              opacity={isActive ? 0.85 : 0.4}
                              markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow-inactive)"}
                            />
                            {isActive && (() => {
                              const fc = nodeCenter(fi);
                              const tc = nodeCenter(ti);
                              return (
                                <text
                                  x={(fc.x + tc.x) / 2}
                                  y={(fc.y + tc.y) / 2 - 2}
                                  fill={fromNode.accent}
                                  fontSize="2"
                                  textAnchor="middle"
                                  opacity={0.7}
                                  fontFamily="JetBrains Mono, monospace"
                                >
                                  {edge.label}
                                </text>
                              );
                            })()}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Node cards */}
                    <div className="grid grid-cols-3 gap-3 relative z-10">
                      {chain.nodes.map((node, idx) => {
                        const isActive   = activeNodes.has(node.id);
                        const isSelected = selectedNode === node.id;
                        const isFirst    = idx === 0;
                        return (
                          <motion.div
                            key={node.id}
                            initial={{ opacity: 0.25, scale: 0.95 }}
                            animate={isActive
                              ? { opacity: 1, scale: 1 }
                              : { opacity: 0.28, scale: 0.97 }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                            onClick={() => setSelectedNode(isSelected ? null : node.id)}
                            className={`relative cursor-pointer rounded-sm border p-3 transition-all duration-200 ${
                              isActive
                                ? isSelected
                                  ? `${node.border} ${node.bg} ring-1 ring-primary/30`
                                  : `${node.border} bg-muted/25 hover:bg-muted/40`
                                : "border-border/20 bg-muted/8"
                            }`}
                          >
                            {/* Pulsing border on active */}
                            {isActive && (
                              <motion.div
                                className={`absolute inset-0 rounded-sm pointer-events-none border ${node.border}`}
                                animate={{ opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                              />
                            )}

                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl leading-none">{node.icon}</span>
                                <div>
                                  <div className={`font-data text-[9px] font-semibold tracking-wide leading-tight ${isActive ? node.color : "text-muted-foreground/35"}`}>
                                    {node.label}
                                  </div>
                                  <div className="font-data text-[7px] text-muted-foreground/40 tracking-wider mt-0.5">{node.region}</div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className={`font-display text-base font-bold leading-none ${isActive ? node.color : "text-muted-foreground/25"}`}>
                                  {node.probability}%
                                </div>
                                <div className="font-data text-[6px] text-muted-foreground/35 tracking-widest mt-0.5">CASCADE</div>
                              </div>
                            </div>

                            <div className={`font-data text-[8px] tracking-widest rounded-sm px-2 py-1 text-center transition-all ${
                              isActive
                                ? isFirst
                                  ? "bg-critical/15 text-critical border border-critical/20"
                                  : "bg-muted/40 text-muted-foreground border border-border/20"
                                : "bg-muted/10 text-muted-foreground/25"
                            }`}>
                              {isActive ? (isFirst ? "● TIPPING" : `● CASCADING · ${node.delay}`) : node.delay}
                            </div>

                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-2 pt-2 border-t border-border/20"
                              >
                                <p className="font-body text-[9px] text-muted-foreground/70 leading-relaxed">
                                  {node.mechanic}
                                </p>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Propagation bar */}
                <div className="shrink-0 px-5 pb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-data text-[8px] text-muted-foreground/60 tracking-widest">CASCADE PROPAGATION</span>
                    <span className={`font-data text-[9px] font-semibold ${triggered ? "text-critical" : "text-muted-foreground/30"}`}>
                      {activeNodes.size - 1} / {chain.nodes.length - 1} SYSTEMS AFFECTED
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden border border-border/20">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-warning to-critical"
                      animate={{ width: `${propagationPct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: detail panel */}
              <div className="w-[260px] shrink-0 border-l border-border/30 flex flex-col overflow-hidden">
                <div className="px-4 pt-4 pb-2 shrink-0">
                  <div className="font-data text-[8px] tracking-widest text-muted-foreground/50">SYSTEM DETAIL</div>
                  <div className="font-data text-[9px] text-muted-foreground/30 mt-0.5">Click a node to inspect</div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                  <AnimatePresence mode="wait">
                    {selectedNodeData ? (
                      <motion.div
                        key={selectedNodeData.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-2.5 mt-1">
                          <span className="text-3xl">{selectedNodeData.icon}</span>
                          <div>
                            <div className={`font-data text-[11px] font-semibold ${selectedNodeData.color}`}>{selectedNodeData.label}</div>
                            <div className="font-data text-[8px] text-muted-foreground/60 mt-0.5">{selectedNodeData.region}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted/30 rounded-sm p-2.5 border border-border/30">
                            <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">CASCADE PROB.</div>
                            <div className={`font-display text-2xl font-bold ${selectedNodeData.color}`}>{selectedNodeData.probability}%</div>
                          </div>
                          <div className="bg-muted/30 rounded-sm p-2.5 border border-border/30">
                            <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">TIME TO TIP</div>
                            <div className="font-data text-[10px] text-foreground/80 leading-tight">{selectedNodeData.delay}</div>
                          </div>
                        </div>

                        <div className="bg-muted/20 rounded-sm p-3 border border-border/20">
                          <div className="flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="w-3 h-3 text-muted-foreground/60" />
                            <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest">CAUSAL MECHANISM</div>
                          </div>
                          <p className="font-body text-[11px] text-muted-foreground/80 leading-relaxed">{selectedNodeData.mechanic}</p>
                        </div>

                        {/* Incoming edges */}
                        {chain.edges.filter(e => e.to === selectedNodeData.id).length > 0 && (
                          <div>
                            <div className="font-data text-[7px] text-muted-foreground/40 tracking-widest mb-1.5">DRIVEN BY</div>
                            {chain.edges
                              .filter(e => e.to === selectedNodeData.id)
                              .map(e => {
                                const fromNode = chain.nodes.find(n => n.id === e.from);
                                if (!fromNode) return null;
                                return (
                                  <div key={e.from} className="flex items-center gap-2 py-1 border-b border-border/10 last:border-0">
                                    <span className="text-sm">{fromNode.icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-data text-[8px] text-foreground/70">{fromNode.label}</div>
                                      <div className="font-data text-[7px] text-primary/60">{e.label}</div>
                                    </div>
                                    <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center gap-3 py-10 text-center"
                      >
                        <ChevronRight className="w-8 h-8 text-muted-foreground/15" />
                        <p className="font-data text-[8px] text-muted-foreground/30 tracking-widest leading-relaxed">
                          SELECT A NODE TO<br />INSPECT MECHANISMS
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Impact summary */}
                <AnimatePresence>
                  {triggered && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="shrink-0 mx-4 mb-4 bg-critical/8 border border-critical/25 rounded-sm p-3"
                    >
                      <div className="font-data text-[8px] text-critical tracking-widest mb-2.5 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        PROJECTED IMPACT
                      </div>
                      {chain.impact.map(m => (
                        <div key={m.label} className="flex justify-between items-center py-1 border-b border-border/10 last:border-0">
                          <span className="font-data text-[8px] text-muted-foreground/60">{m.label}</span>
                          <span className={`font-data text-[9px] font-semibold ${
                            m.label === "Systems Tipped" ? "text-critical" : "text-critical"
                          }`}>
                            {m.label === "Systems Tipped" ? `${activeNodes.size}` : m.val}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
