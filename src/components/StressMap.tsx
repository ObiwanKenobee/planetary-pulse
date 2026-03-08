import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Map } from "lucide-react";

// Stress zones with normalized coordinates (0-1 on a 2:1 equirectangular map)
interface StressZone {
  id: string;
  label: string;
  x: number;  // 0-1 left to right
  y: number;  // 0-1 top to bottom
  radius: number; // 0-1 relative
  intensity: number; // 0-1
  type: "water" | "heat" | "wildfire" | "glacier" | "coral" | "drought";
  region: string;
  trend: "worsening" | "stable" | "improving";
}

const STRESS_ZONES: StressZone[] = [
  { id: "amazon",    label: "Amazon Drought",      x: 0.26, y: 0.58, radius: 0.055, intensity: 0.82, type: "drought",  region: "South America",   trend: "worsening" },
  { id: "sahel",     label: "Sahel Water Stress",  x: 0.47, y: 0.47, radius: 0.045, intensity: 0.91, type: "water",    region: "West Africa",     trend: "worsening" },
  { id: "arctic",    label: "Arctic Melt",         x: 0.50, y: 0.04, radius: 0.06,  intensity: 0.87, type: "glacier",  region: "Arctic",          trend: "worsening" },
  { id: "california",label: "California Fires",    x: 0.11, y: 0.38, radius: 0.03,  intensity: 0.75, type: "wildfire", region: "Western US",      trend: "stable"    },
  { id: "australia", label: "Australia Heat",      x: 0.78, y: 0.72, radius: 0.05,  intensity: 0.78, type: "heat",    region: "Australia",        trend: "worsening" },
  { id: "middleeast",label: "Middle East Heat",    x: 0.575,y: 0.40, radius: 0.04,  intensity: 0.89, type: "heat",    region: "MENA",             trend: "worsening" },
  { id: "india",     label: "India Water Stress",  x: 0.655,y: 0.44, radius: 0.038, intensity: 0.72, type: "water",   region: "South Asia",       trend: "stable"    },
  { id: "greenland", label: "Greenland Ice Loss",  x: 0.335,y: 0.12, radius: 0.04,  intensity: 0.80, type: "glacier", region: "Greenland",        trend: "worsening" },
  { id: "coral",     label: "Coral Bleaching",     x: 0.795,y: 0.63, radius: 0.03,  intensity: 0.68, type: "coral",   region: "Great Barrier Reef", trend: "worsening"},
  { id: "siberia",   label: "Siberia Fires",       x: 0.73, y: 0.20, radius: 0.045, intensity: 0.65, type: "wildfire",region: "Siberia",           trend: "stable"   },
  { id: "euphrates", label: "Tigris-Euphrates",    x: 0.57, y: 0.36, radius: 0.025, intensity: 0.84, type: "water",   region: "Middle East",      trend: "worsening" },
  { id: "himalaya",  label: "Himalayan Glaciers",  x: 0.67, y: 0.38, radius: 0.035, intensity: 0.73, type: "glacier", region: "High Asia",        trend: "worsening" },
];

const typeColors: Record<string, { fill: string; stroke: string; label: string }> = {
  water:   { fill: "rgba(0,  149,255,0.25)", stroke: "#0095ff", label: "Water Scarcity"   },
  heat:    { fill: "rgba(255, 80,  0, 0.28)", stroke: "#ff5000", label: "Extreme Heat"    },
  wildfire:{ fill: "rgba(255,140,  0, 0.28)", stroke: "#ff8c00", label: "Wildfire Risk"   },
  glacier: { fill: "rgba(160,220,255,0.28)", stroke: "#a0dcff", label: "Glacier Retreat"  },
  coral:   { fill: "rgba(255, 80,180,0.25)", stroke: "#ff50b4", label: "Coral Bleaching"  },
  drought: { fill: "rgba(210,130,  0, 0.28)", stroke: "#d28200", label: "Drought"         },
};

interface StressMapProps {
  onZoneClick?: (zone: StressZone) => void;
}

export default function StressMap({ onZoneClick }: StressMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const timeRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      timeRef.current += 0.016;

      ctx.clearRect(0, 0, W, H);

      // Background ocean
      ctx.fillStyle = "hsl(220 28% 6%)";
      ctx.fillRect(0, 0, W, H);

      // Simple continent silhouettes (simplified polygons approximating continents)
      const continents: [number, number][][] = [
        // North America
        [[0.07,0.15],[0.22,0.12],[0.24,0.17],[0.19,0.22],[0.22,0.30],[0.19,0.38],[0.14,0.42],[0.09,0.40],[0.07,0.35],[0.04,0.28],[0.05,0.20]],
        // South America
        [[0.19,0.44],[0.26,0.42],[0.31,0.48],[0.30,0.58],[0.27,0.70],[0.22,0.75],[0.19,0.70],[0.18,0.60],[0.18,0.50]],
        // Europe
        [[0.44,0.18],[0.50,0.15],[0.54,0.18],[0.53,0.24],[0.50,0.27],[0.46,0.26],[0.43,0.22]],
        // Africa
        [[0.46,0.30],[0.54,0.28],[0.57,0.34],[0.56,0.46],[0.54,0.58],[0.50,0.65],[0.46,0.60],[0.44,0.50],[0.44,0.38]],
        // Asia
        [[0.54,0.15],[0.72,0.12],[0.84,0.16],[0.88,0.22],[0.82,0.32],[0.74,0.38],[0.66,0.42],[0.60,0.38],[0.56,0.30],[0.54,0.22]],
        // Australia
        [[0.74,0.60],[0.82,0.58],[0.86,0.63],[0.84,0.72],[0.78,0.76],[0.73,0.72],[0.72,0.64]],
        // Antarctica
        [[0.05,0.93],[0.50,0.94],[0.95,0.93],[0.90,0.98],[0.50,0.99],[0.10,0.98]],
      ];

      continents.forEach(pts => {
        ctx.beginPath();
        pts.forEach(([px, py], i) => {
          i === 0 ? ctx.moveTo(px*W, py*H) : ctx.lineTo(px*W, py*H);
        });
        ctx.closePath();
        ctx.fillStyle   = "hsl(155 20% 15%)";
        ctx.strokeStyle = "hsl(155 20% 18%)";
        ctx.lineWidth   = 0.5;
        ctx.fill();
        ctx.stroke();
      });

      // Grid lines
      ctx.strokeStyle = "hsl(220 20% 12%)";
      ctx.lineWidth   = 0.4;
      for (let lat = 0; lat <= 1; lat += 1/6) {
        ctx.beginPath(); ctx.moveTo(0, lat*H); ctx.lineTo(W, lat*H); ctx.stroke();
      }
      for (let lon = 0; lon <= 1; lon += 1/12) {
        ctx.beginPath(); ctx.moveTo(lon*W, 0); ctx.lineTo(lon*W, H); ctx.stroke();
      }

      // Stress zones with pulsing rings
      STRESS_ZONES.forEach(zone => {
        const cx = zone.x * W;
        const cy = zone.y * H;
        const br = zone.radius * W;
        const col = typeColors[zone.type];

        // Outer pulse rings
        for (let ring = 0; ring < 3; ring++) {
          const phase  = (timeRef.current * (0.7 + ring * 0.15) + ring * 1.2) % (Math.PI * 2);
          const ringR  = br * (1.2 + ring * 0.5 + Math.sin(phase) * 0.2 * zone.intensity);
          const alpha  = (Math.sin(phase) * 0.5 + 0.5) * 0.25 * zone.intensity * (1 - ring * 0.25);
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = col.stroke.replace(")", `,${alpha})`).replace("#", "rgba(").replace(/^rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/, (_, r, g, b) =>
            `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)}`
          );
          // simpler approach: just use fill with alpha
          ctx.strokeStyle = col.stroke;
          ctx.globalAlpha = alpha;
          ctx.lineWidth   = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Core blob
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, br);
        gradient.addColorStop(0, col.fill.replace("0.25", `${zone.intensity * 0.5}`).replace("0.28", `${zone.intensity * 0.5}`));
        gradient.addColorStop(0.6, col.fill);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, br, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Dot center
        const pulse = 0.6 + 0.4 * Math.sin(timeRef.current * 2.5 + zone.x * 10);
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle   = col.stroke;
        ctx.globalAlpha = pulse;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onZoneClick) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top)  / rect.height;
    const hit = STRESS_ZONES.find(z =>
      Math.hypot(mx - z.x, my - z.y) < z.radius + 0.03
    );
    if (hit) onZoneClick(hit);
  };

  const legend = [
    { type: "water",    label: "Water Scarcity"  },
    { type: "heat",     label: "Extreme Heat"    },
    { type: "wildfire", label: "Wildfire Risk"   },
    { type: "glacier",  label: "Glacier Retreat" },
    { type: "drought",  label: "Drought"         },
    { type: "coral",    label: "Coral Bleaching" },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <Map className="w-3.5 h-3.5 text-critical" />
          <span className="font-display text-[10px] tracking-[0.2em] text-foreground/80">PLANETARY STRESS MAP</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-data text-[9px] text-critical animate-pulse-dot">12 ZONES ACTIVE</span>
          <div className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse-dot" />
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 min-h-0 rounded-sm overflow-hidden border border-border/30">
        <canvas
          ref={canvasRef}
          width={800}
          height={360}
          className="w-full h-full cursor-crosshair"
          onClick={handleClick}
        />

        {/* Zone labels on hover — static for now */}
        <div className="absolute top-1 left-1 font-data text-[8px] text-muted-foreground/40 tracking-wider">
          EQUIRECTANGULAR PROJECTION · CLICK ZONES FOR DETAIL
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 shrink-0">
        {legend.map(item => {
          const col = typeColors[item.type];
          return (
            <div key={item.type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.stroke }} />
              <span className="font-data text-[8px] text-muted-foreground/70">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
