import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, TrendingDown, Zap, Info } from "lucide-react";
import { useState } from "react";

interface Alert {
  id: string;
  system: string;
  region: string;
  message: string;
  risk: number; // 0-100
  severity: "high" | "medium" | "monitor";
  indicator: string;
  icon: string;
  timestamp: string;
}

const alerts: Alert[] = [
  {
    id: "amz",
    system: "Amazon Rainforest",
    region: "South America",
    message: "Resilience declining. Ecosystem transition probability rising.",
    risk: 78,
    severity: "high",
    indicator: "Recovery slowdown detected — variance ↑34%",
    icon: "🌿",
    timestamp: "14m ago",
  },
  {
    id: "ami",
    system: "Atlantic Meridional",
    region: "North Atlantic",
    message: "Circulation weakening beyond historical range. Tipping proximity elevated.",
    risk: 62,
    severity: "high",
    indicator: "Oscillation amplitude +2.3σ above baseline",
    icon: "🌊",
    timestamp: "31m ago",
  },
  {
    id: "ghis",
    system: "Greenland Ice Sheet",
    region: "Arctic",
    message: "Mass loss acceleration. Nonlinear melting signatures detected.",
    risk: 55,
    severity: "medium",
    indicator: "Feedback loop engagement probability: 42%",
    icon: "🧊",
    timestamp: "1h ago",
  },
  {
    id: "gbr",
    system: "Great Barrier Reef",
    region: "Western Pacific",
    message: "Thermal stress accumulation approaching bleaching threshold.",
    risk: 44,
    severity: "monitor",
    indicator: "SST anomaly +1.8°C sustained 6 weeks",
    icon: "🪸",
    timestamp: "2h ago",
  },
];

const severityConfig = {
  high:    { color: "text-critical", bg: "bg-critical/8",  border: "border-critical/25", badge: "bg-critical/15 text-critical" },
  medium:  { color: "text-warning",  bg: "bg-warning/8",   border: "border-warning/25",  badge: "bg-warning/15 text-warning"  },
  monitor: { color: "text-nominal",  bg: "bg-nominal/8",   border: "border-nominal/25",  badge: "bg-nominal/15 text-nominal"  },
};

export default function TippingPointAlerts() {
  const [expanded, setExpanded] = useState<string | null>("amz");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-critical" />
          <span className="font-display text-[10px] tracking-[0.2em] text-foreground/80">
            TIPPING POINT DETECTOR
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-data text-[9px] text-critical animate-pulse-dot">2 HIGH RISK</span>
          <div className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse-dot" />
        </div>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {alerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          const isExpanded = expanded === alert.id;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`rounded-sm border ${cfg.border} ${cfg.bg} overflow-hidden cursor-pointer`}
              onClick={() => setExpanded(isExpanded ? null : alert.id)}
            >
              <div className="flex items-start gap-2 p-2.5">
                <span className="text-base leading-none mt-0.5 shrink-0">{alert.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-data text-[10px] font-semibold tracking-wide ${cfg.color}`}>
                      {alert.system}
                    </span>
                    <span className={`font-data text-[8px] px-1.5 py-0.5 rounded-sm ${cfg.badge} uppercase tracking-widest`}>
                      {alert.severity}
                    </span>
                    <span className="font-data text-[8px] text-muted-foreground/50 ml-auto">{alert.timestamp}</span>
                  </div>
                  <div className="font-body text-[10px] text-muted-foreground leading-relaxed">
                    {alert.message}
                  </div>
                </div>
                {/* Risk gauge */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className={`font-display text-sm font-bold ${cfg.color}`}>{alert.risk}</div>
                  <div className="font-data text-[7px] text-muted-foreground/50">RISK</div>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2.5 pb-2.5 pt-0 border-t border-border/30 mt-0">
                      <div className="flex items-start gap-1.5 mt-2">
                        <TrendingDown className={`w-3 h-3 ${cfg.color} shrink-0 mt-0.5`} />
                        <div className="font-data text-[9px] text-muted-foreground leading-relaxed">
                          {alert.indicator}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Info className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        <div className="font-data text-[8px] text-muted-foreground/50">
                          REGION: {alert.region} · MONITORING INTENSITY: HIGH
                        </div>
                      </div>
                      {/* Risk bar */}
                      <div className="mt-2">
                        <div className="flex justify-between mb-1">
                          <span className="font-data text-[8px] text-muted-foreground/60">TIPPING PROXIMITY</span>
                          <span className={`font-data text-[8px] ${cfg.color}`}>{alert.risk}%</span>
                        </div>
                        <div className="h-1 bg-muted rounded-full">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${alert.risk}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={`h-full rounded-full ${alert.severity === "high" ? "bg-critical" : alert.severity === "medium" ? "bg-warning" : "bg-nominal"}`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
