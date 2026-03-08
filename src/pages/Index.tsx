import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import PlanetaryGlobe from "@/components/PlanetaryGlobe";
import VitalsPanel from "@/components/VitalsPanel";
import PulseGraph from "@/components/PulseGraph";
import LayerControls from "@/components/LayerControls";
import HealthScore from "@/components/HealthScore";
import TippingPointAlerts from "@/components/TippingPointAlerts";
import EcosystemRadar from "@/components/EcosystemRadar";
import TimeSlider from "@/components/TimeSlider";

export default function Index() {
  const [activeLayer, setActiveLayer] = useState("none");

  return (
    <div className="min-h-screen bg-background font-body overflow-hidden relative">
      {/* Grid background */}
      <div
        className="fixed inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(220 20% 14%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 20% 14%) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient glow top-left */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative flex flex-col h-screen max-h-screen p-3 gap-3">

        {/* ── TOP BAR ── */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center panel-glass rounded-sm px-4 py-2.5 shrink-0 shadow-panel"
        >
          <HealthScore score={62} />
        </motion.header>

        {/* ── MAIN GRID ── */}
        <div className="flex-1 min-h-0 grid grid-cols-[200px_1fr_220px] gap-3">

          {/* LEFT COLUMN — Layer Controls */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="panel-glass rounded-sm p-3 shadow-panel overflow-y-auto"
          >
            <LayerControls activeLayer={activeLayer} onLayerChange={setActiveLayer} />
          </motion.aside>

          {/* CENTER COLUMN — Globe + bottom panels */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Globe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="flex-1 min-h-0 panel-glass rounded-sm shadow-panel overflow-hidden relative"
            >
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="font-data text-[10px] tracking-widest text-muted-foreground animate-pulse-dot">
                    INITIALIZING GLOBE...
                  </div>
                </div>
              }>
                <PlanetaryGlobe activeLayer={activeLayer} />
              </Suspense>
            </motion.div>

            {/* Bottom row: Pulse Graph + Time Slider */}
            <div className="grid grid-cols-2 gap-3 shrink-0" style={{ height: "190px" }}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="panel-glass rounded-sm p-3 shadow-panel flex flex-col"
              >
                <PulseGraph />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="panel-glass rounded-sm p-3 shadow-panel flex flex-col justify-between"
              >
                <TimeSlider />
              </motion.div>
            </div>
          </div>

          {/* RIGHT COLUMN — Vitals + Radar + Alerts */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-3 min-h-0 overflow-hidden"
          >
            {/* Vitals */}
            <div className="panel-glass rounded-sm p-3 shadow-panel flex-1 min-h-0 overflow-hidden">
              <VitalsPanel />
            </div>

            {/* Ecosystem Radar */}
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "230px" }}>
              <EcosystemRadar />
            </div>

            {/* Tipping Point Alerts */}
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "240px" }}>
              <TippingPointAlerts />
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
