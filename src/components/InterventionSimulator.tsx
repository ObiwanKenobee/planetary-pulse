import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FlaskConical, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

/* ─── Biome definitions with response multipliers ─────────── */
interface Biome {
  id: string;
  name: string;
  icon: string;
  maxFunding: number;    // $M slider max
  scoreImpact: number;  // health score points at max funding (2050)
  lag2030: number;      // fraction of full impact by 2030
  lag2040: number;      // fraction of full impact by 2040
  urgency: "critical" | "high" | "moderate";
}

const BIOMES: Biome[] = [
  { id: "amz",  name: "Amazon Reforestation",  icon: "🌿", maxFunding: 2400, scoreImpact: 7.2, lag2030: 0.12, lag2040: 0.45, urgency: "critical" },
  { id: "arc",  name: "Arctic Methane Capture", icon: "🧊", maxFunding: 800,  scoreImpact: 5.8, lag2030: 0.08, lag2040: 0.30, urgency: "critical" },
  { id: "amoc", name: "AMOC Monitoring",         icon: "🌊", maxFunding: 450,  scoreImpact: 3.1, lag2030: 0.25, lag2040: 0.60, urgency: "high"     },
  { id: "reef", name: "Reef Restoration",        icon: "🪸", maxFunding: 340,  scoreImpact: 2.4, lag2030: 0.30, lag2040: 0.65, urgency: "high"     },
  { id: "perm", name: "Permafrost Stabilisation",icon: "🏔️", maxFunding: 1200, scoreImpact: 4.6, lag2030: 0.05, lag2040: 0.22, urgency: "high"     },
  { id: "sah",  name: "Sahel Regreening",        icon: "🌵", maxFunding: 560,  scoreImpact: 2.8, lag2030: 0.35, lag2040: 0.70, urgency: "moderate" },
  { id: "wais", name: "WAIS Monitoring",         icon: "❄️", maxFunding: 2100, scoreImpact: 6.0, lag2030: 0.04, lag2040: 0.15, urgency: "critical" },
];

const BASE_SCORE_2024 = 60;

const URGENCY_COLOR: Record<string, string> = {
  critical: "text-critical",
  high:     "text-warning",
  moderate: "text-nominal",
};

const URGENCY_TRACK: Record<string, string> = {
  critical: "bg-critical",
  high:     "bg-warning",
  moderate: "bg-nominal",
};

function formatM(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}B`;
  return val === 0 ? "$0" : `$${Math.round(val)}M`;
}

function scoreDelta(biome: Biome, funding: number, year: 2030 | 2040 | 2050): number {
  const frac = biome.maxFunding > 0 ? funding / biome.maxFunding : 0;
  const lagFrac = year === 2030 ? biome.lag2030 : year === 2040 ? biome.lag2040 : 1.0;
  return biome.scoreImpact * frac * lagFrac;
}

function scoreFor(funding: Record<string, number>, year: 2030 | 2040 | 2050): number {
  const delta = BIOMES.reduce((sum, b) => sum + scoreDelta(b, funding[b.id] ?? 0, year), 0);
  return Math.min(100, Math.round((BASE_SCORE_2024 + delta) * 10) / 10);
}

function ScoreBar({ score, year }: { score: number; year: string }) {
  const color = score >= 70 ? "bg-gradient-to-r from-healthy/80 to-healthy"
               : score >= 50 ? "bg-gradient-to-r from-warning/80 to-warning"
               : "bg-gradient-to-r from-critical/80 to-critical";
  const textColor = score >= 70 ? "text-healthy" : score >= 50 ? "text-warning" : "text-critical";
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-data text-[8px] text-muted-foreground/60 tracking-widest">{year}</span>
        <span className={`font-display text-lg font-bold ${textColor}`}>{score}</span>
      </div>
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden border border-border/20">
        <motion.div
          className={`h-full rounded-full ${color}`}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface Props {
  onClose?: () => void;
}

export default function InterventionSimulator({ onClose }: Props) {
  const [funding, setFunding] = useState<Record<string, number>>(() =>
    Object.fromEntries(BIOMES.map(b => [b.id, 0]))
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  const scores = useMemo(() => ({
    s2030: scoreFor(funding, 2030),
    s2040: scoreFor(funding, 2040),
    s2050: scoreFor(funding, 2050),
  }), [funding]);

  const totalFunding = Object.values(funding).reduce((a, b) => a + b, 0);

  const delta2050 = +(scores.s2050 - BASE_SCORE_2024).toFixed(1);

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-primary/70" />
          <div>
            <div className="font-display text-[10px] tracking-[0.12em] text-foreground/90">INTERVENTION SIMULATOR</div>
            <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest">drag sliders · see projected health</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-data text-[8px] text-muted-foreground/40 tracking-widest">{formatM(totalFunding)} COMMITTED</span>
        </div>
      </div>

      {/* Projected scores */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        {([
          { label: "2030", score: scores.s2030 },
          { label: "2040", score: scores.s2040 },
          { label: "2050", score: scores.s2050 },
        ] as const).map(({ label, score }) => (
          <div key={label} className="bg-muted/15 border border-border/20 rounded-sm px-2 py-2">
            <ScoreBar score={score} year={label} />
          </div>
        ))}
      </div>

      {/* Delta indicator */}
      <div className="shrink-0 flex items-center gap-2">
        <TrendingUp className="w-3 h-3 text-healthy/60" />
        <span className="font-data text-[8px] text-muted-foreground/50 tracking-widest">
          2050 IMPACT:
        </span>
        <span className={`font-display text-sm font-bold ${delta2050 > 0 ? "text-healthy" : "text-muted-foreground/40"}`}>
          {delta2050 > 0 ? `+${delta2050}` : delta2050} pts
        </span>
        <span className="font-data text-[7px] text-muted-foreground/30 tracking-widest">vs baseline {BASE_SCORE_2024}</span>
      </div>

      {/* Biome sliders */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
        {BIOMES.map((biome) => {
          const val = funding[biome.id] ?? 0;
          const pct = biome.maxFunding > 0 ? val / biome.maxFunding : 0;
          const delta50 = scoreDelta(biome, val, 2050);
          const isExpanded = expanded === biome.id;

          return (
            <div
              key={biome.id}
              className="bg-muted/12 border border-border/20 rounded-sm px-2.5 py-2 transition-colors"
            >
              {/* Row header */}
              <button
                className="w-full flex items-center gap-2 mb-2"
                onClick={() => setExpanded(isExpanded ? null : biome.id)}
              >
                <span className="text-sm leading-none">{biome.icon}</span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-data text-[9px] text-foreground/80 truncate">{biome.name}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`font-display text-[9px] font-bold ${URGENCY_COLOR[biome.urgency]}`}>
                    {formatM(val)}
                  </span>
                  {delta50 > 0 && (
                    <span className="font-data text-[7px] text-healthy/70">+{delta50.toFixed(1)}</span>
                  )}
                  {isExpanded
                    ? <ChevronUp className="w-2.5 h-2.5 text-muted-foreground/40" />
                    : <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/40" />
                  }
                </div>
              </button>

              {/* Slider track */}
              <div className="relative h-3 flex items-center group">
                {/* Track */}
                <div className="w-full h-1 bg-muted/30 rounded-full relative overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${URGENCY_TRACK[biome.urgency]} opacity-70`}
                    animate={{ width: `${pct * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                {/* Native range input overlay */}
                <input
                  type="range"
                  min={0}
                  max={biome.maxFunding}
                  step={10}
                  value={val}
                  onChange={e => setFunding(prev => ({ ...prev, [biome.id]: +e.target.value }))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-3"
                  style={{ zIndex: 2 }}
                />
                {/* Thumb indicator */}
                <motion.div
                  className="absolute w-3 h-3 rounded-full border-2 border-background pointer-events-none"
                  style={{ left: `calc(${pct * 100}% - 6px)` }}
                  animate={{ backgroundColor: pct > 0 ? "hsl(185 100% 50%)" : "hsl(220 20% 25%)" }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 pt-2 border-t border-border/20 grid grid-cols-3 gap-1.5"
                >
                  {([2030, 2040, 2050] as const).map(yr => {
                    const d = scoreDelta(biome, val, yr);
                    return (
                      <div key={yr} className="bg-muted/20 rounded-sm p-1.5 text-center">
                        <div className="font-data text-[7px] text-muted-foreground/40 tracking-widest">{yr}</div>
                        <div className={`font-display text-sm font-bold ${d > 0 ? "text-healthy" : "text-muted-foreground/30"}`}>
                          {d > 0 ? `+${d.toFixed(1)}` : "—"}
                        </div>
                        <div className="font-data text-[6px] text-muted-foreground/30">pts</div>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* Tier quick-set buttons */}
              <div className="flex gap-1 mt-1.5">
                {[0.1, 0.25, 0.5, 1.0].map(frac => {
                  const amt = Math.round(biome.maxFunding * frac / 10) * 10;
                  return (
                    <button
                      key={frac}
                      onClick={() => setFunding(prev => ({ ...prev, [biome.id]: amt }))}
                      className={`flex-1 font-data text-[6px] tracking-widest rounded-sm py-0.5 border transition-all ${
                        Math.abs(val - amt) < 5
                          ? "border-primary/40 text-primary bg-primary/10"
                          : "border-border/20 text-muted-foreground/30 hover:border-border/50 hover:text-muted-foreground/60"
                      }`}
                    >
                      {Math.round(frac * 100)}%
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center gap-1.5 pt-1 border-t border-border/20">
        <span className="font-data text-[7px] text-muted-foreground/30 tracking-widest">
          SIMPLE MULTIPLIER MODEL · LAG-ADJUSTED · NOT PEER-REVIEWED
        </span>
      </div>
    </div>
  );
}
