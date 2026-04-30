import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FlaskConical, TrendingUp, ChevronDown, ChevronUp, Columns, Download, FileJson, FileText } from "lucide-react";

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

/* Baseline projection (no intervention) — slight passive decline */
const BASELINE_TRAJECTORY = { 2030: 57, 2040: 52, 2050: 46 } as const;

function ScoreBar({ score, year, max = 100 }: { score: number; year: string; max?: number }) {
  const pct = (score / max) * 100;
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
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface Props {
  onClose?: () => void;
}

type Mode = "sliders" | "compare";

export default function InterventionSimulator({ onClose }: Props) {
  const [funding, setFunding] = useState<Record<string, number>>(() =>
    Object.fromEntries(BIOMES.map(b => [b.id, 0]))
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("sliders");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const scores = useMemo(() => ({
    s2030: scoreFor(funding, 2030),
    s2040: scoreFor(funding, 2040),
    s2050: scoreFor(funding, 2050),
  }), [funding]);

  const totalFunding = Object.values(funding).reduce((a, b) => a + b, 0);
  const delta2050 = +(scores.s2050 - BASE_SCORE_2024).toFixed(1);

  /* ─── Export builders ─────────────────────────────── */
  const buildTextReport = (): string => {
    const ts = new Date().toISOString();
    const lines = [
      "═══════════════════════════════════════════════════════════",
      "  PLANETARY PULSE ATLAS · INTERVENTION SIMULATOR REPORT",
      "═══════════════════════════════════════════════════════════",
      `  Generated:        ${ts}`,
      `  Baseline (2024):  ${BASE_SCORE_2024}`,
      `  Total Committed:  ${formatM(totalFunding)}`,
      "",
      "── PROJECTED HEALTH SCORES ────────────────────────────────",
      `  2030:  ${scores.s2030.toFixed(1)}   (baseline ${BASELINE_TRAJECTORY[2030]}, Δ ${(scores.s2030 - BASELINE_TRAJECTORY[2030]).toFixed(1)})`,
      `  2040:  ${scores.s2040.toFixed(1)}   (baseline ${BASELINE_TRAJECTORY[2040]}, Δ ${(scores.s2040 - BASELINE_TRAJECTORY[2040]).toFixed(1)})`,
      `  2050:  ${scores.s2050.toFixed(1)}   (baseline ${BASELINE_TRAJECTORY[2050]}, Δ ${(scores.s2050 - BASELINE_TRAJECTORY[2050]).toFixed(1)})`,
      "",
      "── FUNDING ALLOCATIONS ────────────────────────────────────",
    ];
    BIOMES.forEach(b => {
      const v = funding[b.id] ?? 0;
      const pct = b.maxFunding > 0 ? Math.round((v / b.maxFunding) * 100) : 0;
      lines.push(`  ${b.icon}  ${b.name.padEnd(28)}  ${formatM(v).padStart(7)}  /  ${formatM(b.maxFunding).padStart(7)}   (${pct}%)   urgency: ${b.urgency}`);
    });
    lines.push("");
    lines.push("── METHODOLOGY ────────────────────────────────────────────");
    lines.push("  Simple multiplier model. Lag-adjusted by biome response curve.");
    lines.push("  Not peer-reviewed. For directional planning only.");
    lines.push("═══════════════════════════════════════════════════════════");
    return lines.join("\n");
  };

  const buildJsonReport = () => ({
    generatedAt: new Date().toISOString(),
    baselineScore2024: BASE_SCORE_2024,
    totalCommittedUsdM: totalFunding,
    projectedScores: {
      "2030": scores.s2030,
      "2040": scores.s2040,
      "2050": scores.s2050,
    },
    baselineTrajectory: BASELINE_TRAJECTORY,
    delta: {
      "2030": +(scores.s2030 - BASELINE_TRAJECTORY[2030]).toFixed(2),
      "2040": +(scores.s2040 - BASELINE_TRAJECTORY[2040]).toFixed(2),
      "2050": +(scores.s2050 - BASELINE_TRAJECTORY[2050]).toFixed(2),
    },
    allocations: BIOMES.map(b => ({
      id: b.id,
      name: b.name,
      urgency: b.urgency,
      committedUsdM: funding[b.id] ?? 0,
      maxUsdM: b.maxFunding,
      pctOfMax: b.maxFunding > 0 ? Math.round(((funding[b.id] ?? 0) / b.maxFunding) * 100) : 0,
      projectedDelta: {
        "2030": +scoreDelta(b, funding[b.id] ?? 0, 2030).toFixed(2),
        "2040": +scoreDelta(b, funding[b.id] ?? 0, 2040).toFixed(2),
        "2050": +scoreDelta(b, funding[b.id] ?? 0, 2050).toFixed(2),
      },
    })),
    methodology: "Simple lag-adjusted multiplier model. Not peer-reviewed.",
  });

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (kind: "txt" | "json") => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    if (kind === "txt") {
      downloadFile(`intervention-report-${stamp}.txt`, buildTextReport(), "text/plain");
    } else {
      downloadFile(`intervention-report-${stamp}.json`, JSON.stringify(buildJsonReport(), null, 2), "application/json");
    }
    setExportMenuOpen(false);
  };

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
        <div className="flex items-center gap-1.5">
          {/* Mode toggle */}
          <button
            onClick={() => setMode(m => m === "sliders" ? "compare" : "sliders")}
            className={`flex items-center gap-1 font-data text-[8px] tracking-widest border rounded-sm px-1.5 py-1 transition-all ${
              mode === "compare"
                ? "border-primary/40 text-primary bg-primary/10"
                : "border-border/30 text-muted-foreground/60 hover:border-border/60"
            }`}
            title="Compare baseline vs funded scenario"
          >
            <Columns className="w-2.5 h-2.5" />
            COMPARE
          </button>
          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(o => !o)}
              className="flex items-center gap-1 font-data text-[8px] tracking-widest border border-healthy/30 text-healthy rounded-sm px-1.5 py-1 hover:bg-healthy/10 transition-all"
              title="Export report"
            >
              <Download className="w-2.5 h-2.5" />
              EXPORT
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 panel-glass rounded-sm shadow-panel border border-border/40 overflow-hidden">
                <button
                  onClick={() => handleExport("txt")}
                  className="flex items-center gap-2 w-full px-3 py-1.5 font-data text-[9px] tracking-widest text-foreground/80 hover:bg-muted/30 transition-colors whitespace-nowrap"
                >
                  <FileText className="w-3 h-3" /> .TXT report
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="flex items-center gap-2 w-full px-3 py-1.5 font-data text-[9px] tracking-widest text-foreground/80 hover:bg-muted/30 transition-colors whitespace-nowrap border-t border-border/20"
                >
                  <FileJson className="w-3 h-3" /> .JSON data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Total committed strip */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-healthy/60" />
          <span className="font-data text-[8px] text-muted-foreground/50 tracking-widest">2050 IMPACT:</span>
          <span className={`font-display text-sm font-bold ${delta2050 > 0 ? "text-healthy" : "text-muted-foreground/40"}`}>
            {delta2050 > 0 ? `+${delta2050}` : delta2050} pts
          </span>
        </div>
        <span className="font-data text-[8px] text-muted-foreground/40 tracking-widest">{formatM(totalFunding)} COMMITTED</span>
      </div>

      {/* ─── COMPARE MODE ─── */}
      {mode === "compare" ? (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          <div className="grid grid-cols-[60px_1fr_1fr_60px] gap-2 px-1 shrink-0">
            <span className="font-data text-[7px] text-muted-foreground/40 tracking-widest">YEAR</span>
            <span className="font-data text-[7px] text-muted-foreground/40 tracking-widest text-center">BASELINE</span>
            <span className="font-data text-[7px] text-muted-foreground/40 tracking-widest text-center">FUNDED</span>
            <span className="font-data text-[7px] text-muted-foreground/40 tracking-widest text-right">Δ</span>
          </div>
          {([
            { year: 2030, base: BASELINE_TRAJECTORY[2030], funded: scores.s2030 },
            { year: 2040, base: BASELINE_TRAJECTORY[2040], funded: scores.s2040 },
            { year: 2050, base: BASELINE_TRAJECTORY[2050], funded: scores.s2050 },
          ] as const).map(({ year, base, funded }) => {
            const diff = +(funded - base).toFixed(1);
            const diffColor = diff > 5 ? "text-healthy" : diff > 1 ? "text-nominal" : diff < -1 ? "text-critical" : "text-muted-foreground/50";
            return (
              <div key={year} className="bg-muted/15 border border-border/20 rounded-sm px-2 py-2">
                <div className="grid grid-cols-[60px_1fr_1fr_60px] gap-2 items-center">
                  <span className="font-display text-[11px] text-foreground/80 tracking-widest">{year}</span>
                  <div className="bg-muted/20 rounded-sm p-1.5">
                    <ScoreBar score={base} year="" />
                  </div>
                  <div className="bg-healthy/5 border border-healthy/15 rounded-sm p-1.5">
                    <ScoreBar score={funded} year="" />
                  </div>
                  <span className={`font-display text-sm font-bold text-right ${diffColor}`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="shrink-0 mt-1 px-2 py-1.5 bg-muted/10 rounded-sm border border-border/15">
            <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest leading-relaxed">
              BASELINE assumes no new commitments and a passive decline trajectory.
              FUNDED applies your slider allocations through the lag-adjusted multiplier model.
            </div>
          </div>
        </div>
      ) : (
        <>
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
                    <div className="w-full h-1 bg-muted/30 rounded-full relative overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${URGENCY_TRACK[biome.urgency]} opacity-70`}
                        animate={{ width: `${pct * 100}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
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
                    <motion.div
                      className="absolute w-3 h-3 rounded-full border-2 border-background pointer-events-none"
                      style={{ left: `calc(${pct * 100}% - 6px)` }}
                      animate={{ backgroundColor: pct > 0 ? "hsl(185 100% 50%)" : "hsl(220 20% 25%)" }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>

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
        </>
      )}

      {/* Footer */}
      <div className="shrink-0 flex items-center gap-1.5 pt-1 border-t border-border/20">
        <span className="font-data text-[7px] text-muted-foreground/30 tracking-widest">
          SIMPLE MULTIPLIER MODEL · LAG-ADJUSTED · NOT PEER-REVIEWED
        </span>
      </div>
    </div>
  );
}
