import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, AlertTriangle, Activity, ChevronRight } from "lucide-react";

interface TippingSignal {
  time: number;
  variance: number;
  recovery: number;
  oscillation: number;
  risk: number;
}

function generateSignalHistory(baseRisk: number): TippingSignal[] {
  const points: TippingSignal[] = [];
  for (let i = 0; i < 60; i++) {
    const t      = i / 59;
    const drift  = t * baseRisk * 0.4;
    const noise  = (Math.random() - 0.5) * 0.08;
    const var_   = 0.2 + drift + noise + (i > 45 ? (i - 45) * 0.012 : 0);
    const recov  = 1.0 - drift * 1.2 - noise * 0.5;
    const osc    = 0.1 + drift * 0.8 + Math.abs(noise) * 1.5;
    const risk   = Math.min(1, drift * 1.6 + Math.abs(noise) * 0.3);
    points.push({ time: i, variance: Math.min(1, var_), recovery: Math.max(0, recov), oscillation: Math.min(1, osc), risk });
  }
  return points;
}

interface Alert {
  id: string;
  system: string;
  region: string;
  message: string;
  risk: number;
  severity: "high" | "medium" | "monitor";
  indicator: string;
  icon: string;
  timestamp: string;
  detail: string;
}

const ALL_ALERTS: Alert[] = [
  { id: "amz",  system: "Amazon Rainforest",    region: "South America", message: "Resilience declining. Ecosystem transition probability rising.", risk: 78, severity: "high",    indicator: "Recovery slowdown detected — variance ↑34%",          icon: "🌿", timestamp: "14m ago", detail: "Forest dieback models suggest a 2.5°C warming threshold may trigger a self-reinforcing savannification. Current resilience metrics show slowed recovery time post-disturbance — a classic early-warning signal of critical transition proximity." },
  { id: "ami",  system: "Atlantic Meridional",  region: "North Atlantic", message: "Circulation weakening beyond historical range.",              risk: 62, severity: "high",    indicator: "Oscillation amplitude +2.3σ above baseline",           icon: "🌊", timestamp: "31m ago", detail: "AMOC slowdown is linked to freshwater influx from accelerating Greenland melt. Current flow rate ~15% below 2004 baseline. Models project continued weakening, potentially shifting European climate patterns and disrupting global heat distribution." },
  { id: "ghis", system: "Greenland Ice Sheet",  region: "Arctic",         message: "Mass loss acceleration. Nonlinear melting signatures.",       risk: 55, severity: "medium",  indicator: "Feedback loop engagement probability: 42%",            icon: "🧊", timestamp: "1h ago",   detail: "Surface albedo feedback loop shows early signs of engagement. Marine ice sheet instability at Jakobshavn Glacier is contributing to acceleration. Each mm of sea level rise correlates with 12km² additional coastal inundation risk globally." },
  { id: "gbr",  system: "Great Barrier Reef",   region: "Western Pacific", message: "Thermal stress approaching bleaching threshold.",            risk: 44, severity: "monitor", indicator: "SST anomaly +1.8°C sustained 6 weeks",                 icon: "🪸", timestamp: "2h ago",   detail: "Degree Heating Weeks accumulating above critical threshold. Six consecutive bleaching events since 2016 have reduced cover of heat-resistant coral species by ~70%. Remaining ecosystem may lack adaptive capacity for further thermal events." },
];

interface SignalChartProps {
  signals: TippingSignal[];
  width: number;
  height: number;
}

function SignalChart({ signals, width, height }: SignalChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "hsl(220 28% 5%)";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "hsl(220 20% 14%)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const x = (i / 6) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    const toX = (t: number) => (t / (signals.length - 1)) * W;
    const toY = (v: number) => H - v * H * 0.85 - H * 0.07;

    // Series: recovery time (inverted — declining is bad)
    const drawLine = (key: keyof TippingSignal, color: string, lineWidth = 1.5) => {
      ctx.beginPath();
      signals.forEach((s, i) => {
        const x = toX(s.time);
        const y = toY(s[key] as number);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      // glow
      ctx.shadowColor  = color;
      ctx.shadowBlur   = 4;
      ctx.stroke();
      ctx.shadowBlur   = 0;
    };

    drawLine("variance",    "hsl(0 85% 60%)",  1.8);   // red — variance (rising bad)
    drawLine("oscillation", "hsl(38 95% 55%)", 1.5);   // amber — oscillation
    drawLine("recovery",    "hsl(185 100% 50%)", 1.5); // cyan — recovery capacity
    drawLine("risk",        "hsl(290 80% 60%)", 2);    // magenta — composite risk

    // Tipping threshold line
    ctx.beginPath();
    ctx.moveTo(0, toY(0.75)); ctx.lineTo(W, toY(0.75));
    ctx.strokeStyle = "hsl(0 85% 60% / 0.4)";
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // "Now" line
    ctx.beginPath();
    ctx.moveTo(W - 1, 0); ctx.lineTo(W - 1, H);
    ctx.strokeStyle = "hsl(185 100% 50% / 0.5)";
    ctx.lineWidth   = 1;
    ctx.stroke();

  }, [signals]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full rounded-sm"
    />
  );
}

interface TippingPointModalProps {
  alertId: string | null;
  onClose: () => void;
}

export default function TippingPointModal({ alertId, onClose }: TippingPointModalProps) {
  const alert = ALL_ALERTS.find(a => a.id === alertId);
  const signals = alert ? generateSignalHistory(alert.risk / 100) : [];

  if (!alertId || !alert) return null;

  const severityColor =
    alert.severity === "high"   ? "text-critical border-critical/30 bg-critical/5" :
    alert.severity === "medium" ? "text-warning  border-warning/30  bg-warning/5"  :
    "text-nominal border-nominal/30 bg-nominal/5";

  const legend = [
    { color: "hsl(0 85% 60%)",   label: "Variance"           },
    { color: "hsl(38 95% 55%)",  label: "Oscillation"        },
    { color: "hsl(185 100% 50%)", label: "Recovery Capacity" },
    { color: "hsl(290 80% 60%)", label: "Composite Risk"     },
  ];

  return (
    <AnimatePresence>
      {alertId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-4 top-[8%] bottom-[8%] md:inset-x-[10%] lg:inset-x-[18%] z-50 panel-glass rounded-sm shadow-panel overflow-hidden flex flex-col"
          >
            {/* Modal header */}
            <div className={`flex items-center justify-between px-5 py-3 border-b border-border/50 ${severityColor} border rounded-t-sm`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{alert.icon}</span>
                <div>
                  <div className="font-display text-sm tracking-[0.12em]">{alert.system}</div>
                  <div className="font-data text-[9px] text-muted-foreground tracking-widest">{alert.region} · TIPPING POINT ANALYSIS</div>
                </div>
                <div className="flex items-center gap-1.5 ml-4">
                  <span className={`font-data text-xs font-bold ${alert.severity === "high" ? "text-critical" : alert.severity === "medium" ? "text-warning" : "text-nominal"}`}>
                    RISK {alert.risk}%
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-sm hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5">
              {/* Description */}
              <div className="flex gap-3">
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.severity === "high" ? "text-critical" : alert.severity === "medium" ? "text-warning" : "text-nominal"}`} />
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{alert.detail}</p>
              </div>

              {/* Current indicator */}
              <div className="flex items-center gap-2 bg-muted/30 rounded-sm px-3 py-2 border border-border/30">
                <ChevronRight className="w-3 h-3 text-primary" />
                <span className="font-data text-[10px] text-muted-foreground">{alert.indicator}</span>
              </div>

              {/* Signal chart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    <span className="font-display text-[10px] tracking-[0.18em] text-foreground/80">
                      CRITICAL TRANSITION SIGNALS — 60 MONTH HISTORY
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-2">
                  {legend.map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-6 h-[2px] rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="font-data text-[8px] text-muted-foreground">{l.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-[1px] rounded-full border-b border-dashed border-critical/40" />
                    <span className="font-data text-[8px] text-critical/70">Tipping Threshold</span>
                  </div>
                </div>

                <div className="h-[200px] w-full rounded-sm overflow-hidden border border-border/30">
                  <SignalChart signals={signals} width={700} height={200} />
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "VARIANCE SPIKE",     val: `+${Math.round(alert.risk * 0.42)}%`, color: "text-critical" },
                  { label: "RECOVERY SLOWDOWN",  val: `-${Math.round(alert.risk * 0.38)}%`, color: "text-warning"  },
                  { label: "OSCILLATION AMP",    val: `+${(alert.risk * 0.023).toFixed(1)}σ`, color: "text-warning" },
                  { label: "TRANSITION ETA",     val: alert.risk > 70 ? "~15yr" : alert.risk > 50 ? "~25yr" : ">40yr", color: "text-nominal" },
                ].map(m => (
                  <div key={m.label} className="bg-muted/40 rounded-sm p-3 border border-border/30 text-center">
                    <div className={`font-display text-xl font-bold ${m.color}`}>{m.val}</div>
                    <div className="font-data text-[8px] text-muted-foreground tracking-wider mt-1">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Risk timeline */}
              <div>
                <div className="font-data text-[9px] text-muted-foreground tracking-widest mb-2">RISK TRAJECTORY — LAST 60 MONTHS</div>
                <div className="flex items-end gap-0.5 h-12">
                  {signals.slice(-30).map((s, i) => {
                    const h = Math.max(4, s.risk * 48);
                    const color = s.risk > 0.75 ? "bg-critical" : s.risk > 0.5 ? "bg-warning" : "bg-nominal";
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-sm ${color} opacity-80`}
                        style={{ height: `${h}px` }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-data text-[8px] text-muted-foreground/50">30m ago</span>
                  <span className="font-data text-[8px] text-primary/60">NOW</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { ALL_ALERTS };
export type { Alert };
