import { motion } from "framer-motion";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";

interface BiomeBudget {
  id: string;
  name: string;
  biome: string;
  icon: string;
  needed: number;   // $M
  deployed: number; // $M
  urgency: "critical" | "high" | "moderate";
  trend: "rising" | "stable" | "declining";
}

const BUDGETS: BiomeBudget[] = [
  { id: "amz",  name: "Amazon Basin",         biome: "Tropical Forest",  icon: "🌿", needed: 2400,  deployed: 142,  urgency: "critical", trend: "rising"   },
  { id: "arc",  name: "Arctic Ocean",          biome: "Polar / Cryo",    icon: "🧊", needed: 800,   deployed: 0,    urgency: "critical", trend: "declining"},
  { id: "reef", name: "Great Barrier Reef",    biome: "Marine / Reef",   icon: "🪸", needed: 340,   deployed: 27,   urgency: "critical", trend: "rising"   },
  { id: "sah",  name: "Sahel Region",          biome: "Semi-arid",       icon: "🌵", needed: 560,   deployed: 38,   urgency: "high",     trend: "rising"   },
  { id: "con",  name: "Congo Basin",           biome: "Tropical Forest", icon: "🌳", needed: 780,   deployed: 54,   urgency: "high",     trend: "stable"   },
  { id: "perm", name: "Siberian Permafrost",   biome: "Boreal / Tundra", icon: "🏔️", needed: 1200,  deployed: 0,    urgency: "high",     trend: "declining"},
  { id: "wais", name: "West Antarctica",       biome: "Polar Ice Sheet", icon: "❄️", needed: 2100,  deployed: 0,    urgency: "critical", trend: "declining"},
  { id: "amoc", name: "North Atlantic",        biome: "Ocean Current",   icon: "🌊", needed: 450,   deployed: 0,    urgency: "high",     trend: "stable"   },
  { id: "sea",  name: "Southeast Asia",        biome: "Peatland",        icon: "🌴", needed: 380,   deployed: 31,   urgency: "moderate", trend: "rising"   },
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

export default function PlanetaryBudget() {
  const totalNeeded   = BUDGETS.reduce((s, b) => s + b.needed, 0);
  const totalDeployed = BUDGETS.reduce((s, b) => s + b.deployed, 0);
  const totalGap      = totalNeeded - totalDeployed;
  const globalPct     = Math.round((totalDeployed / totalNeeded) * 100 * 10) / 10;

  return (
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
        <div className="font-data text-[8px] text-muted-foreground/40 tracking-widest">
          {BUDGETS.length} BIOMES
        </div>
      </div>

      {/* Global summary cards */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        <div className="bg-muted/25 border border-border/25 rounded-sm p-2.5">
          <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">TOTAL NEEDED</div>
          <div className="font-display text-base font-bold text-foreground/90">{formatM(totalNeeded)}</div>
        </div>
        <div className="bg-healthy/8 border border-healthy/20 rounded-sm p-2.5">
          <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">DEPLOYED</div>
          <div className="font-display text-base font-bold text-healthy">{formatM(totalDeployed)}</div>
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
            initial={{ width: 0 }}
            animate={{ width: `${globalPct}%` }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Per-biome rows */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
        {BUDGETS.map((b, idx) => {
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
                  {b.trend === "declining" && (
                    <span className="font-data text-[7px] text-critical/60">↓</span>
                  )}
                  {b.trend === "rising" && (
                    <span className="font-data text-[7px] text-healthy/60">↑</span>
                  )}
                  <span className={`font-data text-[8px] font-semibold ${s.text}`}>{pct}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-muted/30 rounded-full overflow-hidden mb-1.5">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${s.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, delay: idx * 0.05 + 0.2, ease: "easeOut" }}
                />
              </div>

              {/* Numbers */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-data text-[7px] text-muted-foreground/40">NEEDED:</span>
                  <span className="font-data text-[8px] text-foreground/60">{formatM(b.needed)}</span>
                  <span className="font-data text-[7px] text-muted-foreground/30">·</span>
                  <span className="font-data text-[7px] text-muted-foreground/40">DEPLOYED:</span>
                  <span className={`font-data text-[8px] ${b.deployed > 0 ? "text-healthy" : "text-muted-foreground/30"}`}>
                    {formatM(b.deployed)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {gap > 0 && <AlertCircle className="w-2.5 h-2.5 text-critical/40" />}
                  <span className={`font-data text-[7px] ${gap > 0 ? "text-critical/60" : "text-healthy/60"}`}>
                    {gap > 0 ? `−${formatM(gap)}` : "FUNDED"}
                  </span>
                </div>
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
  );
}
