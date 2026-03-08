import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import type { VitalData, VitalStatus } from "@/hooks/useRealtimeData";

const statusConfig: Record<VitalStatus, { color: string; bar: string; border: string; bg: string }> = {
  healthy:  { color: "text-healthy", bar: "bg-healthy",  border: "border-healthy/20",  bg: "bg-healthy/5" },
  warning:  { color: "text-warning", bar: "bg-warning",  border: "border-warning/20",  bg: "bg-warning/5" },
  critical: { color: "text-critical",bar: "bg-critical", border: "border-critical/20", bg: "bg-critical/5" },
  nominal:  { color: "text-nominal", bar: "bg-nominal",  border: "border-nominal/20",  bg: "bg-nominal/5" },
};

function TrendIcon({ trend, positive }: { trend: string; positive: boolean }) {
  const color = positive
    ? (trend === "up" ? "text-healthy" : trend === "down" ? "text-critical" : "text-muted-foreground")
    : (trend === "down" ? "text-healthy" : trend === "up" ? "text-critical" : "text-muted-foreground");
  if (trend === "up")   return <TrendingUp   className={`w-3 h-3 ${color}`} />;
  if (trend === "down") return <TrendingDown className={`w-3 h-3 ${color}`} />;
  return <Minus className={`w-3 h-3 ${color}`} />;
}

function VitalCard({ vital, index }: { vital: VitalData; index: number }) {
  const cfg = statusConfig[vital.status];
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
      className={`relative rounded-sm border ${cfg.border} ${cfg.bg} p-3 overflow-hidden`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${cfg.bar}`} />

      <div className="flex items-start justify-between mb-1.5 pl-2">
        <div>
          <div className="font-data text-[9px] tracking-[0.18em] text-muted-foreground mb-0.5">
            {vital.label}
          </div>
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={vital.displayValue}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              className={`font-display text-xl font-bold ${cfg.color}`}
            >
              {vital.displayValue}
            </motion.span>
            <span className="font-data text-xs text-muted-foreground">{vital.unit}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping-slow absolute inline-flex h-full w-full rounded-full ${cfg.bar} opacity-60`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.bar}`} />
          </span>
          <TrendIcon trend={vital.trend} positive={vital.trendPositive} />
        </div>
      </div>

      <div className="pl-2 mb-1.5">
        <div className="h-[3px] bg-muted rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${vital.progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
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

interface VitalsPanelProps {
  vitals: VitalData[];
}

export default function VitalsPanel({ vitals }: VitalsPanelProps) {
  const criticalCount = vitals.filter(v => v.status === "critical").length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="font-display text-[10px] tracking-[0.2em] text-foreground/80">PLANETARY VITALS</span>
        </div>
        <div className="flex items-center gap-1.5">
          {criticalCount > 0 && (
            <motion.span
              key={criticalCount}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="font-data text-[9px] text-critical"
            >
              {criticalCount} CRITICAL
            </motion.span>
          )}
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
        {vitals.map((vital, i) => (
          <VitalCard key={vital.id} vital={vital} index={i} />
        ))}
      </div>
    </div>
  );
}
