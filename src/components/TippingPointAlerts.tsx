import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, Zap, Info, ChevronRight } from "lucide-react";
import type { Alert } from "@/components/TippingPointModal";

const severityConfig = {
  high:    { color: "text-critical", bg: "bg-critical/8",  border: "border-critical/25", badge: "bg-critical/15 text-critical" },
  medium:  { color: "text-warning",  bg: "bg-warning/8",   border: "border-warning/25",  badge: "bg-warning/15 text-warning"  },
  monitor: { color: "text-nominal",  bg: "bg-nominal/8",   border: "border-nominal/25",  badge: "bg-nominal/15 text-nominal"  },
};

interface TippingPointAlertsProps {
  alerts: Alert[];
  onAlertClick: (id: string) => void;
}

export default function TippingPointAlerts({ alerts, onAlertClick }: TippingPointAlertsProps) {
  const highCount = alerts.filter(a => a.severity === "high").length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-critical" />
          <span className="font-display text-[10px] tracking-[0.2em] text-foreground/80">TIPPING POINT DETECTOR</span>
        </div>
        <div className="flex items-center gap-1.5">
          {highCount > 0 && (
            <span className="font-data text-[9px] text-critical animate-pulse-dot">{highCount} HIGH RISK</span>
          )}
          <div className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse-dot" />
        </div>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {alerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`rounded-sm border ${cfg.border} ${cfg.bg} overflow-hidden cursor-pointer group hover:brightness-110 transition-all duration-200`}
              onClick={() => onAlertClick(alert.id)}
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
                  <div className="font-body text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                    {alert.message}
                  </div>
                  <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/50" />
                    <span className="font-data text-[8px] text-muted-foreground/50">CLICK FOR SIGNAL ANALYSIS</span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-center">
                  <div className={`font-display text-sm font-bold ${cfg.color}`}>{alert.risk}</div>
                  <div className="font-data text-[7px] text-muted-foreground/50">RISK</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
