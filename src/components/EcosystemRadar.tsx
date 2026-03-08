import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Radar } from "lucide-react";

interface EcoSystem {
  id: string;
  label: string;
  angle: number;
  value: number;    // 0-1 current health
  baseline: number; // 0-1 baseline
  color: string;
  unit: string;
  status: "healthy" | "warning" | "critical";
}

const ecosystems: EcoSystem[] = [
  { id: "rainforest",    label: "RAINFOREST",    angle: 0,   value: 0.62, baseline: 1.0, color: "#22c55e", unit: "72%",  status: "warning"  },
  { id: "coral",        label: "CORAL REEFS",   angle: 51,  value: 0.45, baseline: 1.0, color: "#f97316", unit: "45%",  status: "critical" },
  { id: "ocean",        label: "PHYTOPLANKTON", angle: 103, value: 0.71, baseline: 1.0, color: "#0ea5e9", unit: "71%",  status: "warning"  },
  { id: "wetlands",     label: "WETLANDS",      angle: 154, value: 0.58, baseline: 1.0, color: "#06b6d4", unit: "58%",  status: "warning"  },
  { id: "grasslands",   label: "GRASSLANDS",    angle: 206, value: 0.79, baseline: 1.0, color: "#84cc16", unit: "79%",  status: "healthy"  },
  { id: "arctic",       label: "ARCTIC TUNDRA", angle: 257, value: 0.38, baseline: 1.0, color: "#67e8f9", unit: "38%",  status: "critical" },
  { id: "drylands",     label: "DRYLANDS",      angle: 309, value: 0.83, baseline: 1.0, color: "#fbbf24", unit: "83%",  status: "healthy"  },
];

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function EcosystemRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const sweepAngle = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const R  = Math.min(W, H) * 0.42;

      ctx.clearRect(0, 0, W, H);

      // Grid rings
      for (let ring = 1; ring <= 4; ring++) {
        const r = (R / 4) * ring;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsl(220 20% 14%)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Axis lines
      ecosystems.forEach(eco => {
        const pt = polarToXY(cx, cy, R, eco.angle);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(pt.x, pt.y);
        ctx.strokeStyle = `hsl(220 20% 14%)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Baseline polygon (faded)
      ctx.beginPath();
      ecosystems.forEach((eco, i) => {
        const pt = polarToXY(cx, cy, R * eco.baseline, eco.angle);
        i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.strokeStyle = `hsl(185 100% 50% / 0.12)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current health polygon
      ctx.beginPath();
      ecosystems.forEach((eco, i) => {
        const pt = polarToXY(cx, cy, R * eco.value, eco.angle);
        i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fillStyle = `hsl(185 100% 50% / 0.06)`;
      ctx.fill();
      ctx.strokeStyle = `hsl(185 100% 55% / 0.7)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Data points
      ecosystems.forEach(eco => {
        const pt = polarToXY(cx, cy, R * eco.value, eco.angle);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = eco.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = eco.color + "55";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Radar sweep
      const sa = ((sweepAngle.current - 90) * Math.PI) / 180;
      const gradient = ctx.createConicalGradient
        ? ctx.createConicalGradient(cx, cy, 0)
        : null;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, sa - 0.7, sa, false);
      ctx.closePath();
      ctx.fillStyle = `hsl(185 100% 55% / 0.15)`;
      ctx.fill();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const sweepEnd = polarToXY(cx, cy, R, sweepAngle.current);
      ctx.lineTo(sweepEnd.x, sweepEnd.y);
      ctx.strokeStyle = `hsl(185 100% 55% / 0.8)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      sweepAngle.current = (sweepAngle.current + 0.5) % 360;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Radar className="w-3.5 h-3.5 text-primary" />
          <span className="font-display text-[10px] tracking-[0.2em] text-foreground/80">
            ECOSYSTEM ACTIVITY RADAR
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-data text-[9px] text-nominal tracking-widest">SCANNING</span>
          <div className="w-1.5 h-1.5 rounded-full bg-nominal animate-pulse-dot" />
        </div>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={280}
          height={220}
          className="max-w-full max-h-full"
        />

        {/* Labels around radar */}
        <div className="absolute inset-0 pointer-events-none">
          {ecosystems.map(eco => {
            const cx = 50, cy = 50, R = 48;
            const pt = polarToXY(cx, cy, R, eco.angle);
            const statusColor =
              eco.status === "critical" ? "text-critical" :
              eco.status === "warning"  ? "text-warning"  : "text-nominal";
            return (
              <div
                key={eco.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              >
                <div className={`font-data text-[7px] tracking-wider ${statusColor} text-center whitespace-nowrap`}>
                  {eco.label}
                </div>
                <div className={`font-data text-[9px] font-bold text-center ${statusColor}`}>
                  {eco.unit}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
