import { motion } from "framer-motion";
import { Globe, AlertTriangle, Wifi, Clock } from "lucide-react";

interface HealthScoreProps {
  score: number; // 0-100
}

export default function HealthScore({ score }: HealthScoreProps) {
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
    if (s >= 75) return "bg-healthy";
    if (s >= 55) return "bg-warning";
    return "bg-critical";
  };

  const systemTime = new Date().toISOString().replace("T", " ").split(".")[0] + " UTC";

  const subsystems = [
    { label: "CLIMATE",    pct: 64, status: "warning"  },
    { label: "BIOSPHERE",  pct: 74, status: "nominal"  },
    { label: "CRYOSPHERE", pct: 48, status: "critical" },
    { label: "HYDROSPHERE",pct: 61, status: "warning"  },
    { label: "ATMOSPHERE", pct: 56, status: "warning"  },
  ];

  const statusBarColor = (s: string) =>
    s === "critical" ? "bg-critical" : s === "warning" ? "bg-warning" : "bg-nominal";

  return (
    <div className="flex items-center gap-6 w-full">
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

      {/* Divider */}
      <div className="w-px h-10 bg-border/60 shrink-0" />

      {/* Health score */}
      <div className="flex items-center gap-3 shrink-0">
        <div>
          <div className="font-data text-[9px] tracking-[0.2em] text-muted-foreground mb-0.5">
            PLANETARY HEALTH INDEX
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
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
        {/* Score arc mini */}
        <div className="relative w-10 h-10 shrink-0">
          <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
            <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(220 20% 14%)" strokeWidth="3" />
            <motion.circle
              cx="20" cy="20" r="16" fill="none"
              stroke={score >= 75 ? "hsl(142 70% 45%)" : score >= 55 ? "hsl(38 95% 55%)" : "hsl(0 85% 60%)"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${100.53} ${100.53}`}
              initial={{ strokeDashoffset: 100.53 }}
              animate={{ strokeDashoffset: 100.53 * (1 - score / 100) }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            />
          </svg>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-border/60 shrink-0 hidden lg:block" />

      {/* Subsystem bars */}
      <div className="hidden lg:flex items-center gap-4 flex-1">
        {subsystems.map(sys => (
          <div key={sys.label} className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-data text-[8px] text-muted-foreground tracking-widest">{sys.label}</span>
              <span className={`font-data text-[8px] ${
                sys.status === "critical" ? "text-critical" : sys.status === "warning" ? "text-warning" : "text-nominal"
              }`}>{sys.pct}%</span>
            </div>
            <div className="h-[3px] bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${sys.pct}%` }}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                className={`h-full ${statusBarColor(sys.status)} rounded-full`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-4 ml-auto shrink-0">
        <div className="hidden xl:flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-warning" />
          <span className="font-data text-[9px] text-warning tracking-wider">2 ALERTS</span>
        </div>
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
