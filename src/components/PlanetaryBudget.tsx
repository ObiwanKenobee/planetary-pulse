import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, TrendingUp, AlertCircle, X, Zap, CheckCircle2 } from "lucide-react";

interface BiomeBudget {
  id: string;
  name: string;
  biome: string;
  icon: string;
  needed: number;   // $M
  deployed: number; // $M
  urgency: "critical" | "high" | "moderate";
  trend: "rising" | "stable" | "declining";
  lat: number;
  lon: number;
}

const INITIAL_BUDGETS: BiomeBudget[] = [
  { id: "amz",  name: "Amazon Basin",         biome: "Tropical Forest",  icon: "🌿", needed: 2400,  deployed: 142,  urgency: "critical", trend: "rising",   lat: -3.5,  lon: -60.0 },
  { id: "arc",  name: "Arctic Ocean",          biome: "Polar / Cryo",    icon: "🧊", needed: 800,   deployed: 0,    urgency: "critical", trend: "declining",lat: 85.0,  lon: 0.0   },
  { id: "reef", name: "Great Barrier Reef",    biome: "Marine / Reef",   icon: "🪸", needed: 340,   deployed: 27,   urgency: "critical", trend: "rising",   lat: -18.0, lon: 147.0 },
  { id: "sah",  name: "Sahel Region",          biome: "Semi-arid",       icon: "🌵", needed: 560,   deployed: 38,   urgency: "high",     trend: "rising",   lat: 14.0,  lon: 2.0   },
  { id: "con",  name: "Congo Basin",           biome: "Tropical Forest", icon: "🌳", needed: 780,   deployed: 54,   urgency: "high",     trend: "stable",   lat: -2.0,  lon: 23.0  },
  { id: "perm", name: "Siberian Permafrost",   biome: "Boreal / Tundra", icon: "🏔️", needed: 1200,  deployed: 0,    urgency: "high",     trend: "declining",lat: 62.0,  lon: 105.0 },
  { id: "wais", name: "West Antarctica",       biome: "Polar Ice Sheet", icon: "❄️", needed: 2100,  deployed: 0,    urgency: "critical", trend: "declining",lat: -78.0, lon: -90.0 },
  { id: "amoc", name: "North Atlantic",        biome: "Ocean Current",   icon: "🌊", needed: 450,   deployed: 0,    urgency: "high",     trend: "stable",   lat: 52.0,  lon: -35.0 },
  { id: "sea",  name: "Southeast Asia",        biome: "Peatland",        icon: "🌴", needed: 380,   deployed: 31,   urgency: "moderate", trend: "rising",   lat: 2.0,   lon: 112.0 },
];

const TIERS = [
  { amount: 10,  label: "$10M",  desc: "Seed protection",   color: "text-nominal" },
  { amount: 50,  label: "$50M",  desc: "Regional programme",color: "text-warning" },
  { amount: 100, label: "$100M", desc: "Full intervention", color: "text-healthy" },
];

const URGENCY_STYLES = {
  critical: { bar: "from-critical/80 to-critical",     text: "text-critical",  dot: "bg-critical"  },
  high:     { bar: "from-warning/80 to-warning",       text: "text-warning",   dot: "bg-warning"   },
  moderate: { bar: "from-nominal/80 to-nominal",       text: "text-nominal",   dot: "bg-nominal"   },
};

function formatM(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}B`;
  return val === 0 ? "—" : `$${val}M`;
}

interface DeployModalProps {
  biome: BiomeBudget;
  onClose: () => void;
  onDeploy: (id: string, amount: number) => void;
}

function DeployModal({ biome, onClose, onDeploy }: DeployModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [done, setDone] = useState(false);

  const handleDeploy = () => {
    if (selected === null) return;
    setDeploying(true);
    setTimeout(() => {
      onDeploy(biome.id, selected);
      setDeploying(false);
      setDone(true);
      setTimeout(onClose, 1200);
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ duration: 0.22 }}
        className="relative z-10 panel-glass rounded-sm shadow-panel w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{biome.icon}</span>
            <div>
              <div className="font-display text-[10px] tracking-[0.12em] text-foreground">DEPLOY CAPITAL</div>
              <div className="font-data text-[9px] text-muted-foreground/60 tracking-widest">{biome.name} · {biome.biome}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-sm hover:bg-muted/40 transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Current status */}
        <div className="bg-muted/20 border border-border/30 rounded-sm p-3 mb-4">
          <div className="flex justify-between text-[8px] font-data text-muted-foreground/50 tracking-widest mb-2">
            <span>CURRENTLY DEPLOYED</span>
            <span>FUNDING GAP</span>
          </div>
          <div className="flex justify-between">
            <span className="font-display text-sm font-bold text-healthy">{formatM(biome.deployed)}</span>
            <span className="font-display text-sm font-bold text-critical">−{formatM(biome.needed - biome.deployed)}</span>
          </div>
        </div>

        {/* Tier selector */}
        <div className="font-data text-[8px] text-muted-foreground/50 tracking-widest mb-2">SELECT INVESTMENT TIER</div>
        <div className="flex flex-col gap-2 mb-4">
          {TIERS.map(tier => (
            <button
              key={tier.amount}
              onClick={() => setSelected(tier.amount)}
              className={`flex items-center justify-between rounded-sm px-3 py-2.5 border transition-all ${
                selected === tier.amount
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/30 bg-muted/10 hover:bg-muted/25 hover:border-border/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${selected === tier.amount ? "bg-primary" : "bg-muted-foreground/30"}`} />
                <span className={`font-display text-sm font-bold ${selected === tier.amount ? "text-primary" : "text-foreground/60"}`}>{tier.label}</span>
              </div>
              <span className={`font-data text-[8px] tracking-widest ${selected === tier.amount ? tier.color : "text-muted-foreground/40"}`}>{tier.desc}</span>
            </button>
          ))}
        </div>

        {/* Deploy button */}
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 py-3 rounded-sm bg-healthy/10 border border-healthy/30"
            >
              <CheckCircle2 className="w-4 h-4 text-healthy" />
              <span className="font-data text-[9px] tracking-widest text-healthy">CAPITAL DEPLOYED · GLOBE ZOOMING</span>
            </motion.div>
          ) : (
            <motion.button
              key="deploy"
              onClick={handleDeploy}
              disabled={selected === null || deploying}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-sm font-data text-[9px] tracking-widest border transition-all ${
                selected !== null && !deploying
                  ? "border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
                  : "border-border/20 text-muted-foreground/30 cursor-not-allowed"
              }`}
            >
              {deploying ? (
                <motion.div
                  className="w-3 h-3 border border-primary/50 border-t-primary rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <Zap className="w-3 h-3" />
              )}
              {deploying ? "DEPLOYING CAPITAL..." : `DEPLOY ${selected ? formatM(selected) : "—"} TO ${biome.name.toUpperCase()}`}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

interface PlanetaryBudgetProps {
  onZoomToRegion?: (lat: number, lon: number, label: string) => void;
  /** Lift deploy modal to parent so it escapes overflow-hidden containers */
  deployTarget?: BiomeBudget | null;
  onDeployRequest?: (biome: BiomeBudget) => void;
}

export default function PlanetaryBudget({ onZoomToRegion, deployTarget, onDeployRequest }: PlanetaryBudgetProps) {
  const [budgets, setBudgets] = useState<BiomeBudget[]>(INITIAL_BUDGETS);
  // fallback internal state if parent doesn't lift
  const [internalTarget, setInternalTarget] = useState<BiomeBudget | null>(null);
  const effectiveTarget = deployTarget !== undefined ? deployTarget : internalTarget;
  const setEffectiveTarget = onDeployRequest !== undefined
    ? (b: BiomeBudget | null) => { if (b) onDeployRequest(b); else setInternalTarget(null); }
    : setInternalTarget;

  const totalNeeded   = budgets.reduce((s, b) => s + b.needed, 0);
  const totalDeployed = budgets.reduce((s, b) => s + b.deployed, 0);
  const totalGap      = totalNeeded - totalDeployed;
  const globalPct     = Math.round((totalDeployed / totalNeeded) * 100 * 10) / 10;

  const handleDeploy = (id: string, amount: number) => {
    setBudgets(prev => prev.map(b =>
      b.id === id ? { ...b, deployed: Math.min(b.needed, b.deployed + amount) } : b
    ));
    const biome = budgets.find(b => b.id === id);
    if (biome && onZoomToRegion) {
      setTimeout(() => onZoomToRegion(biome.lat, biome.lon, biome.name), 1200);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full gap-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-primary/70" />
            <div>
              <div className="font-display text-[10px] tracking-[0.12em] text-foreground/90">PLANETARY BUDGET</div>
              <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest">regen capital · needed vs deployed</div>
            </div>
          </div>
          <div className="font-data text-[8px] text-muted-foreground/40 tracking-widest">{budgets.length} BIOMES</div>
        </div>

        {/* Global summary cards */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-muted/25 border border-border/25 rounded-sm p-2.5">
            <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">TOTAL NEEDED</div>
            <div className="font-display text-base font-bold text-foreground/90">{formatM(totalNeeded)}</div>
          </div>
          <div className="bg-healthy/8 border border-healthy/20 rounded-sm p-2.5">
            <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">DEPLOYED</div>
            <motion.div
              key={totalDeployed}
              initial={{ scale: 1.05, color: "hsl(142 70% 65%)" }}
              animate={{ scale: 1, color: "hsl(142 70% 45%)" }}
              className="font-display text-base font-bold text-healthy"
            >
              {formatM(totalDeployed)}
            </motion.div>
          </div>
          <div className="bg-critical/8 border border-critical/25 rounded-sm p-2.5">
            <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">FUNDING GAP</div>
            <div className="font-display text-base font-bold text-critical">{formatM(totalGap)}</div>
          </div>
        </div>

        {/* Global progress bar */}
        <div className="shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-data text-[7px] text-muted-foreground/50 tracking-widest">GLOBAL DEPLOYMENT RATE</span>
            <span className="font-data text-[9px] font-semibold text-healthy">{globalPct}%</span>
          </div>
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden border border-border/20">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-healthy/80 to-healthy"
              animate={{ width: `${globalPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Per-biome rows */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
          {budgets.map((b, idx) => {
            const pct = b.needed > 0 ? Math.round((b.deployed / b.needed) * 100) : 0;
            const gap = b.needed - b.deployed;
            const s = URGENCY_STYLES[b.urgency];
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="bg-muted/15 border border-border/20 rounded-sm px-2.5 py-2 hover:bg-muted/25 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm leading-none">{b.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-data text-[9px] text-foreground/80 truncate">{b.name}</div>
                    <div className="font-data text-[7px] text-muted-foreground/40 tracking-widest">{b.biome}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {b.trend === "declining" && <span className="font-data text-[7px] text-critical/60">↓</span>}
                    {b.trend === "rising"    && <span className="font-data text-[7px] text-healthy/60">↑</span>}
                    <span className={`font-data text-[8px] font-semibold ${s.text}`}>{pct}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-muted/30 rounded-full overflow-hidden mb-1.5">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${s.bar}`}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>

                {/* Numbers + Deploy */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-data text-[7px] text-muted-foreground/40">NEEDED:</span>
                    <span className="font-data text-[8px] text-foreground/60">{formatM(b.needed)}</span>
                    <span className="font-data text-[7px] text-muted-foreground/30">·</span>
                    <span className={`font-data text-[8px] ${b.deployed > 0 ? "text-healthy" : "text-muted-foreground/30"}`}>
                      {formatM(b.deployed)}
                    </span>
                    {gap > 0 && <AlertCircle className="w-2.5 h-2.5 text-critical/40 shrink-0" />}
                  </div>
                  {/* Deploy button */}
                  <button
                    onClick={() => setDeployTarget(b)}
                    className="ml-2 shrink-0 font-data text-[7px] tracking-widest border border-primary/25 text-primary/70 rounded-sm px-1.5 py-0.5 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all"
                  >
                    DEPLOY
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="shrink-0 flex items-center gap-1.5 pt-1 border-t border-border/20">
          <TrendingUp className="w-2.5 h-2.5 text-muted-foreground/30" />
          <span className="font-data text-[7px] text-muted-foreground/30 tracking-widest">
            REGEN CAPITAL TRACKER · UPDATED REAL-TIME · FY2024
          </span>
        </div>
      </div>

      {/* Deploy Modal */}
      <AnimatePresence>
        {deployTarget && (
          <DeployModal
            biome={deployTarget}
            onClose={() => setDeployTarget(null)}
            onDeploy={handleDeploy}
          />
        )}
      </AnimatePresence>
    </>
  );
}
