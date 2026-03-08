import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

interface PulseGraphProps {
  stability?: number;
  alertLevel?: "nominal" | "warning" | "critical";
}

/* ---- Generate an ECG-like planetary pulse waveform ---- */
function generateWaveform(points: number, stability: number): number[] {
  const wave: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / points;
    // Base sine rhythm
    const base = Math.sin(t * Math.PI * 14) * 0.3;
    // Secondary oscillation
    const secondary = Math.sin(t * Math.PI * 6 + 1.2) * 0.15;
    // ECG-like spike every ~1/7 of the waveform
    const spikePhase = (t * 7) % 1;
    const spike =
      spikePhase > 0.85
        ? Math.exp(-Math.pow((spikePhase - 0.92) * 60, 2)) * 0.8
        : spikePhase > 0.75
        ? -Math.exp(-Math.pow((spikePhase - 0.78) * 50, 2)) * 0.25
        : 0;
    // Instability noise
    const noise = (Math.random() - 0.5) * (1 - stability) * 0.6;
    wave.push(base + secondary + spike + noise);
  }
  return wave;
}

const POINTS = 200;
const HISTORY_LINES = 4;

export default function PulseGraph({ stability = 0.72, alertLevel = "warning" }: PulseGraphProps) {
  const [waveforms, setWaveforms] = useState<number[][]>(() =>
    Array.from({ length: HISTORY_LINES }, (_, i) =>
      generateWaveform(POINTS, 0.72 - i * 0.04)
    )
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setWaveforms(prev => {
        const next = [...prev];
        next[currentIndex % HISTORY_LINES] = generateWaveform(POINTS, stability);
        return next;
      });
      setCurrentIndex(i => i + 1);
    }, 2400);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentIndex, stability]);

  const svgWidth = 600;
  const svgHeight = 80;
  const midY = svgHeight / 2;
  const amp = svgHeight * 0.42;

  function toPath(wave: number[]) {
    return wave
      .map((v, i) => {
        const x = (i / (wave.length - 1)) * svgWidth;
        const y = midY - v * amp;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }

  // System metrics
  const metrics = [
    { label: "STABILITY INDEX", value: "72.4", unit: "%", color: "text-warning" },
    { label: "OSCILLATION",     value: "0.34", unit: "σ",  color: "text-nominal" },
    { label: "VARIANCE",        value: "↑2.1", unit: "%",  color: "text-critical" },
    { label: "FREQ",            value: "11.2", unit: "yr⁻¹", color: "text-nominal" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="font-display text-[10px] tracking-[0.2em] text-foreground/80">
            EARTH SYSTEM PULSE
          </span>
        </div>
        <div className="flex items-center gap-3">
          {metrics.map(m => (
            <div key={m.label} className="text-right hidden md:block">
              <div className="font-data text-[8px] text-muted-foreground tracking-wider">{m.label}</div>
              <div className={`font-data text-xs font-semibold ${m.color}`}>
                {m.value}<span className="text-[9px] text-muted-foreground ml-0.5">{m.unit}</span>
              </div>
            </div>
          ))}
          <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse-dot" />
        </div>
      </div>

      {/* Waveform SVG */}
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-sm bg-muted/30 border border-border/30">
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="60" height="20" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 20" fill="none" stroke="hsl(220 20% 14%)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(185 100% 50% / 0.08)" strokeWidth="1" />
        </svg>

        {/* Historical waveforms (faded) */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {waveforms.slice(1).map((wave, i) => (
            <path
              key={i}
              d={toPath(wave)}
              fill="none"
              stroke={`hsl(185 100% 50% / ${0.06 + i * 0.04})`}
              strokeWidth="0.8"
            />
          ))}
        </svg>

        {/* Active waveform */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="glow-filter">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={toPath(waveforms[0])}
            fill="none"
            stroke="hsl(185 100% 55%)"
            strokeWidth="1.5"
            filter="url(#glow-filter)"
          />
        </svg>

        {/* Scan cursor */}
        <motion.div
          className="absolute top-0 bottom-0 w-[1px] bg-primary/50"
          style={{ left: "0%" }}
          animate={{ left: ["0%", "100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Labels */}
        <div className="absolute bottom-1 left-2 font-data text-[8px] text-muted-foreground/50 tracking-wider">
          T-48h
        </div>
        <div className="absolute bottom-1 right-2 font-data text-[8px] text-muted-foreground/50 tracking-wider">
          NOW
        </div>

        {/* Status tag */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/60 rounded px-1.5 py-0.5 border border-warning/20">
          <span className="w-1 h-1 rounded-full bg-warning animate-pulse-dot" />
          <span className="font-data text-[9px] text-warning tracking-widest">STRESSED</span>
        </div>
      </div>

      {/* Bottom metric row */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        {[
          { label: "CLIMATE SYS", val: "67%",  status: "warning"  },
          { label: "BIOSPHERE",   val: "74%",  status: "nominal"  },
          { label: "OCEAN CIRC",  val: "58%",  status: "critical" },
          { label: "WATER CYCLE", val: "71%",  status: "warning"  },
        ].map(item => (
          <div key={item.label} className="text-center bg-muted/40 rounded-sm py-1.5 border border-border/30">
            <div className={`font-data text-sm font-semibold ${
              item.status === "critical" ? "text-critical" :
              item.status === "warning"  ? "text-warning"  : "text-nominal"
            }`}>{item.val}</div>
            <div className="font-data text-[8px] text-muted-foreground tracking-wider">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
