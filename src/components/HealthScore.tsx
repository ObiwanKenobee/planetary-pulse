import { useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, AlertTriangle, Wifi, Clock } from "lucide-react";
import type { VitalData } from "@/hooks/useRealtimeData";

interface HealthScoreProps {
  score: number; // 0-100
  vitals?: VitalData[];
}

export default function HealthScore({ score, vitals = [] }: HealthScoreProps) {
  const getScoreColor = (s: number) => {
    if (s >= 75) return "text-healthy";
    if (s >= 55) return "text-warning";
    return "text-critical";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 75) return "STABLE";
    if (s >= 55) return "STRESSED";
    return "CRITICAL";
  };

  const getScoreBarColor = (s: number) => {
    if (s >= 75) return "hsl(142 70% 45%)";
    if (s >= 55) return "hsl(38 95% 55%)";
    return "hsl(0 85% 60%)";
  };

  const systemTime = new Date().toISOString().replace("T", " ").split(".")[0] + " UTC";

  // Live subsystem bars derived from vitals if available, otherwise fallback
  const subsystems = useMemo(() => {
    if (vitals.length === 0) {
      return [
        { label: "CLIMATE",     pct: 64, status: "warning"  },
        { label: "BIOSPHERE",   pct: 74, status: "nominal"  },
        { label: "CRYOSPHERE",  pct: 48, status: "critical" },
        { label: "HYDROSPHERE", pct: 61, status: "warning"  },
        { label: "ATMOSPHERE",  pct: 56, status: "warning"  },
      ];
    }
    const map: Record<string, { label: string; ids: string[] }> = {
      CLIMATE:     { label: "CLIMATE",     ids: ["temp"] },
      BIOSPHERE:   { label: "BIOSPHERE",   ids: ["biodiversity", "vegetation"] },
      CRYOSPHERE:  { label: "CRYOSPHERE",  ids: [] },
      HYDROSPHERE: { label: "HYDROSPHERE", ids: ["freshwater", "ocean"] },
      ATMOSPHERE:  { label: "ATMOSPHERE",  ids: ["co2"] },
    };
    return Object.values(map).map(sys => {
      const related = vitals.filter(v => sys.ids.includes(v.id));
      if (related.length === 0) {
        return { label: sys.label, pct: 60, status: "warning" as const };
      }
      const avgProgress = related.reduce((sum, v) => sum + v.progress, 0) / related.length;
      // Invert progress for "bad = high" vitals (all our vitals go worse as pct rises)
      const health = Math.round(100 - avgProgress);
      const status = health < 40 ? "critical" : health < 65 ? "warning" : "nominal";
      return { label: sys.label, pct: health, status };
    });
  }, [vitals]);

  // Live alert count
  const criticalCount = vitals.filter(v => v.status === "critical").length;
  const warningCount  = vitals.filter(v => v.status === "warning").length;
  const alertText     = criticalCount > 0
    ? `${criticalCount} CRITICAL`
    : warningCount > 0
    ? `${warningCount} ALERTS`
    : null;
  const alertColor    = criticalCount > 0 ? "text-critical" : "text-warning";

  const statusBarColor = (s: string) =>
    s === "critical" ? "bg-critical" : s === "warning" ? "bg-warning" : "bg-nominal";

  const circumference = 100.53;

  return (
    <div className="flex items-center gap-5 w-full">
      {/* Logo & title */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <Globe className="w-8 h-8 text-primary" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-healthy border-2 border-background animate-pulse-dot" />
        </div>
        <div>
          <div className="font-display text-base font-bold tracking-[0.12em] text-foreground leading-tight text-glow-cyan">
            ATLAS
          </div>
          <div className="font-data text-[9px] tracking-[0.25em] text-muted-foreground">
            PLANETARY PULSE
          </div>
        </div>
      </div>

      <div className="w-px h-10 bg-border/60 shrink-0" />

      {/* Health score */}
      <div className="flex items-center gap-3 shrink-0">
        <div>
          <div className="font-data text-[9px] tracking-[0.2em] text-muted-foreground/70 mb-0.5">
            PLANETARY HEALTH INDEX
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={score}
              initial={{ opacity: 0.6, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`font-display text-3xl font-bold ${getScoreColor(score)}`}
            >
              {score}
            </motion.span>
            <span className="font-data text-xs text-muted-foreground">/100</span>
            <span className={`font-data text-[10px] font-semibold tracking-[0.15em] ${getScoreColor(score)} ml-1`}>
              {getScoreLabel(score)}
            </span>
          </div>
        </div>
        {/* Score arc */}
        <div className="relative w-10 h-10 shrink-0">
          <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
            <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(220 20% 14%)" strokeWidth="3" />
            <motion.circle
              cx="20" cy="20" r="16" fill="none"
              stroke={getScoreBarColor(score)}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
        </div>
      </div>

      <div className="w-px h-10 bg-border/60 shrink-0 hidden lg:block" />

      {/* Subsystem bars */}
      <div className="hidden lg:flex items-center gap-4 flex-1">
        {subsystems.map(sys => (
          <div key={sys.label} className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-data text-[8px] text-muted-foreground/60 tracking-widest">{sys.label}</span>
              <span className={`font-data text-[8px] ${
                sys.status === "critical" ? "text-critical" : sys.status === "warning" ? "text-warning" : "text-nominal"
              }`}>{sys.pct}%</span>
            </div>
            <div className="h-[3px] bg-muted rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${sys.pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full ${statusBarColor(sys.status)} rounded-full`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-3 ml-auto shrink-0">
        {alertText && (
          <div className="hidden xl:flex items-center gap-1.5">
            <AlertTriangle className={`w-3 h-3 ${alertColor}`} />
            <motion.span
              key={alertText}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`font-data text-[9px] ${alertColor} tracking-wider`}
            >
              {alertText}
            </motion.span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-nominal" />
          <span className="font-data text-[9px] text-nominal tracking-wider hidden xl:inline">STREAMS ACTIVE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="font-data text-[9px] text-muted-foreground tracking-wider hidden xl:inline">{systemTime}</span>
        </div>
      </div>
    </div>
  );
}
