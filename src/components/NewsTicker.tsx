import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";

interface NewsItem {
  id: string;
  timestamp: string;
  source: string;
  headline: string;
  severity: "critical" | "warning" | "nominal" | "info";
  tag: string;
}

const BASE_FEED: NewsItem[] = [
  {
    id: "n01",
    timestamp: "03:47 UTC",
    source: "AMOC-MONITOR",
    headline: "AMOC slowdown accelerates: new measurements confirm 15% reduction since 2004 — fastest rate in 1,000 years",
    severity: "critical",
    tag: "OCEAN",
  },
  {
    id: "n02",
    timestamp: "04:12 UTC",
    source: "INPE-BRAZIL",
    headline: "Amazon deforestation reaches critical threshold in Pará state — 23.4% of basin now degraded",
    severity: "critical",
    tag: "FOREST",
  },
  {
    id: "n03",
    timestamp: "04:33 UTC",
    source: "NSIDC",
    headline: "Arctic sea ice extent hits record September minimum for third consecutive year — 4.1M km²",
    severity: "critical",
    tag: "CRYO",
  },
  {
    id: "n04",
    timestamp: "05:01 UTC",
    source: "GBF-MONITOR",
    headline: "Great Barrier Reef mass bleaching event confirmed — 80% of monitored sites showing thermal stress",
    severity: "critical",
    tag: "REEF",
  },
  {
    id: "n05",
    timestamp: "05:18 UTC",
    source: "AWI-PERMAFROST",
    headline: "Siberian thermokarst lakes expanding 2.3× faster than 2010 baseline — CH₄ flux anomaly detected",
    severity: "warning",
    tag: "CARBON",
  },
  {
    id: "n06",
    timestamp: "05:44 UTC",
    source: "REGEN-CAPITAL",
    headline: "New $380M blended finance facility launched for Congo Basin peatland protection — 47M ha targeted",
    severity: "nominal",
    tag: "FINANCE",
  },
  {
    id: "n07",
    timestamp: "06:02 UTC",
    source: "WMO-CLIMATE",
    headline: "Global mean surface temperature at +1.48°C above pre-industrial baseline — 12-month rolling average",
    severity: "warning",
    tag: "TEMP",
  },
  {
    id: "n08",
    timestamp: "06:19 UTC",
    source: "SAHEL-WATCH",
    headline: "West African monsoon onset delayed 18 days vs 1980 baseline — food security alert for 12 nations",
    severity: "warning",
    tag: "MONSOON",
  },
  {
    id: "n09",
    timestamp: "06:37 UTC",
    source: "THWAITES-OBS",
    headline: "Thwaites Glacier retreat rate increases to 2.1 km/yr — warm ocean water incursion confirmed beneath ice shelf",
    severity: "critical",
    tag: "WAIS",
  },
  {
    id: "n10",
    timestamp: "07:05 UTC",
    source: "REGEN-CAPITAL",
    headline: "Amazon reforestation corridor reaches 2.4M hectares — carbon sequestration ahead of schedule by 14%",
    severity: "nominal",
    tag: "REGEN",
  },
  {
    id: "n11",
    timestamp: "07:22 UTC",
    source: "IPCC-LIVE",
    headline: "New tipping point interaction study: WAIS + AMOC coupling could accelerate sea level projections by 40%",
    severity: "critical",
    tag: "SCIENCE",
  },
  {
    id: "n12",
    timestamp: "07:51 UTC",
    source: "OCEAN-HEAT",
    headline: "Ocean heat content sets new record — upper 2000m accumulated 10 ZJ above 2023 baseline",
    severity: "warning",
    tag: "OCEAN",
  },
];

const SEVERITY_STYLES: Record<NewsItem["severity"], { dot: string; text: string; tag: string }> = {
  critical: {
    dot: "bg-critical",
    text: "text-critical",
    tag: "bg-critical/15 text-critical border-critical/30",
  },
  warning: {
    dot: "bg-warning",
    text: "text-warning",
    tag: "bg-warning/15 text-warning border-warning/30",
  },
  nominal: {
    dot: "bg-healthy",
    text: "text-healthy",
    tag: "bg-healthy/15 text-healthy border-healthy/30",
  },
  info: {
    dot: "bg-nominal",
    text: "text-nominal",
    tag: "bg-nominal/15 text-nominal border-nominal/30",
  },
};

/* Shuffle helper — keeps feed feeling live */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function NewsTicker() {
  const [feed] = useState<NewsItem[]>(() => shuffle(BASE_FEED));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Rotate headline every 5 seconds unless paused
  useEffect(() => {
    if (paused) return;
    intervalRef.current = window.setInterval(() => {
      setCurrentIdx(i => (i + 1) % feed.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, feed.length]);

  const current = feed[currentIdx];
  const styles = SEVERITY_STYLES[current.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="shrink-0 panel-glass border-t border-border/40 flex items-stretch overflow-hidden"
      style={{ height: "34px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Station badge */}
      <div className="flex items-center gap-1.5 px-3 shrink-0 border-r border-border/30 bg-muted/20">
        <Radio className="w-2.5 h-2.5 text-primary/70" />
        <span className="font-data text-[8px] tracking-widest text-primary/70 whitespace-nowrap">COMMS</span>
        {/* Blinking live dot */}
        <motion.div
          className="w-1 h-1 rounded-full bg-critical"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Source + Tag */}
      <div className="flex items-center gap-2 px-3 shrink-0 border-r border-border/20 bg-muted/10">
        <span className="font-data text-[7px] text-muted-foreground/50 tracking-widest whitespace-nowrap">
          {current.timestamp}
        </span>
        <span className={`font-data text-[7px] tracking-widest border rounded-sm px-1.5 py-0.5 whitespace-nowrap ${styles.tag}`}>
          {current.tag}
        </span>
      </div>

      {/* Scrolling headline */}
      <div className="flex-1 min-w-0 flex items-center px-3 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 min-w-0 w-full"
          >
            <motion.div
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span className={`font-data text-[9px] truncate ${styles.text}`}>
              {current.source}:
            </span>
            <span className="font-data text-[9px] text-foreground/70 truncate">
              {current.headline}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Counter */}
      <div className="flex items-center px-3 shrink-0 border-l border-border/20 bg-muted/10">
        <span className="font-data text-[7px] text-muted-foreground/40 tabular-nums">
          {String(currentIdx + 1).padStart(2, "0")}/{String(feed.length).padStart(2, "0")}
        </span>
      </div>
    </motion.div>
  );
}
