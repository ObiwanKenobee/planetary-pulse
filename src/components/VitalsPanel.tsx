import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

export type VitalStatus = "healthy" | "warning" | "critical" | "nominal";

export interface Vital {
  id: string;
  label: string;
  value: string;
  unit: string;
  baseline: string;
  trend: "up" | "down" | "stable";
  trendPositive: boolean; // is this trend direction good?
  status: VitalStatus;
  description: string;
  progress: number; // 0-100
}

const vitals: Vital[] = [
  {
    id: "temp",
    label: "TEMPERATURE ANOMALY",
    value: "+1.47",
    unit: "°C",
    baseline: "±0.0 pre-industrial",
    trend: "up",
    trendPositive: false,
    status: "warning",
    description: "Global surface mean departure",
    progress: 72,
  },
  {
    id: "biodiversity",
    label: "BIODIVERSITY INDEX",
    value: "63.4",
    unit: "%",
    baseline: "100% — 1970 baseline",
    trend: "down",
    trendPositive: false,
    status: "warning",
    description: "Living Planet Index score",
    progress: 63,
  },
  {
    id: "ocean",
    label: "OCEAN HEAT CONTENT",
    value: "287.4",
    unit: "ZJ",
    baseline: "1955-2006 mean",
    trend: "up",
    trendPositive: false,
    status: "critical",
    description: "0–2000m depth integrated",
    progress: 88,
  },
  {
    id: "co2",
    label: "ATMOSPHERIC CO₂",
    value: "424.5",
    unit: "ppm",
    baseline: "280 ppm pre-industrial",
    trend: "up",
    trendPositive: false,
    status: "critical",
    description: "Mauna Loa monthly mean",
    progress: 82,
  },
  {
    id: "vegetation",
    label: "GLOBAL VEGETATION",
    value: "78.2",
    unit: "%",
    baseline: "100% — 1990 baseline",
    trend: "stable",
    trendPositive: true,
    status: "nominal",
    description: "NDVI normalized density index",
    progress: 78,
  },
  {
    id: "freshwater",
    label: "FRESHWATER STRESS",
    value: "HIGH",
    unit: "",
    baseline: "LOW — nominal",
    trend: "up",
    trendPositive: false,
    status: "warning",
    description: "Population under water stress",
    progress: 65,
  },
];

const statusConfig = {
  healthy:  { color: "text-healthy", bar: "bg-healthy",  glow: "shadow-glow-green", border: "border-healthy/20",  bg: "bg-healthy/5" },
  warning:  { color: "text-warning", bar: "bg-warning",  glow: "shadow-glow-amber", border: "border-warning/20",  bg: "bg-warning/5" },
  critical: { color: "text-critical",bar: "bg-critical", glow: "shadow-glow-red",   border: "border-critical/20", bg: "bg-critical/5" },
  nominal:  { color: "text-nominal", bar: "bg-nominal",  glow: "shadow-glow-cyan",  border: "border-nominal/20",  bg: "bg-nominal/5" },
};

function TrendIcon({ trend, positive }: { trend: string; positive: boolean }) {
  const color = positive
    ? trend === "up" ? "text-healthy" : trend === "down" ? "text-critical" : "text-muted-foreground"
    : trend === "down" ? "text-healthy" : trend === "up" ? "text-critical" : "text-muted-foreground";

  if (trend === "up")     return <TrendingUp   className={`w-3 h-3 ${color}`} />;
  if (trend === "down")   return <TrendingDown className={`w-3 h-3 ${color}`} />;
  return <Minus className={`w-3 h-3 ${color}`} />;
}

function VitalCard({ vital, index }: { vital: Vital; index: number }) {
  const cfg = statusConfig[vital.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className={`relative rounded-sm border ${cfg.border} ${cfg.bg} p-3 overflow-hidden`}
    >
      {/* Subtle left bar accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${cfg.bar}`} />

      <div className="flex items-start justify-between mb-1.5 pl-2">
        <div>
          <div className="font-data text-[9px] tracking-[0.18em] text-muted-foreground mb-0.5">
            {vital.label}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-display text-xl font-bold ${cfg.color} text-glow-cyan`}>
              {vital.value}
            </span>
            <span className="font-data text-xs text-muted-foreground">{vital.unit}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {/* Status dot */}
          <span className={`relative flex h-2 w-2`}>
            <span className={`animate-ping-slow absolute inline-flex h-full w-full rounded-full ${cfg.bar} opacity-60`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.bar}`} />
          </span>
          <TrendIcon trend={vital.trend} positive={vital.trendPositive} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="pl-2 mb-1.5">
        <div className="h-[3px] bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${vital.progress}%` }}
            transition={{ delay: index * 0.08 + 0.3, duration: 0.8, ease: "easeOut" }}
            className={`h-full ${cfg.bar} rounded-full`}
          />
        </div>
      </div>

      <div className="pl-2 flex items-center justify-between">
        <span className="font-data text-[9px] text-muted-foreground/70">{vital.description}</span>
        <span className="font-data text-[9px] text-muted-foreground/50">{vital.baseline}</span>
      </div>
    </motion.div>
  );
}

export default function VitalsPanel() {
  const criticalCount = vitals.filter(v => v.status === "critical").length;

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="font-display text-[10px] tracking-[0.2em] text-foreground/80">
            PLANETARY VITALS
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {criticalCount > 0 && (
            <span className="font-data text-[9px] text-critical animate-pulse-dot">
              {criticalCount} CRITICAL
            </span>
          )}
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
        </div>
      </div>

      {/* Vitals list */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
        {vitals.map((vital, i) => (
          <VitalCard key={vital.id} vital={vital} index={i} />
        ))}
      </div>
    </div>
  );
}
