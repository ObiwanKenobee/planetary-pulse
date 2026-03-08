import { useState, useEffect, useRef, useCallback } from "react";

export type VitalStatus = "healthy" | "warning" | "critical" | "nominal";

export interface VitalData {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  unit: string;
  baseline: string;
  trend: "up" | "down" | "stable";
  trendPositive: boolean;
  status: VitalStatus;
  description: string;
  progress: number;
  min: number;
  max: number;
  driftRate: number; // per second
  driftDir: 1 | -1;
}

const initialVitals: VitalData[] = [
  { id: "temp",         label: "TEMPERATURE ANOMALY",  value: 1.47,  displayValue: "+1.47", unit: "°C",  baseline: "±0.0 pre-industrial",     trend: "up",    trendPositive: false, status: "warning",  description: "Global surface mean departure",  progress: 72, min: 1.0,  max: 2.0, driftRate: 0.001, driftDir: 1 },
  { id: "biodiversity", label: "BIODIVERSITY INDEX",    value: 63.4,  displayValue: "63.4",  unit: "%",   baseline: "100% — 1970 baseline",     trend: "down",  trendPositive: false, status: "warning",  description: "Living Planet Index score",        progress: 63, min: 58.0, max: 70.0, driftRate: 0.02, driftDir: -1 },
  { id: "ocean",        label: "OCEAN HEAT CONTENT",   value: 287.4, displayValue: "287.4", unit: "ZJ",  baseline: "1955-2006 mean",           trend: "up",    trendPositive: false, status: "critical", description: "0–2000m depth integrated",         progress: 88, min: 280,  max: 300, driftRate: 0.05, driftDir: 1 },
  { id: "co2",          label: "ATMOSPHERIC CO₂",      value: 424.5, displayValue: "424.5", unit: "ppm", baseline: "280 ppm pre-industrial",   trend: "up",    trendPositive: false, status: "critical", description: "Mauna Loa monthly mean",           progress: 82, min: 420,  max: 430, driftRate: 0.01, driftDir: 1 },
  { id: "vegetation",   label: "GLOBAL VEGETATION",    value: 78.2,  displayValue: "78.2",  unit: "%",   baseline: "100% — 1990 baseline",     trend: "stable",trendPositive: true,  status: "nominal",  description: "NDVI normalized density index",    progress: 78, min: 74.0, max: 82.0, driftRate: 0.015, driftDir: 1 },
  { id: "freshwater",   label: "FRESHWATER STRESS",    value: 65,    displayValue: "HIGH",  unit: "",    baseline: "LOW — nominal",            trend: "up",    trendPositive: false, status: "warning",  description: "Population under water stress",    progress: 65, min: 60,   max: 75, driftRate: 0.02, driftDir: 1 },
];

function calcStatus(vital: VitalData): VitalStatus {
  const pct = (vital.value - vital.min) / (vital.max - vital.min);
  if (vital.trendPositive) {
    if (pct > 0.6) return "nominal";
    if (pct > 0.35) return "warning";
    return "critical";
  } else {
    if (pct > 0.75) return "critical";
    if (pct > 0.45) return "warning";
    return "nominal";
  }
}

function calcProgress(vital: VitalData): number {
  return Math.round(((vital.value - vital.min) / (vital.max - vital.min)) * 100);
}

function calcTrend(prev: number, current: number): "up" | "down" | "stable" {
  const diff = current - prev;
  if (Math.abs(diff) < 0.001) return "stable";
  return diff > 0 ? "up" : "down";
}

function formatValue(vital: VitalData): string {
  if (vital.id === "freshwater") {
    const pct = calcProgress(vital);
    if (pct > 70) return "HIGH";
    if (pct > 45) return "MED";
    return "LOW";
  }
  if (vital.id === "temp") return `+${vital.value.toFixed(2)}`;
  if (vital.unit === "ZJ" || vital.unit === "ppm") return vital.value.toFixed(1);
  return vital.value.toFixed(1);
}

export interface RealtimeData {
  vitals: VitalData[];
  healthScore: number;
  pulseStability: number;  // 0-1
  alertLevel: "nominal" | "warning" | "critical";
}

export function useRealtimeData(): RealtimeData {
  const [state, setState] = useState<RealtimeData>(() => ({
    vitals: initialVitals,
    healthScore: 62,
    pulseStability: 0.72,
    alertLevel: "warning",
  }));

  const vitalsRef = useRef(initialVitals.map(v => ({ ...v })));
  const prevValuesRef = useRef<Record<string, number>>({});

  const tick = useCallback(() => {
    vitalsRef.current = vitalsRef.current.map(vital => {
      const noise = (Math.random() - 0.48) * vital.driftRate * 2;
      let newValue = vital.value + vital.driftDir * vital.driftRate * 0.1 + noise;

      // Bounce off bounds
      if (newValue >= vital.max)      { newValue = vital.max; vital.driftDir = -1; }
      else if (newValue <= vital.min) { newValue = vital.min; vital.driftDir =  1; }

      const prevVal = prevValuesRef.current[vital.id] ?? vital.value;
      prevValuesRef.current[vital.id] = vital.value;

      const updated: VitalData = {
        ...vital,
        value:        newValue,
        displayValue: formatValue({ ...vital, value: newValue }),
        trend:        calcTrend(prevVal, newValue),
        status:       calcStatus({ ...vital, value: newValue }),
        progress:     calcProgress({ ...vital, value: newValue }),
      };
      return updated;
    });

    // Derive health score from vitals
    const critCount   = vitalsRef.current.filter(v => v.status === "critical").length;
    const warnCount   = vitalsRef.current.filter(v => v.status === "warning").length;
    const baseScore   = 62;
    const scoreNoise  = (Math.random() - 0.5) * 0.4;
    const newScore    = Math.round(Math.max(40, Math.min(85,
      baseScore - critCount * 3 - warnCount * 1 + scoreNoise * 5
    )));

    const stability   = Math.max(0.3, Math.min(0.9, 0.72 + (Math.random() - 0.5) * 0.04));
    const alertLevel  = critCount >= 2 ? "critical" : warnCount >= 2 ? "warning" : "nominal";

    setState({
      vitals:          vitalsRef.current.map(v => ({ ...v })),
      healthScore:     newScore,
      pulseStability:  stability,
      alertLevel:      alertLevel as "nominal" | "warning" | "critical",
    });
  }, []);

  useEffect(() => {
    const id = setInterval(tick, 1200);
    return () => clearInterval(id);
  }, [tick]);

  return state;
}
