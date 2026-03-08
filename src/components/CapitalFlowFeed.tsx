import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Leaf, Droplets, Wind, Fish } from "lucide-react";

interface FlowEvent {
  id: string;
  amount: string;
  target: string;
  region: string;
  type: "reforestation" | "wetland" | "ocean" | "soil" | "wind";
  recovery: string;
  signal: "confirmed" | "emerging" | "monitoring";
  timestamp: number;
}

const REGIONS = [
  { name: "Amazon reforestation corridor",    region: "Brazil",           type: "reforestation" as const, recovery: "Forest canopy +2.1% YOY"          },
  { name: "Mekong delta wetland restoration", region: "SE Asia",           type: "wetland"      as const, recovery: "Mangrove extent +840 km²"         },
  { name: "Sahel green wall — Phase III",     region: "West Africa",       type: "reforestation" as const, recovery: "Soil carbon +0.3 t/ha"            },
  { name: "Kelp forest rewilding",            region: "Patagonia Coast",   type: "ocean"        as const, recovery: "Blue carbon sequestration +12 kt"  },
  { name: "Borneo orangutan corridor",        region: "Indonesia",         type: "reforestation" as const, recovery: "Biodiversity index +4.2%"         },
  { name: "Scottish peatland restoration",    region: "UK",                type: "wetland"      as const, recovery: "CH₄ emissions −18%"               },
  { name: "Coral arc seeding — GBR",         region: "Australia",          type: "ocean"        as const, recovery: "Coral cover +6% pilot zone"       },
  { name: "Regenerative soil network",        region: "Midwest USA",       type: "soil"         as const, recovery: "NDVI +5.3% seasonal"              },
  { name: "Himalayan watershed recovery",     region: "Nepal/India",       type: "wetland"      as const, recovery: "Freshwater flow +22% dry season"  },
  { name: "Atlantic seagrass programme",      region: "West Europe",       type: "ocean"        as const, recovery: "Seagrass extent +1,200 ha"        },
  { name: "Congo basin agroforestry",         region: "DRC",               type: "reforestation" as const, recovery: "Carbon stock +0.8 Gt equivalent"  },
  { name: "Patagonia rewilding — pampas",    region: "Argentina",          type: "soil"         as const, recovery: "Grassland restoration 140k ha"    },
];

const AMOUNTS = ["$8M", "$14M", "$22M", "$31M", "$42M", "$55M", "$67M", "$83M", "$120M", "$200M"];
const SIGNALS: FlowEvent["signal"][] = ["confirmed", "confirmed", "emerging", "emerging", "monitoring"];

function makeEvent(): FlowEvent {
  const r = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  return {
    id:        `${Date.now()}-${Math.random()}`,
    amount:    AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)],
    target:    r.name,
    region:    r.region,
    type:      r.type,
    recovery:  r.recovery,
    signal:    SIGNALS[Math.floor(Math.random() * SIGNALS.length)],
    timestamp: Date.now(),
  };
}

const TYPE_ICON: Record<FlowEvent["type"], React.ReactNode> = {
  reforestation: <Leaf   className="w-3 h-3" />,
  wetland:       <Droplets className="w-3 h-3" />,
  ocean:         <Fish   className="w-3 h-3" />,
  soil:          <Leaf   className="w-3 h-3" />,
  wind:          <Wind   className="w-3 h-3" />,
};

const TYPE_COLOR: Record<FlowEvent["type"], string> = {
  reforestation: "text-healthy border-healthy/30 bg-healthy/8",
  wetland:       "text-primary border-primary/30 bg-primary/8",
  ocean:         "text-nominal border-nominal/30 bg-nominal/8",
  soil:          "text-warning border-warning/30 bg-warning/8",
  wind:          "text-primary border-primary/30 bg-primary/8",
};

const SIGNAL_STYLE: Record<FlowEvent["signal"], string> = {
  confirmed:  "text-healthy",
  emerging:   "text-warning",
  monitoring: "text-nominal",
};

const TOTAL_START = 2_840;

export default function CapitalFlowFeed() {
  const [events, setEvents]   = useState<FlowEvent[]>(() => [makeEvent(), makeEvent(), makeEvent()]);
  const [total, setTotal]     = useState(TOTAL_START);
  const [pulse, setPulse]     = useState(false);
  const timerRef              = useRef<number | null>(null);

  useEffect(() => {
    function scheduleNext() {
      const delay = 3000 + Math.random() * 4000;
      timerRef.current = window.setTimeout(() => {
        const ev = makeEvent();
        const amt = parseInt(ev.amount.replace(/[$M]/g, "")) || 10;
        setEvents(prev => [ev, ...prev].slice(0, 8));
        setTotal(t => t + amt);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-healthy" />
          <span className="font-display text-[10px] tracking-[0.2em] text-foreground/80">REGEN CAPITAL FLOW</span>
        </div>
        <span className="font-data text-[8px] text-muted-foreground/50 animate-pulse-dot tracking-widest">● LIVE</span>
      </div>

      {/* Total deployed counter */}
      <motion.div
        animate={{ scale: pulse ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
        className="shrink-0 bg-healthy/8 border border-healthy/20 rounded-sm px-3 py-2 flex items-baseline justify-between"
      >
        <div>
          <div className="font-data text-[8px] text-muted-foreground tracking-widest">TOTAL DEPLOYED</div>
          <div className="font-display text-lg font-bold text-healthy">${total.toLocaleString()}M</div>
        </div>
        <div className="text-right">
          <div className="font-data text-[8px] text-muted-foreground tracking-widest">RECOVERY SIGNAL</div>
          <div className="font-data text-[10px] text-healthy font-semibold">CONFIRMED</div>
        </div>
      </motion.div>

      {/* Live feed */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
        <AnimatePresence initial={false}>
          {events.map(ev => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: 16, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`shrink-0 rounded-sm border px-2.5 py-2 ${TYPE_COLOR[ev.type]}`}
            >
              <div className="flex items-start gap-2">
                <div className={`shrink-0 mt-0.5 ${TYPE_COLOR[ev.type].split(" ")[0]}`}>
                  {TYPE_ICON[ev.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-display text-[10px] font-bold text-foreground/90 truncate">{ev.amount}</span>
                    <span className="font-data text-[8px] text-muted-foreground/50 shrink-0">
                      {Math.round((Date.now() - ev.timestamp) / 1000)}s ago
                    </span>
                  </div>
                  <div className="font-data text-[9px] text-muted-foreground/80 leading-tight mt-0.5 truncate">
                    deployed → {ev.target}
                  </div>
                  <div className="font-data text-[8px] text-muted-foreground/50 mt-0.5">{ev.region}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="font-data text-[7px] text-muted-foreground/40">ECO SIGNAL:</span>
                    <span className={`font-data text-[7px] font-semibold ${SIGNAL_STYLE[ev.signal]}`}>
                      {ev.signal.toUpperCase()}
                    </span>
                    <span className="font-data text-[7px] text-muted-foreground/60 ml-1 truncate">{ev.recovery}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/30 pt-1.5 font-data text-[8px] text-muted-foreground/40 tracking-wider">
        VERIFIED · NATURE FINANCE · 2026
      </div>
    </div>
  );
}
