import { useState, Suspense } from "react";
import { motion } from "framer-motion";
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
import { useRealtimeData } from "@/hooks/useRealtimeData";

export default function Index() {
  const [activeLayer, setActiveLayer]   = useState("none");
  const [activeAlert, setActiveAlert]   = useState<string | null>(null);
  const realtimeData = useRealtimeData();

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
          <HealthScore score={realtimeData.healthScore} />
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
              {/* Globe */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.65, delay: 0.15 }}
                className="flex-1 min-h-0 panel-glass rounded-sm shadow-panel overflow-hidden relative"
                style={{ minHeight: 0 }}
              >
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <span className="font-data text-[10px] tracking-widest text-muted-foreground animate-pulse-dot">
                      INITIALIZING GLOBE...
                    </span>
                  </div>
                }>
                  <PlanetaryGlobe activeLayer={activeLayer} />
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
                  // Map stress zone to alert if available
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
                <TimeSlider />
              </motion.div>
            </div>
          </div>

          {/* RIGHT — Vitals + Radar + Alerts */}
          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="flex flex-col gap-3 min-h-0 overflow-hidden"
          >
            <div className="panel-glass rounded-sm p-3 shadow-panel flex-1 min-h-0 overflow-hidden">
              <VitalsPanel vitals={realtimeData.vitals} />
            </div>
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "220px" }}>
              <EcosystemRadar />
            </div>
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "235px" }}>
              <TippingPointAlerts alerts={ALL_ALERTS} onAlertClick={setActiveAlert} />
            </div>
          </motion.aside>
        </div>
      </div>

      {/* Tipping Point Detail Modal */}
      <TippingPointModal alertId={activeAlert} onClose={() => setActiveAlert(null)} />
    </div>
  );
}
