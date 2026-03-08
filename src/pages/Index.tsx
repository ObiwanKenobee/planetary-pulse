import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Expand } from "lucide-react";
import PlanetaryGlobe from "@/components/PlanetaryGlobe";
import VitalsPanel from "@/components/VitalsPanel";
import PulseGraph from "@/components/PulseGraph";
import LayerControls from "@/components/LayerControls";
import HealthScore from "@/components/HealthScore";
import TippingPointAlerts from "@/components/TippingPointAlerts";
import TippingPointModal, { ALL_ALERTS } from "@/components/TippingPointModal";
import EcosystemRadar from "@/components/EcosystemRadar";
import TimeSlider from "@/components/TimeSlider";
import StressMap from "@/components/StressMap";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import CapitalFlowFeed from "@/components/CapitalFlowFeed";
import OverviewEffect from "@/components/OverviewEffect";
import PlanetaryReport from "@/components/PlanetaryReport";
import { useRealtimeData } from "@/hooks/useRealtimeData";

const START_YEAR = 1980;
const END_YEAR   = 2024;

export default function Index() {
  const [activeLayer, setActiveLayer]   = useState("none");
  const [activeAlert, setActiveAlert]   = useState<string | null>(null);
  const [overviewActive, setOverviewActive] = useState(false);
  const [globeYear, setGlobeYear]       = useState(END_YEAR);
  const realtimeData = useRealtimeData();

  const yearOffset = (globeYear - START_YEAR) / (END_YEAR - START_YEAR);

  return (
    <div className="min-h-screen bg-background font-body overflow-hidden relative">
      {/* Subtle grid */}
      <div
        className="fixed inset-0 opacity-35 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(220 20% 14%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 20% 14%) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Ambient top-center glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] rounded-full bg-primary/4 blur-[130px] pointer-events-none" />

      <div className="relative flex flex-col h-screen max-h-screen p-3 gap-3">

        {/* ── TOP BAR ── */}
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="panel-glass rounded-sm px-4 py-2.5 shrink-0 shadow-panel"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <HealthScore score={realtimeData.healthScore} />
            </div>

            {/* Report + Overview buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <PlanetaryReport
                vitals={realtimeData.vitals}
                healthScore={realtimeData.healthScore}
                tippingAlerts={ALL_ALERTS}
              />
              <button
                onClick={() => setOverviewActive(true)}
                className="flex items-center gap-1.5 font-data text-[9px] tracking-widest text-primary border border-primary/20 rounded-sm px-2.5 py-1.5 hover:bg-primary/10 hover:border-primary/40 transition-all"
                title="Enter Overview Effect"
              >
                <Expand className="w-3 h-3" />
                OVERVIEW
              </button>
            </div>
          </div>
        </motion.header>

        {/* ── MAIN GRID ── */}
        <div className="flex-1 min-h-0 grid grid-cols-[200px_1fr_220px] gap-3">

          {/* LEFT — Layer Controls */}
          <motion.aside
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="panel-glass rounded-sm p-3 shadow-panel overflow-y-auto"
          >
            <LayerControls activeLayer={activeLayer} onLayerChange={setActiveLayer} />
          </motion.aside>

          {/* CENTER — Globe + bottom row */}
          <div className="flex flex-col gap-3 min-h-0">

            {/* Globe + Stress Map stack */}
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              {/* Globe — receives yearOffset from time machine */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.65, delay: 0.15 }}
                className="flex-1 min-h-0 panel-glass rounded-sm shadow-panel overflow-hidden relative"
                style={{ minHeight: 0 }}
              >
                {/* Year badge when not at 2024 */}
                {globeYear !== END_YEAR && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-3 left-1/2 -translate-x-1/2 z-10 font-data text-[10px] tracking-widest bg-warning/15 border border-warning/30 text-warning rounded-sm px-3 py-1 pointer-events-none"
                  >
                    TIME MACHINE: {globeYear}
                  </motion.div>
                )}
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <span className="font-data text-[10px] tracking-widest text-muted-foreground animate-pulse-dot">
                      INITIALIZING GLOBE...
                    </span>
                  </div>
                }>
                  <PlanetaryGlobe activeLayer={activeLayer} yearOffset={yearOffset} />
                </Suspense>
              </motion.div>

              {/* Stress Map */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="panel-glass rounded-sm p-3 shadow-panel shrink-0"
                style={{ height: "160px" }}
              >
                <StressMap onZoneClick={(zone) => {
                  const mapping: Record<string, string> = {
                    amazon: "amz", arctic: "ghis", greenland: "ghis", coral: "gbr"
                  };
                  const alertId = mapping[zone.id];
                  if (alertId) setActiveAlert(alertId);
                }} />
              </motion.div>
            </div>

            {/* Bottom row: Pulse Graph + Time Slider */}
            <div className="grid grid-cols-2 gap-3 shrink-0" style={{ height: "188px" }}>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="panel-glass rounded-sm p-3 shadow-panel"
              >
                <PulseGraph stability={realtimeData.pulseStability} alertLevel={realtimeData.alertLevel} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="panel-glass rounded-sm p-3 shadow-panel"
              >
                <TimeSlider activeLayer={activeLayer} onYearChange={setGlobeYear} />
              </motion.div>
            </div>
          </div>

          {/* RIGHT — Vitals + Radar + Alerts + Capital Flow */}
          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="flex flex-col gap-3 min-h-0 overflow-hidden"
          >
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "160px" }}>
              <VitalsPanel vitals={realtimeData.vitals} />
            </div>
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "200px" }}>
              <EcosystemRadar />
            </div>
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "180px" }}>
              <TippingPointAlerts alerts={ALL_ALERTS} onAlertClick={setActiveAlert} />
            </div>
            {/* Regenerative Capital Flow Feed */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="panel-glass rounded-sm p-3 shadow-panel flex-1 min-h-0 overflow-hidden"
            >
              <CapitalFlowFeed />
            </motion.div>
          </motion.aside>
        </div>
      </div>

      {/* Tipping Point Detail Modal */}
      <TippingPointModal alertId={activeAlert} onClose={() => setActiveAlert(null)} />

      {/* Critical Alert Banner */}
      <CriticalAlertBanner
        vitals={realtimeData.vitals}
        tippingAlerts={ALL_ALERTS}
        onAlertClick={setActiveAlert}
      />

      {/* Overview Effect — fullscreen mode */}
      <OverviewEffect active={overviewActive} onClose={() => setOverviewActive(false)} />
    </div>
  );
}
