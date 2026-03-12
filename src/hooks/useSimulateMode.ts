import { useState, useRef, useCallback } from "react";

export interface SimNewsItem {
  id: string;
  timestamp: string;
  source: string;
  headline: string;
  severity: "critical" | "warning" | "nominal" | "info";
  tag: string;
}

interface SimulateState {
  active: boolean;
  elapsed: number;        // 0-30 seconds
  phase: number;          // 0-4
  overrideScore: number | null;
  crisisHeadlines: SimNewsItem[];
}

const CRISIS_HEADLINES: SimNewsItem[] = [
  { id: "s01", timestamp: "08:00 UTC", source: "INPE-BRAZIL",    headline: "⚠️ CRITICAL: Amazon tipping threshold breached — deforestation at 23.7% of basin. Self-reinforcing dieback initiated.", severity: "critical", tag: "AMAZON" },
  { id: "s02", timestamp: "08:03 UTC", source: "ATLAS-AI",       headline: "CASCADE INITIATED: Amazon → Sahel moisture recycling disrupted. ITCZ southward shift detected in ECMWF models.", severity: "critical", tag: "CASCADE" },
  { id: "s03", timestamp: "08:07 UTC", source: "AMOC-MONITOR",   headline: "AMOC strength drops 8% in 48h — correlated with Amazon CO₂ pulse of 12 Gt. Atlantic overturning at risk.", severity: "critical", tag: "OCEAN" },
  { id: "s04", timestamp: "08:11 UTC", source: "NSIDC",          headline: "Arctic sea ice losing 340,000 km² above seasonal rate — albedo feedback accelerating. Summer minimum now projected at 2.8M km².", severity: "critical", tag: "CRYO" },
  { id: "s05", timestamp: "08:15 UTC", source: "SAHEL-WATCH",    headline: "Sahel monsoon onset delay now 24 days — food security emergency declared across 8 West African nations.", severity: "critical", tag: "MONSOON" },
  { id: "s06", timestamp: "08:18 UTC", source: "WMO-CLIMATE",    headline: "Global health score collapse: 60 → 47 in 18 minutes. 3 planetary systems now in critical cascade mode.", severity: "critical", tag: "HEALTH" },
  { id: "s07", timestamp: "08:22 UTC", source: "AWI-PERMAFROST", headline: "Siberian thermokarst collapse imminent — CH₄ flux 4.1× above baseline. Permafrost tipping engaged.", severity: "critical", tag: "CARBON" },
  { id: "s08", timestamp: "08:26 UTC", source: "ATLAS-AI",       headline: "PLANETARY ALERT: Health score reaches 31/100. 5 of 9 biomes now in critical state. Emergency intervention required.", severity: "critical", tag: "CRITICAL" },
];

const PHASE_SCORES = [60, 52, 43, 36, 31];

export function useSimulateMode() {
  const [state, setState] = useState<SimulateState>({
    active: false,
    elapsed: 0,
    phase: 0,
    overrideScore: null,
    crisisHeadlines: [],
  });

  const timersRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setState({ active: false, elapsed: 0, phase: 0, overrideScore: null, crisisHeadlines: [] });
  }, []);

  const start = useCallback(() => {
    // Clear any previous
    timersRef.current.forEach(clearTimeout);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setState({ active: true, elapsed: 0, phase: 0, overrideScore: 60, crisisHeadlines: [] });

    // Tick elapsed
    let elapsed = 0;
    intervalRef.current = window.setInterval(() => {
      elapsed += 1;
      setState(s => ({ ...s, elapsed }));
      if (elapsed >= 30) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 1000);

    // Phase transitions (health score)
    const phaseTimings = [0, 6000, 12000, 20000, 27000];
    phaseTimings.forEach((delay, phaseIdx) => {
      const t = window.setTimeout(() => {
        setState(s => ({
          ...s,
          phase: phaseIdx,
          overrideScore: PHASE_SCORES[phaseIdx],
        }));
      }, delay);
      timersRef.current.push(t);
    });

    // Crisis headlines arrive at staggered intervals
    CRISIS_HEADLINES.forEach((item, i) => {
      const t = window.setTimeout(() => {
        setState(s => ({
          ...s,
          crisisHeadlines: [item, ...s.crisisHeadlines].slice(0, 20),
        }));
      }, 1500 + i * 3400);
      timersRef.current.push(t);
    });

    // Auto-stop after 32 seconds
    const stopTimer = window.setTimeout(stop, 32000);
    timersRef.current.push(stopTimer);
  }, [stop]);

  return { simState: state, startSimulation: start, stopSimulation: stop };
}
