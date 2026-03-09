import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, X, Zap, ChevronRight } from "lucide-react";

/* ─── Cascade chain data ─── */
interface CascadeNode {
  id: string;
  label: string;
  region: string;
  icon: string;
  probability: number;   // % of cascade happening if trigger fires
  delay: string;         // time-to-trigger after predecessor
  mechanic: string;      // brief description of the causal link
  color: string;         // tailwind text color token name
  bgColor: string;       // tailwind bg token
}

interface CascadeEdge {
  from: string;
  to: string;
  label: string;
}

const CASCADE_CHAINS: Record<string, { nodes: CascadeNode[]; edges: CascadeEdge[]; title: string; description: string; impact: { label: string; val: string }[] }> = {
  amazon: {
    title: "Amazon Savannification Cascade",
    description:
      "The Amazon produces ~20% of its own rainfall through transpiration. Deforestation beyond a ~20–25% threshold could trigger a self-reinforcing dieback, drying the continent, disrupting monsoons, and emitting ~90 Gt CO₂ — igniting a global cascade.",
    impact: [
      { label: "CO₂ Released",   val: "+90 Gt" },
      { label: "Temp Increase",  val: "+1.5°C" },
      { label: "Systems Tipped", val: "6" },
      { label: "Recovery ETA",   val: ">500 yr" },
    ],
    nodes: [
      { id: "amz", label: "Amazon Tipping", region: "South America", icon: "🌿", probability: 100, delay: "TRIGGER", mechanic: "Deforestation + drought reduces moisture recycling. Forest cannot recover.", color: "text-critical", bgColor: "bg-critical" },
      { id: "sahel", label: "Sahel Drying", region: "West Africa", icon: "🌵", probability: 74, delay: "~5–15 yr", mechanic: "Amazon collapse shifts ITCZ south, reducing West African monsoon rainfall by 20–30%.", color: "text-warning", bgColor: "bg-warning" },
      { id: "amoc", label: "AMOC Slowdown", region: "North Atlantic", icon: "🌊", probability: 68, delay: "~10–30 yr", mechanic: "+90 Gt CO₂ emissions raise global temps, accelerating Greenland melt, freshening Atlantic and weakening AMOC thermohaline circulation.", color: "text-warning", bgColor: "bg-warning" },
      { id: "arctic", label: "Arctic Sea Ice Loss", region: "Polar", icon: "🧊", probability: 82, delay: "~8–20 yr", mechanic: "CO₂ pulse + AMOC reduction amplifies Arctic warming 3–4× global mean. Summer sea ice collapses, triggering albedo feedback.", color: "text-critical", bgColor: "bg-critical" },
      { id: "permafrost", label: "Permafrost Thaw", region: "Siberia / Canada", icon: "🏔️", probability: 61, delay: "~15–40 yr", mechanic: "Arctic warming unlocks 1,500 Gt of frozen carbon. CH₄ and CO₂ release accelerates warming by +0.3–0.5°C.", color: "text-warning", bgColor: "bg-warning" },
      { id: "gbr", label: "Coral Bleaching", region: "Indo-Pacific", icon: "🪸", probability: 55, delay: "~20–50 yr", mechanic: "Ocean warming (+0.5°C above 2024) + acidification from CO₂ pulse eliminates remaining heat-tolerant coral colonies.", color: "text-nominal", bgColor: "bg-nominal" },
    ],
    edges: [
      { from: "amz", to: "sahel", label: "ITCZ shift" },
      { from: "amz", to: "amoc", label: "+90 Gt CO₂" },
      { from: "amoc", to: "arctic", label: "heat redistribution" },
      { from: "arctic", to: "permafrost", label: "albedo feedback" },
      { from: "permafrost", to: "gbr", label: "+CH₄ / +CO₂" },
      { from: "amz", to: "gbr", label: "ocean acidification" },
    ],
  },

  wais: {
    title: "West Antarctic Ice Sheet Collapse",
    description:
      "The West Antarctic Ice Sheet sits on bedrock below sea level — making it vulnerable to marine ice sheet instability. Warm ocean water eroding the Thwaites glacier base could trigger irreversible collapse, raising sea levels by 3–5m and destabilizing global circulation systems.",
    impact: [
      { label: "Sea Level Rise",  val: "+3–5 m" },
      { label: "Temp Increase",   val: "+0.5°C" },
      { label: "Systems Tipped",  val: "5" },
      { label: "Recovery ETA",    val: ">10,000 yr" },
    ],
    nodes: [
      { id: "wais", label: "WAIS Collapse", region: "West Antarctica", icon: "🧊", probability: 100, delay: "TRIGGER", mechanic: "Warm Circumpolar Deep Water intrudes beneath Thwaites glacier, triggering marine ice sheet instability and irreversible retreat.", color: "text-critical", bgColor: "bg-critical" },
      { id: "slr", label: "Sea Level Rise", region: "Global Coastlines", icon: "🌊", probability: 95, delay: "~100–500 yr", mechanic: "WAIS collapse contributes 3–5m of sea level rise. Coastal megacities, deltas, and island nations face inundation. ~1 billion people displaced.", color: "text-critical", bgColor: "bg-critical" },
      { id: "amoc2", label: "AMOC Disruption", region: "North Atlantic", icon: "🌀", probability: 72, delay: "~50–200 yr", mechanic: "Massive freshwater influx from WAIS melt freshens the North Atlantic, weakening thermohaline density gradients and slowing AMOC by 30–50%.", color: "text-warning", bgColor: "bg-warning" },
      { id: "sahel2", label: "Sahel Monsoon Failure", region: "West Africa", icon: "🌵", probability: 58, delay: "~100–300 yr", mechanic: "AMOC slowdown shifts the ITCZ southward, weakening the West African monsoon by 15–25%, causing widespread Sahel desertification.", color: "text-warning", bgColor: "bg-warning" },
      { id: "boreal", label: "Boreal Die-back", region: "Canada / Siberia", icon: "🌲", probability: 48, delay: "~150–400 yr", mechanic: "AMOC collapse intensifies continental warming across the boreal belt, driving drought, beetle outbreaks, and megafires — converting 1.5 Bha of forest to grassland.", color: "text-nominal", bgColor: "bg-nominal" },
    ],
    edges: [
      { from: "wais",  to: "slr",    label: "ice discharge" },
      { from: "wais",  to: "amoc2",  label: "freshwater pulse" },
      { from: "amoc2", to: "sahel2", label: "ITCZ southward" },
      { from: "amoc2", to: "boreal", label: "continental warming" },
      { from: "slr",   to: "amoc2",  label: "coast erosion flux" },
    ],
  },
};

/* ─── SVG arrow path between two nodes ─── */
function getArrowPath(
  fromIdx: number, toIdx: number, cols: number, total: number,
): string {
  const getPos = (idx: number) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x   = col * (100 / (cols - 0.5)) + 50 / cols;
    const y   = row * 110 + 55;
    return { x, y };
  };
  const from = getPos(fromIdx);
  const to   = getPos(toIdx);
  const mx   = (from.x + to.x) / 2;
  const my   = (from.y + to.y) / 2 - 18;
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

interface TippingCascadeProps {
  open: boolean;
  onClose: () => void;
}

export default function TippingCascade({ open, onClose }: TippingCascadeProps) {
  const [triggered, setTriggered] = useState(false);
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [chainKey, setChainKey] = useState<keyof typeof CASCADE_CHAINS>("amazon");
  const timerRefs = useRef<number[]>([]);

  const chain = CASCADE_CHAINS[chainKey];
  const firstNodeId = chain.nodes[0].id;

  // Key listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset on open/close or chain change
  useEffect(() => {
    timerRefs.current.forEach(clearTimeout);
    setTriggered(false);
    setActiveNodes(new Set([firstNodeId]));
    setActiveEdges(new Set());
    setSelectedNode(null);
  }, [open, chainKey, firstNodeId]);

  const runCascade = () => {
    setTriggered(true);
    const delays = [0, 900, 1600, 2100, 2800, 3600, 4400];
    chain.nodes.forEach((node, idx) => {
      if (idx === 0) return;
      const t = window.setTimeout(() => {
        setActiveNodes(prev => new Set([...prev, node.id]));
        chain.edges.forEach(edge => {
          if (edge.to === node.id) {
            const et = window.setTimeout(() => {
              setActiveEdges(prev => new Set([...prev, `${edge.from}-${edge.to}`]));
            }, (delays[idx] ?? idx * 700) - 300);
            timerRefs.current.push(et);
          }
        });
      }, delays[idx] ?? idx * 700);
      timerRefs.current.push(t);
    });
  };

  const reset = () => {
    timerRefs.current.forEach(clearTimeout);
    setTriggered(false);
    setActiveNodes(new Set([firstNodeId]));
    setActiveEdges(new Set());
    setSelectedNode(null);
  };

  const nodeMap = Object.fromEntries(chain.nodes.map((n, i) => [n.id, i]));
  const cols = 3;
  const svgH = Math.ceil(chain.nodes.length / cols) * 110 + 20;

  // Color map for SVG edges
  const edgeColorMap: Record<string, string> = {
    "text-critical": "hsl(0 85% 60%)",
    "text-warning":  "hsl(38 95% 55%)",
    "text-nominal":  "hsl(185 100% 50%)",
  };

  const selectedNodeData = selectedNode ? chain.nodes.find(n => n.id === selectedNode) : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/75 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-[8%] lg:inset-x-[12%] z-50 panel-glass rounded-sm shadow-panel flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <GitBranch className="w-4 h-4 text-critical" />
                <div>
                  <div className="font-display text-sm tracking-[0.1em] text-foreground">TIPPING CASCADE SIMULATOR</div>
                  <div className="font-data text-[9px] text-muted-foreground tracking-widest">domino chain · planetary systems · non-linear dynamics</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {triggered && (
                  <button
                    onClick={reset}
                    className="font-data text-[9px] tracking-widest border border-muted/30 text-muted-foreground rounded-sm px-3 py-1.5 hover:bg-muted/20 transition-colors"
                  >
                    RESET
                  </button>
                )}
                {!triggered && (
                  <button
                    onClick={runCascade}
                    className="flex items-center gap-1.5 font-data text-[9px] tracking-widest border border-critical/30 text-critical bg-critical/8 rounded-sm px-3 py-1.5 hover:bg-critical/15 transition-colors animate-pulse"
                  >
                    <Zap className="w-3 h-3" />
                    TRIGGER AMAZON TIPPING
                  </button>
                )}
                <button onClick={onClose} className="p-1.5 rounded-sm hover:bg-muted/40 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 flex gap-0 overflow-hidden">

              {/* Left: cascade graph */}
              <div className="flex-1 min-w-0 overflow-y-auto p-5 flex flex-col gap-4">
                {/* Description */}
                <p className="font-body text-xs text-muted-foreground leading-relaxed">{chain.description}</p>

                {/* Node grid */}
                <div className="relative">
                  {/* SVG arrows */}
                  <svg
                    viewBox={`0 0 100 ${svgH}`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full pointer-events-none"
                    style={{ height: `${svgH * 3}px`, top: 0, zIndex: 0 }}
                  >
                    {chain.edges.map(edge => {
                      const fi = nodeMap[edge.from];
                      const ti = nodeMap[edge.to];
                      if (fi === undefined || ti === undefined) return null;
                      const isActive = activeEdges.has(`${edge.from}-${edge.to}`);
                      const fromColor = edgeColorMap[chain.nodes[fi].color] ?? "hsl(185 100% 50%)";
                      return (
                        <g key={`${edge.from}-${edge.to}`}>
                          <path
                            d={getArrowPath(fi, ti, cols, chain.nodes.length)}
                            fill="none"
                            stroke={isActive ? fromColor : "hsl(220 20% 18%)"}
                            strokeWidth={isActive ? 0.8 : 0.4}
                            strokeDasharray={isActive ? "none" : "2 2"}
                            opacity={isActive ? 0.85 : 0.35}
                          />
                          {isActive && (
                            <text
                              x={(nodeMap[edge.from] % cols + nodeMap[edge.to] % cols) / 2 * (100 / (cols - 0.5)) + 50 / cols / 2}
                              y={(Math.floor(nodeMap[edge.from] / cols) + Math.floor(nodeMap[edge.to] / cols)) / 2 * 110 + 35}
                              fill={fromColor}
                              fontSize="2.2"
                              textAnchor="middle"
                              opacity={0.7}
                              fontFamily="JetBrains Mono, monospace"
                            >
                              {edge.label}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Node cards */}
                  <div className="grid grid-cols-3 gap-3 relative z-10">
                    {chain.nodes.map((node, idx) => {
                      const isActive  = activeNodes.has(node.id);
                      const isSelected = selectedNode === node.id;
                      return (
                        <motion.div
                          key={node.id}
                          initial={{ opacity: 0.3, scale: 0.96 }}
                          animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0.35, scale: 0.97 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          onClick={() => setSelectedNode(isSelected ? null : node.id)}
                          className={`cursor-pointer rounded-sm border p-3 transition-all duration-300 ${
                            isActive
                              ? isSelected
                                ? `border-primary/50 bg-primary/8`
                                : `border-${node.bgColor.replace("bg-", "")}/30 bg-muted/30 hover:bg-muted/50`
                              : "border-border/20 bg-muted/10"
                          }`}
                        >
                          {/* Cascade order badge */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{node.icon}</span>
                              <div>
                                <div className={`font-data text-[9px] font-semibold tracking-wide ${isActive ? node.color : "text-muted-foreground/40"}`}>
                                  {node.label}
                                </div>
                                <div className="font-data text-[7px] text-muted-foreground/50">{node.region}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-display text-base font-bold ${isActive ? node.color : "text-muted-foreground/30"}`}>
                                {node.probability}%
                              </div>
                              <div className="font-data text-[7px] text-muted-foreground/40">CASCADE</div>
                            </div>
                          </div>

                          {/* Status / delay */}
                          <div className={`font-data text-[8px] tracking-widest rounded-sm px-2 py-1 text-center ${
                            isActive
                              ? idx === 0
                                ? "bg-critical/15 text-critical"
                                : "bg-muted/40 text-muted-foreground"
                              : "bg-muted/10 text-muted-foreground/30"
                          }`}>
                            {isActive ? (idx === 0 ? "● TIPPING" : `● CASCADING · ${node.delay}`) : node.delay}
                          </div>

                          {/* Pulsing ring when active */}
                          {isActive && (
                            <motion.div
                              className={`absolute inset-0 rounded-sm pointer-events-none border-2 ${
                                idx === 0 ? "border-critical/40" : "border-warning/30"
                              }`}
                              animate={{ opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-data text-[8px] text-muted-foreground tracking-widest">CASCADE PROPAGATION</span>
                    <span className={`font-data text-[9px] font-semibold ${triggered ? "text-critical" : "text-muted-foreground/40"}`}>
                      {activeNodes.size - 1} / {chain.nodes.length - 1} SYSTEMS AFFECTED
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden border border-border/20">
                    <motion.div
                      className="h-full bg-gradient-to-r from-warning to-critical rounded-full"
                      animate={{ width: `${((activeNodes.size - 1) / (chain.nodes.length - 1)) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: detail panel */}
              <div className="w-[240px] shrink-0 border-l border-border/30 p-4 overflow-y-auto flex flex-col gap-4">
                <div className="font-data text-[9px] tracking-widest text-muted-foreground/60">SYSTEM DETAIL</div>

                <AnimatePresence mode="wait">
                  {selectedNodeData ? (
                    <motion.div
                      key={selectedNodeData.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{selectedNodeData.icon}</span>
                        <div>
                          <div className={`font-data text-[11px] font-semibold ${selectedNodeData.color}`}>{selectedNodeData.label}</div>
                          <div className="font-data text-[8px] text-muted-foreground">{selectedNodeData.region}</div>
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-sm p-2.5 border border-border/30">
                        <div className="font-data text-[8px] text-muted-foreground/60 tracking-widest mb-1">CASCADE PROBABILITY</div>
                        <div className={`font-display text-2xl font-bold ${selectedNodeData.color}`}>{selectedNodeData.probability}%</div>
                      </div>
                      <div className="bg-muted/30 rounded-sm p-2.5 border border-border/30">
                        <div className="font-data text-[8px] text-muted-foreground/60 tracking-widest mb-1">TIME TO TRIGGER</div>
                        <div className="font-data text-[11px] text-foreground/80">{selectedNodeData.delay}</div>
                      </div>
                      <div className="bg-muted/20 rounded-sm p-2.5 border border-border/20">
                        <div className="font-data text-[8px] text-muted-foreground/60 tracking-widest mb-1.5">CAUSAL MECHANISM</div>
                        <p className="font-body text-[11px] text-muted-foreground leading-relaxed">{selectedNodeData.mechanic}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center gap-3 py-8 text-center"
                    >
                      <ChevronRight className="w-6 h-6 text-muted-foreground/20" />
                      <p className="font-data text-[9px] text-muted-foreground/40 tracking-widest leading-relaxed">
                        CLICK A NODE TO SEE<br/>CAUSAL MECHANISM
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Impact summary when cascade running */}
                {triggered && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-auto bg-critical/8 border border-critical/20 rounded-sm p-3"
                  >
                    <div className="font-data text-[8px] text-critical tracking-widest mb-2">PROJECTED IMPACT</div>
                    {[
                      { label: "CO₂ Released",   val: "+90 Gt" },
                      { label: "Temp Increase",  val: "+1.5°C" },
                      { label: "Systems Tipped", val: `${activeNodes.size}` },
                      { label: "Recovery ETA",   val: ">500 yr" },
                    ].map(m => (
                      <div key={m.label} className="flex justify-between py-0.5 border-b border-border/10 last:border-0">
                        <span className="font-data text-[8px] text-muted-foreground/60">{m.label}</span>
                        <span className="font-data text-[9px] text-critical font-semibold">{m.val}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
