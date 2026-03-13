import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, RefreshCw, AlertTriangle, Thermometer, TreePine, Flame, X } from "lucide-react";

/* ─── Data model ─────────────────────────────────────────── */
interface SatTile {
  id: string;
  region: string;
  type: "deforestation" | "sea_ice" | "wildfire";
  lat: number;
  lon: number;
  severity: "critical" | "high" | "moderate";
  value: string;          // e.g. "–18,400 km²" or "+4.1° C"
  unit: string;           // e.g. "deforested/day"
  change: string;         // e.g. "↑ 22% vs last week"
  changeDir: "up" | "down";
  /** simulated gradient canvas fill */
  palette: string[];
  lastUpdated: string;
  sensor: string;
}

// Static seed — values drift on each refresh via noise
const SEED_TILES: Omit<SatTile, "value" | "change" | "lastUpdated">[] = [
  {
    id: "amz-def",
    region: "Amazon Basin",
    type: "deforestation",
    lat: -3.5, lon: -60.0,
    severity: "critical",
    unit: "ha/day",
    changeDir: "up",
    palette: ["hsl(30 60% 8%)", "hsl(25 80% 18%)", "hsl(120 40% 12%)", "hsl(30 70% 22%)"],
    sensor: "LANDSAT-9 / INPE",
  },
  {
    id: "arc-ice",
    region: "Arctic Sea Ice",
    type: "sea_ice",
    lat: 85.0, lon: 0.0,
    severity: "high",
    unit: "km² extent",
    changeDir: "down",
    palette: ["hsl(210 30% 8%)", "hsl(210 50% 14%)", "hsl(200 60% 20%)", "hsl(210 40% 10%)"],
    sensor: "AMSR2 / NSIDC",
  },
  {
    id: "sib-fire",
    region: "Siberian Taiga",
    type: "wildfire",
    lat: 62.0, lon: 105.0,
    severity: "high",
    unit: "active hotspots",
    changeDir: "up",
    palette: ["hsl(0 20% 6%)", "hsl(15 70% 14%)", "hsl(30 80% 20%)", "hsl(5 60% 10%)"],
    sensor: "VIIRS / FIRMS",
  },
  {
    id: "aus-reef",
    region: "Great Barrier Reef",
    type: "sea_ice",
    lat: -18.0, lon: 147.0,
    severity: "critical",
    unit: "°C above baseline",
    changeDir: "up",
    palette: ["hsl(180 30% 6%)", "hsl(190 50% 12%)", "hsl(180 60% 18%)", "hsl(200 40% 8%)"],
    sensor: "MODIS SST / BoM",
  },
  {
    id: "con-def",
    region: "Congo Basin",
    type: "deforestation",
    lat: -2.0, lon: 23.0,
    severity: "moderate",
    unit: "ha/day",
    changeDir: "up",
    palette: ["hsl(120 20% 6%)", "hsl(90 40% 12%)", "hsl(120 50% 16%)", "hsl(100 30% 10%)"],
    sensor: "SENTINEL-2 / ESA",
  },
  {
    id: "aus-fire",
    region: "SE Australia",
    type: "wildfire",
    lat: -34.0, lon: 150.0,
    severity: "high",
    unit: "fire radiative power MW",
    changeDir: "up",
    palette: ["hsl(20 20% 6%)", "hsl(20 70% 14%)", "hsl(35 80% 18%)", "hsl(10 60% 8%)"],
    sensor: "VIIRS / FIRMS",
  },
];

const TYPE_META = {
  deforestation: { icon: TreePine,   label: "DEFORESTATION", color: "text-warning",  border: "border-warning/30",  bg: "bg-warning/10"  },
  sea_ice:       { icon: Thermometer,label: "OCEAN / ICE",   color: "text-nominal",  border: "border-nominal/30",  bg: "bg-nominal/10"  },
  wildfire:      { icon: Flame,       label: "WILDFIRE",      color: "text-critical", border: "border-critical/30", bg: "bg-critical/10" },
};

const SEV_DOT: Record<string, string> = {
  critical: "bg-critical animate-pulse",
  high:     "bg-warning",
  moderate: "bg-nominal",
};

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function generateTiles(): SatTile[] {
  const now = new Date();
  const ts = now.toISOString().slice(11, 19) + " UTC";
  return SEED_TILES.map(s => {
    let value = "";
    let change = "";
    if (s.id === "amz-def") {
      const v = Math.round(randomBetween(8400, 11200));
      value = `${v.toLocaleString()}`;
      const d = Math.round(randomBetween(8, 28));
      change = `↑ ${d}% vs prev 48h`;
    } else if (s.id === "arc-ice") {
      const v = (randomBetween(3.8, 4.4)).toFixed(2);
      value = `${v}M`;
      const d = Math.round(randomBetween(3, 12));
      change = `↓ ${d}% below 1980 mean`;
    } else if (s.id === "sib-fire") {
      const v = Math.round(randomBetween(1140, 1880));
      value = `${v.toLocaleString()}`;
      const d = Math.round(randomBetween(15, 42));
      change = `↑ ${d}% above seasonal avg`;
    } else if (s.id === "aus-reef") {
      const v = randomBetween(1.8, 2.6).toFixed(1);
      value = `+${v}`;
      const d = randomBetween(0.1, 0.4).toFixed(2);
      change = `↑ ${d}°C this month`;
    } else if (s.id === "con-def") {
      const v = Math.round(randomBetween(2100, 3400));
      value = `${v.toLocaleString()}`;
      const d = Math.round(randomBetween(4, 16));
      change = `↑ ${d}% this quarter`;
    } else {
      const v = Math.round(randomBetween(2200, 5600));
      value = `${v.toLocaleString()}`;
      const d = Math.round(randomBetween(20, 60));
      change = `↑ ${d}% fire season peak`;
    }
    return { ...s, value, change, lastUpdated: ts };
  });
}

/* ─── Tile canvas mockup (CSS gradient art) ─────────────── */
function TileCanvas({ palette, type, id }: { palette: string[]; type: SatTile["type"]; id: string }) {
  // Use deterministic noise dots based on id
  const dots = Array.from({ length: 24 }, (_, i) => {
    const seed = (id.charCodeAt(i % id.length) * 17 + i * 31) % 100;
    const x = (seed * 1.3) % 100;
    const y = (seed * 2.7 + i * 11) % 100;
    const r = 1 + (seed % 3);
    const opacity = 0.3 + (seed % 5) * 0.12;
    const color = type === "wildfire"
      ? `hsla(${20 + (seed % 30)}, 85%, ${40 + (seed % 30)}%, ${opacity})`
      : type === "deforestation"
      ? `hsla(${100 + (seed % 40)}, 60%, ${30 + (seed % 20)}%, ${opacity})`
      : `hsla(${190 + (seed % 30)}, 70%, ${50 + (seed % 25)}%, ${opacity})`;
    return { x, y, r, color };
  });

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 60% 40%, ${palette[2]} 0%, ${palette[1]} 40%, ${palette[0]} 100%)`,
      }}
    >
      {/* grid lines */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(hsl(220 20% 40% / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(220 20% 40% / 0.15) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      {/* scatter dots */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} />
        ))}
      </svg>
      {/* hotspot pulse for wildfire */}
      {type === "wildfire" && (
        <motion.div
          className="absolute rounded-full"
          style={{ width: 6, height: 6, top: "38%", left: "52%", background: "hsl(30 100% 60%)", boxShadow: "0 0 8px hsl(30 100% 60%)" }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.9, 0.4, 0.9] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
      {/* scan line sweep */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "linear-gradient(transparent 0%, hsl(180 100% 70% / 0.06) 50%, transparent 100%)", height: "6px", top: 0 }}
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/* ─── Detail drawer ──────────────────────────────────────── */
interface DetailProps { tile: SatTile; onClose: () => void }
function TileDetail({ tile, onClose }: DetailProps) {
  const meta = TYPE_META[tile.type];
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.22 }}
        className="relative z-10 panel-glass rounded-sm shadow-panel w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Image strip */}
        <div className="h-32 rounded-t-sm overflow-hidden">
          <TileCanvas palette={tile.palette} type={tile.type} id={tile.id} />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
              <div>
                <div className="font-display text-[10px] tracking-[0.12em] text-foreground">{tile.region.toUpperCase()}</div>
                <div className={`font-data text-[8px] tracking-widest ${meta.color}`}>{meta.label}</div>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-sm hover:bg-muted/40">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-muted/20 border border-border/30 rounded-sm p-2.5">
              <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">CURRENT READING</div>
              <div className={`font-display text-xl font-bold ${meta.color}`}>{tile.value}</div>
              <div className="font-data text-[7px] text-muted-foreground/50">{tile.unit}</div>
            </div>
            <div className="bg-muted/20 border border-border/30 rounded-sm p-2.5">
              <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">ANOMALY DELTA</div>
              <div className="font-data text-[10px] font-semibold text-critical">{tile.change}</div>
              <div className="font-data text-[7px] text-muted-foreground/50">vs baseline period</div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/20 pt-2.5">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${SEV_DOT[tile.severity]}`} />
              <span className="font-data text-[8px] text-muted-foreground/60 tracking-widest">{tile.severity.toUpperCase()} · {tile.sensor}</span>
            </div>
            <span className="font-data text-[7px] text-muted-foreground/40">{tile.lastUpdated}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
interface SatelliteFeedProps {
  simActive?: boolean;
}

export default function SatelliteFeed({ simActive }: SatelliteFeedProps) {
  const [tiles, setTiles] = useState<SatTile[]>(() => generateTiles());
  const [lastRefresh, setLastRefresh] = useState<string>(() => new Date().toISOString().slice(11, 19) + " UTC");
  const [countdown, setCountdown] = useState(60);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTile, setSelectedTile] = useState<SatTile | null>(null);
  const [filter, setFilter] = useState<"all" | "deforestation" | "sea_ice" | "wildfire">("all");

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setTiles(generateTiles());
      setLastRefresh(new Date().toISOString().slice(11, 19) + " UTC");
      setCountdown(60);
      setRefreshing(false);
    }, 600);
  }, []);

  // 60s auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { doRefresh(); return 60; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [doRefresh]);

  const visibleTiles = filter === "all" ? tiles : tiles.filter(t => t.type === filter);

  const critCount = tiles.filter(t => t.severity === "critical").length;

  const filterBtns: { key: typeof filter; label: string }[] = [
    { key: "all",           label: "ALL" },
    { key: "deforestation", label: "FOREST" },
    { key: "sea_ice",       label: "OCEAN/ICE" },
    { key: "wildfire",      label: "FIRE" },
  ];

  return (
    <>
      <div className="flex flex-col h-full gap-2.5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Satellite className="w-3.5 h-3.5 text-primary/70" />
            <div>
              <div className="font-display text-[10px] tracking-[0.12em] text-foreground/90">SATELLITE FEED</div>
              <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest">live earth observation · 6 sensors</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {critCount > 0 && (
              <div className="flex items-center gap-1 border border-critical/30 bg-critical/10 rounded-sm px-1.5 py-0.5">
                <AlertTriangle className="w-2.5 h-2.5 text-critical" />
                <span className="font-data text-[7px] text-critical tracking-widest">{critCount} CRITICAL</span>
              </div>
            )}
            <button
              onClick={doRefresh}
              className="flex items-center gap-1 font-data text-[7px] tracking-widest text-muted-foreground/50 border border-border/25 rounded-sm px-1.5 py-0.5 hover:text-primary hover:border-primary/30 transition-all"
              title="Refresh feed"
            >
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 0.6 }}>
                <RefreshCw className="w-2.5 h-2.5" />
              </motion.div>
              {refreshing ? "SYNCING" : `${countdown}s`}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 shrink-0">
          {filterBtns.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`flex-1 font-data text-[7px] tracking-widest rounded-sm py-1 border transition-all ${
                filter === btn.key
                  ? "border-primary/40 text-primary bg-primary/10"
                  : "border-border/20 text-muted-foreground/40 hover:border-border/40 hover:text-muted-foreground/70"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Tile grid */}
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-2 gap-1.5 content-start pr-0.5">
          <AnimatePresence mode="popLayout">
            {visibleTiles.map((tile, idx) => {
              const meta = TYPE_META[tile.type];
              const Icon = meta.icon;
              return (
                <motion.button
                  key={tile.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  onClick={() => setSelectedTile(tile)}
                  className={`rounded-sm border overflow-hidden text-left cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm ${
                    simActive && tile.severity === "critical"
                      ? "border-critical/40 shadow-[0_0_8px_hsl(var(--critical)/0.2)]"
                      : "border-border/25"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="h-[52px] relative overflow-hidden">
                    <TileCanvas palette={tile.palette} type={tile.type} id={tile.id} />
                    {/* type badge */}
                    <div className={`absolute top-1 left-1 flex items-center gap-0.5 rounded-sm px-1 py-0.5 ${meta.bg} border ${meta.border}`}>
                      <Icon className={`w-2 h-2 ${meta.color}`} />
                      <span className={`font-data text-[6px] tracking-widest ${meta.color}`}>{meta.label}</span>
                    </div>
                    {/* severity dot */}
                    <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${SEV_DOT[tile.severity]}`} />
                  </div>
                  {/* Info */}
                  <div className="p-1.5">
                    <div className="font-data text-[8px] text-foreground/80 truncate mb-0.5">{tile.region}</div>
                    <div className="flex items-baseline gap-1">
                      <span className={`font-display text-sm font-bold ${meta.color}`}>{tile.value}</span>
                      <span className="font-data text-[6px] text-muted-foreground/40 truncate">{tile.unit}</span>
                    </div>
                    <div className="font-data text-[6px] text-muted-foreground/40 mt-0.5 truncate">{tile.sensor}</div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between pt-1 border-t border-border/20">
          <span className="font-data text-[6px] text-muted-foreground/30 tracking-widest">AUTO-REFRESH · LAST SYNC {lastRefresh}</span>
          <span className="font-data text-[6px] text-muted-foreground/30 tracking-widest">ESA · NASA · NOAA · INPE</span>
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedTile && (
          <TileDetail tile={selectedTile} onClose={() => setSelectedTile(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
