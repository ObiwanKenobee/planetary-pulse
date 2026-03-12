import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Expand, GitBranch, Menu } from "lucide-react";
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
import TippingCascade from "@/components/TippingCascade";
import IntroSequence from "@/components/IntroSequence";
import NewsTicker from "@/components/NewsTicker";
import PlanetaryBudget from "@/components/PlanetaryBudget";
import { MobileOverlayDrawer } from "@/components/MobileDrawer";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { useIsMobile } from "@/hooks/use-mobile";

const START_YEAR = 1980;
const END_YEAR   = 2024;

export default function Index() {
  const [introComplete, setIntroComplete] = useState(false);
  const [activeLayer, setActiveLayer]   = useState("none");
  const [activeAlert, setActiveAlert]   = useState<string | null>(null);
  const [overviewActive, setOverviewActive] = useState(false);
  const [cascadeOpen, setCascadeOpen]   = useState(false);
  const [globeYear, setGlobeYear]       = useState(END_YEAR);
  const [mobilePanel, setMobilePanel]   = useState<"layers" | "vitals" | "alerts" | null>(null);
  const [focusRegion, setFocusRegion]   = useState<{ lat: number; lon: number; label: string } | null>(null);

  const realtimeData = useRealtimeData();
  const isMobile = useIsMobile();

  const yearOffset = (globeYear - START_YEAR) / (END_YEAR - START_YEAR);

  const handleZoomToRegion = (lat: number, lon: number, label: string) => {
    setFocusRegion({ lat, lon, label });
    // Auto-switch to regen layer to show the capital overlay
    if (activeLayer !== "regen") setActiveLayer("regen");
    // Reset focus after 8 seconds
    setTimeout(() => setFocusRegion(null), 8000);
  };

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

      {/* ── DESKTOP LAYOUT ── */}
      <div className="relative flex-col h-screen max-h-screen p-3 gap-3 hidden md:flex">

        {/* ── TOP BAR ── */}
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="panel-glass rounded-sm px-4 py-2.5 shrink-0 shadow-panel"
        >
          <div className="flex items-center gap-2">
          <div className="flex-1">
              <HealthScore score={realtimeData.healthScore} vitals={realtimeData.vitals} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCascadeOpen(true)}
                className="flex items-center gap-1.5 font-data text-[9px] tracking-widest text-critical border border-critical/20 rounded-sm px-2.5 py-1.5 hover:bg-critical/10 hover:border-critical/40 transition-all"
                title="Tipping Cascade Simulator"
              >
                <GitBranch className="w-3 h-3" />
                CASCADE
              </button>
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
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.65, delay: 0.15 }}
                className="flex-1 min-h-0 panel-glass rounded-sm shadow-panel overflow-hidden relative"
                style={{ minHeight: 0 }}
              >
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
                  <PlanetaryGlobe
                    activeLayer={activeLayer}
                    yearOffset={yearOffset}
                    focusLat={focusRegion?.lat ?? null}
                    focusLon={focusRegion?.lon ?? null}
                    focusLabel={focusRegion?.label ?? null}
                  />
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

          {/* RIGHT — Vitals + Radar + Alerts + Capital Flow + Budget */}
          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="flex flex-col gap-3 min-h-0 overflow-hidden"
          >
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "130px" }}>
              <VitalsPanel vitals={realtimeData.vitals} />
            </div>
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "175px" }}>
              <EcosystemRadar />
            </div>
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "160px" }}>
              <TippingPointAlerts alerts={ALL_ALERTS} onAlertClick={setActiveAlert} />
            </div>
            {/* Capital Flow Feed */}
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "140px" }}>
              <CapitalFlowFeed onZoomToRegion={handleZoomToRegion} />
            </div>
            {/* Planetary Budget */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="panel-glass rounded-sm p-3 shadow-panel flex-1 min-h-0 overflow-hidden"
            >
              <PlanetaryBudget />
            </motion.div>
          </motion.aside>
        </div>

        {/* ── NEWS TICKER ── bottom of desktop layout */}
        <NewsTicker />
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="flex flex-col h-screen max-h-screen md:hidden">

        {/* Mobile top bar */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-glass px-3 py-2 shrink-0 border-b border-border/30 flex items-center justify-between"
        >
          <HealthScore score={realtimeData.healthScore} vitals={realtimeData.vitals} />
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setOverviewActive(true)}
              className="p-2 rounded-sm border border-primary/20 text-primary"
            >
              <Expand className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobilePanel("layers")}
              className="p-2 rounded-sm border border-border/30 text-muted-foreground"
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.header>

        {/* Globe — full width */}
        <div className="flex-1 min-h-0 relative">
          {globeYear !== END_YEAR && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 font-data text-[9px] tracking-widest bg-warning/15 border border-warning/30 text-warning rounded-sm px-3 py-1 pointer-events-none">
              TIME MACHINE: {globeYear}
            </div>
          )}
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-background">
              <span className="font-data text-[10px] tracking-widest text-muted-foreground animate-pulse-dot">
                INITIALIZING GLOBE...
              </span>
            </div>
          }>
            <PlanetaryGlobe
              activeLayer={activeLayer}
              yearOffset={yearOffset}
              focusLat={focusRegion?.lat ?? null}
              focusLon={focusRegion?.lon ?? null}
              focusLabel={focusRegion?.label ?? null}
            />
          </Suspense>
        </div>

        {/* Mobile bottom bar — time slider */}
        <div className="panel-glass border-t border-border/30 px-3 py-2.5 shrink-0">
          <TimeSlider activeLayer={activeLayer} onYearChange={setGlobeYear} />
        </div>

        {/* Mobile bottom tray — quick panels */}
        <div className="panel-glass border-t border-border/30 px-3 py-2 shrink-0 flex gap-2">
          {[
            { key: "vitals" as const,  label: "VITALS",  badge: undefined },
            { key: "alerts" as const,  label: "ALERTS",  badge: ALL_ALERTS.filter(a => a.severity === "high").length },
            { key: "layers" as const,  label: "LAYERS",  badge: undefined },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => setMobilePanel(p => p === btn.key ? null : btn.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-sm py-2 font-data text-[9px] tracking-widest border transition-all ${
                mobilePanel === btn.key
                  ? "border-primary/40 text-primary bg-primary/10"
                  : "border-border/30 text-muted-foreground"
              }`}
            >
              {btn.label}
              {btn.badge !== undefined && btn.badge > 0 && (
                <span className="text-critical font-semibold">{btn.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile overlay drawers */}
      <MobileOverlayDrawer
        open={mobilePanel === "layers"}
        onClose={() => setMobilePanel(null)}
        title="LAYER CONTROLS"
      >
        <LayerControls activeLayer={activeLayer} onLayerChange={(l) => { setActiveLayer(l); setMobilePanel(null); }} />
      </MobileOverlayDrawer>

      <MobileOverlayDrawer
        open={mobilePanel === "vitals"}
        onClose={() => setMobilePanel(null)}
        title="PLANETARY VITALS"
      >
        <div className="flex flex-col gap-3">
          <div style={{ height: "160px" }}><VitalsPanel vitals={realtimeData.vitals} /></div>
          <div style={{ height: "200px" }}><EcosystemRadar /></div>
          <div style={{ height: "200px" }}><PulseGraph stability={realtimeData.pulseStability} alertLevel={realtimeData.alertLevel} /></div>
        </div>
      </MobileOverlayDrawer>

      <MobileOverlayDrawer
        open={mobilePanel === "alerts"}
        onClose={() => setMobilePanel(null)}
        title="TIPPING POINT ALERTS"
      >
        <div className="flex flex-col gap-3">
          <TippingPointAlerts
            alerts={ALL_ALERTS}
            onAlertClick={(id) => { setActiveAlert(id); setMobilePanel(null); }}
          />
          <div style={{ height: "260px" }}>
            <CapitalFlowFeed onZoomToRegion={(lat, lon, label) => { handleZoomToRegion(lat, lon, label); setMobilePanel(null); }} />
          </div>
        </div>
      </MobileOverlayDrawer>

      {/* Tipping Point Detail Modal */}
      <TippingPointModal alertId={activeAlert} onClose={() => setActiveAlert(null)} />

      {/* Tipping Cascade Simulator */}
      <TippingCascade open={cascadeOpen} onClose={() => setCascadeOpen(false)} />

      {/* Critical Alert Banner */}
      <CriticalAlertBanner
        vitals={realtimeData.vitals}
        tippingAlerts={ALL_ALERTS}
        onAlertClick={setActiveAlert}
      />

      {/* Overview Effect — fullscreen mode */}
      <OverviewEffect active={overviewActive} onClose={() => setOverviewActive(false)} />

      {/* Intro Sequence — cinematic on first load */}
      {!introComplete && <IntroSequence onComplete={() => setIntroComplete(true)} />}
    </div>
  );
}
