import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, Play, Pause, SkipBack } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const START_YEAR = 1980;
const END_YEAR   = 2024;

// Stats at each year (interpolated for demo)
function getYearStats(year: number) {
  const t = (year - START_YEAR) / (END_YEAR - START_YEAR);
  return {
    co2:       (280 + t * 144).toFixed(1),                         // ppm
    temp:      (-0.1 + t * 1.57).toFixed(2),                       // °C anomaly
    arctic:    (7.9 - t * 3.4).toFixed(1),                         // million km²
    forest:    (100 - t * 18).toFixed(1),                          // % remaining
    sea:       (0 + t * 210).toFixed(0),                           // mm rise
  };
}

export default function TimeSlider() {
  const [year, setYear]       = useState(2024);
  const [playing, setPlaying] = useState(false);

  const handleReset = useCallback(() => {
    setYear(START_YEAR);
    setPlaying(false);
  }, []);

  const stats = getYearStats(year);
  const t     = (year - START_YEAR) / (END_YEAR - START_YEAR);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="font-display text-[10px] tracking-[0.2em] text-foreground/80">
            PLANETARY TIME MACHINE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="p-1 rounded hover:bg-muted/50 transition-colors">
            <SkipBack className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            className="flex items-center gap-1.5 font-data text-[9px] tracking-widest text-nominal border border-nominal/20 rounded-sm px-2 py-1 hover:bg-nominal/10 transition-colors"
          >
            {playing ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
            {playing ? "PAUSE" : "PLAY"}
          </button>
        </div>
      </div>

      {/* Year display */}
      <div className="flex items-center gap-4">
        <motion.div
          key={year}
          initial={{ opacity: 0.6, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold text-primary text-glow-cyan shrink-0"
        >
          {year}
        </motion.div>

        {/* Progress indicators */}
        <div className="flex-1 grid grid-cols-5 gap-2">
          {[
            { label: "CO₂",      val: stats.co2,    unit: "ppm", color: "text-warning"  },
            { label: "TEMP Δ",   val: stats.temp,   unit: "°C",  color: year > 2000 ? "text-critical" : "text-warning" },
            { label: "ARCTIC",   val: stats.arctic, unit: "Mkm²",color: year > 2010 ? "text-critical" : "text-nominal" },
            { label: "FOREST",   val: stats.forest, unit: "%",   color: year > 2000 ? "text-warning" : "text-healthy" },
            { label: "SEA RISE", val: stats.sea,    unit: "mm",  color: year > 2010 ? "text-critical" : "text-warning" },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className={`font-data text-xs font-semibold ${item.color}`}>{item.val}</div>
              <div className="font-data text-[8px] text-muted-foreground">{item.unit}</div>
              <div className="font-data text-[7px] text-muted-foreground/50">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <Slider
          min={START_YEAR}
          max={END_YEAR}
          step={1}
          value={[year]}
          onValueChange={([v]) => setYear(v)}
          className="w-full"
        />
        {/* Year ticks */}
        <div className="flex justify-between mt-1.5">
          {[1980, 1990, 2000, 2010, 2020, 2024].map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className="font-data text-[8px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Change bar visualization */}
      <div className="relative h-6 bg-muted/30 rounded-sm overflow-hidden border border-border/30">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-nominal/30 via-warning/40 to-critical/50"
          style={{ width: `${t * 100}%` }}
          transition={{ duration: 0.3 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-data text-[9px] text-muted-foreground tracking-widest">
            {t === 0 ? "PRE-INDUSTRIAL BASELINE" : `${(t * 44).toFixed(1)} YEARS OF CHANGE OBSERVED`}
          </span>
        </div>
      </div>
    </div>
  );
}
